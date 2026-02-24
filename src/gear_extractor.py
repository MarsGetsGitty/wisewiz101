# Gear Data Extractor
# ===================
# Combines WadArchive + BINdParser to extract all gear items from Root.wad
# and produce a structured JSON database.
#
# Usage:
#   python src/gear_extractor.py [--wad PATH] [--output PATH] [--format json|csv]
#   python src/gear_extractor.py --stats  (just print summary stats)

import csv
import json
import os
import re
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.bind_parser import BIND_MAGIC, BINdParser, GearItem
from src.locale_reader import LocaleReader
from src.wad_reader import WadArchive

# Patterns that identify gear ObjectData files
GEAR_PATH_RE = re.compile(
    r"ObjectData/.+/"
    r"(Hat|Robe|Boot|Shoe|Wand|Athame|Amulet|Ring|Deck)"
    r".*\.xml$",
    re.IGNORECASE,
)

# Paths to exclude (non-player items)
EXCLUDE_PATTERNS = [
    r"/Housing/",
    r"/Pets/",
    r"/Mounts/",
    r"/Jewels/",
    r"/Seeds/",
    r"/Reagents/",
    r"/Elixirs/",
    r"/Snacks/",
    r"/TreasureCards/",
    r"/Spells/",
    r"/Minion",
]

EXCLUDE_RE = re.compile("|".join(EXCLUDE_PATTERNS), re.IGNORECASE)

# Default paths
DEFAULT_WAD = (
    r"C:\ProgramData\KingsIsle Entertainment\Wizard101"
    r"\Data\GameData\Root.wad"
)
DEFAULT_OUTPUT_DIR = str(Path(__file__).parent.parent / "output")


class GearExtractor:
    """
    Extracts all gear items from a Wizard101 Root.wad archive.

    Usage:
        extractor = GearExtractor("path/to/Root.wad")
        items = extractor.extract_all()
        extractor.save_json(items, "output/gear_database.json")
    """

    def __init__(self, wad_path: str = DEFAULT_WAD, load_locale: bool = True):
        self.wad = WadArchive(wad_path)
        self.parser = BINdParser()
        self.locale = LocaleReader()
        if load_locale:
            self._load_locale()

    def _load_locale(self) -> None:
        """Load English item display names from locale files in the WAD."""
        for lang_path in ["Locale/en-US/Items.lang", "Locale/en-US/WizItems.lang"]:
            try:
                n = self.locale.load_from_wad(self.wad, lang_path)
                print(f"Locale: {n:,} names from {lang_path}", file=sys.stderr)
            except (KeyError, Exception):
                pass
        print(f"Locale: {self.locale.count:,} total display names", file=sys.stderr)

    def find_gear_files(self) -> list:
        """Find all WAD entries that look like gear item definitions."""
        candidates = []
        for entry in self.wad.files:
            if not entry.name.endswith(".xml"):
                continue
            if not entry.name.startswith("ObjectData/"):
                continue
            if EXCLUDE_RE.search(entry.name):
                continue
            if GEAR_PATH_RE.search(entry.name):
                candidates.append(entry)
        return candidates

    def extract_all(self, progress: bool = True) -> list:
        """
        Extract and parse all gear items.

        Returns list of GearItem objects (only items that parsed successfully
        and have a name).
        """
        entries = self.find_gear_files()
        total = len(entries)
        items: list[GearItem] = []
        errors = 0
        skipped = 0
        start = time.time()

        for i, entry in enumerate(entries):
            if progress and (i + 1) % 2000 == 0:
                elapsed = time.time() - start
                rate = (i + 1) / elapsed
                print(
                    f"  [{i+1:,}/{total:,}] "
                    f"{rate:.0f} files/sec  "
                    f"{items.__len__():,} items  "
                    f"{errors} errors",
                    file=sys.stderr,
                )

            try:
                raw = self.wad._extract_entry(entry)
            except Exception:
                errors += 1
                continue

            # Quick check: is this BINd data?
            if len(raw) < 12 or raw[:4] != BIND_MAGIC:
                skipped += 1
                continue

            item = self.parser.parse(raw, source_path=entry.name)
            if item and item.name:
                # Resolve display name from locale
                if item.display_name_key:
                    item.display_name = self.locale.get_by_key(
                        item.display_name_key
                    )
                items.append(item)

        elapsed = time.time() - start

        if progress:
            print(
                f"\nDone: {total:,} files scanned in {elapsed:.1f}s "
                f"({total/elapsed:.0f} files/sec)",
                file=sys.stderr,
            )
            print(
                f"  {len(items):,} gear items extracted, "
                f"{skipped} non-BINd skipped, "
                f"{errors} read errors",
                file=sys.stderr,
            )

        return items

    @staticmethod
    def save_json(items: list, path: str) -> None:
        """Save gear items as a JSON array."""
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        data = [item.to_dict(include_raw=True) for item in items]
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(data):,} items to {path}", file=sys.stderr)

    @staticmethod
    def save_csv(items: list, path: str) -> None:
        """Save gear items as a flat CSV (stats as columns)."""
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

        # Collect all stat names across all items
        all_stats = set()
        for item in items:
            all_stats.update(item.stats.keys())
        stat_cols = sorted(all_stats)

        fieldnames = [
            "name", "display_name", "item_type", "school", "rarity",
            "level_req", "display_name_key", "flags", "sockets", "set_name",
        ] + stat_cols + ["source_path"]

        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for item in items:
                row = {
                    "name": item.name,
                    "display_name": getattr(item, 'display_name', ''),
                    "item_type": item.item_type,
                    "school": item.school,
                    "rarity": item.rarity,
                    "level_req": item.level_req,
                    "display_name_key": item.display_name_key,
                    "flags": "|".join(item.flags),
                    "sockets": "|".join(item.sockets),
                    "set_name": item.set_name,
                    "source_path": item.source_path,
                }
                for stat in stat_cols:
                    row[stat] = item.stats.get(stat, "")
                writer.writerow(row)

        print(f"Saved {len(items):,} items to {path}", file=sys.stderr)

    @staticmethod
    def print_summary(items: list) -> None:
        """Print summary statistics about extracted gear."""
        print(f"\n{'='*60}")
        print("  GEAR DATABASE SUMMARY")
        print(f"{'='*60}")
        print(f"  Total items: {len(items):,}")

        # By type
        by_type: dict[str, int] = {}
        for item in items:
            t = item.item_type or "(unknown)"
            by_type[t] = by_type.get(t, 0) + 1
        print("\n  By Type:")
        for t in sorted(by_type, key=lambda k: by_type[k], reverse=True):
            print(f"    {t:12s} {by_type[t]:,}")

        # By rarity
        by_rarity: dict[str, int] = {}
        for item in items:
            r = item.rarity or "(none)"
            by_rarity[r] = by_rarity.get(r, 0) + 1
        print("\n  By Rarity:")
        for r in sorted(by_rarity, key=lambda k: by_rarity[k], reverse=True):
            print(f"    {r:18s} {by_rarity[r]:,}")

        # By school
        by_school: dict[str, int] = {}
        for item in items:
            s = item.school or "(none)"
            by_school[s] = by_school.get(s, 0) + 1
        print("\n  By School:")
        for s in sorted(by_school, key=lambda k: by_school[k], reverse=True):
            print(f"    {s:12s} {by_school[s]:,}")

        # Stats coverage
        with_stats = sum(1 for i in items if i.has_stats)
        blanks = sum(1 for i in items if i.is_blank)
        print(f"\n  Has stats:    {with_stats:,}")
        print(f"  Blanks:       {blanks:,}")
        print(f"  With flags:   {sum(1 for i in items if i.flags):,}")
        print(f"  With sockets: {sum(1 for i in items if i.sockets):,}")

        # All unique stat names
        all_stats = set()
        for item in items:
            all_stats.update(item.stats.keys())
        print(f"\n  Unique stat types: {len(all_stats)}")
        for s in sorted(all_stats):
            count = sum(1 for i in items if s in i.stats)
            print(f"    {s:30s} {count:,} items")

        print(f"{'='*60}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    import argparse

    ap = argparse.ArgumentParser(description="Extract Wizard101 gear data")
    ap.add_argument("--wad", default=DEFAULT_WAD, help="Path to Root.wad")
    ap.add_argument("--output", default=None, help="Output file path")
    ap.add_argument(
        "--format", choices=["json", "csv", "both"], default="json",
        help="Output format (default: json)"
    )
    ap.add_argument("--stats", action="store_true", help="Print summary only")
    args = ap.parse_args()

    extractor = GearExtractor(args.wad)

    print(f"WAD: {args.wad}", file=sys.stderr)
    print(f"Files in WAD: {len(extractor.wad.files):,}", file=sys.stderr)

    gear_files = extractor.find_gear_files()
    print(f"Gear candidates: {len(gear_files):,}", file=sys.stderr)

    print("\nExtracting...", file=sys.stderr)
    items = extractor.extract_all()

    extractor.print_summary(items)

    if args.stats:
        return

    out_dir = DEFAULT_OUTPUT_DIR
    if args.output:
        out_dir = os.path.dirname(args.output) or out_dir

    if args.format in ("json", "both"):
        json_path = args.output or os.path.join(out_dir, "gear_database.json")
        extractor.save_json(items, json_path)

    if args.format in ("csv", "both"):
        csv_path = args.output or os.path.join(out_dir, "gear_database.csv")
        if args.format == "both":
            csv_path = os.path.join(out_dir, "gear_database.csv")
        extractor.save_csv(items, csv_path)


if __name__ == "__main__":
    main()
