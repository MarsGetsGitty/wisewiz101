# Locale / Language File Reader
# ==============================
# Parses Wizard101's .lang locale files to extract display names.
#
# .lang format (UTF-16LE with BOM):
#   Line 0: "1:Items"          ← header (category)
#   Line 1: "00000000"         ← first id (no preceding name)
#   Line 2: ""                 ← blank separator
#   Line 3: "Woolen Hood"      ← display name for NEXT id
#   Line 4: "00000001"         ← id that "Woolen Hood" belongs to
#   Line 5: ""
#   Line 6: "Woolen Robe"      ← display name
#   Line 7: "00000002"         ← id
#
# Key insight: the display name appears BEFORE its 8-digit ID.
# Pattern: name_line, id_line, blank_line, name_line, id_line, ...

from pathlib import Path


class LocaleReader:
    """
    Reads Wizard101 .lang locale files and provides key->name lookup.

    Usage:
        reader = LocaleReader()
        reader.load_from_wad(wad, "Locale/en-US/Items.lang")
        name = reader.get("00008758")
        name = reader.get_by_key("Items_00008758")
    """

    def __init__(self):
        self._entries: dict[str, str] = {}

    @property
    def count(self) -> int:
        return len(self._entries)

    def load_from_bytes(self, raw: bytes) -> int:
        """
        Parse raw .lang file bytes into id->name mappings.
        Returns number of NEW entries loaded (won't overwrite existing).

        .lang format:
            1:Items          <- header
            00000000         <- id 0
            (blank)
            Woolen Hood      <- display name for id 0 (name follows its ID)
            00000001         <- id 1
            (blank)
            Woolen Robe      <- display name for id 1
            ...
        """
        # Decode UTF-16LE (with or without BOM)
        if raw[:2] == b'\xff\xfe':
            text = raw[2:].decode('utf-16-le')
        else:
            text = raw.decode('utf-16-le')

        lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
        added = 0

        # The display name comes AFTER the ID it belongs to.
        # Pattern: id_line, blank, name_line, next_id_line, blank, ...
        last_id = None

        for line in lines:
            stripped = line.strip()

            # Skip empty lines
            if not stripped:
                continue

            # Skip header line (e.g. "1:Items")
            if stripped[0].isdigit() and ':' in stripped and len(stripped) < 20:
                continue

            # Is this an 8-digit numeric ID?
            if len(stripped) == 8 and stripped.isdigit():
                last_id = stripped
            else:
                # This is a display name — it belongs to last_id
                if last_id is not None and last_id not in self._entries:
                    self._entries[last_id] = stripped
                    added += 1
                    last_id = None  # consumed

        return added

    def load_from_wad(self, wad, path: str) -> int:
        """Load a .lang file directly from a WadArchive."""
        raw = wad.extract_file(path)
        return self.load_from_bytes(raw)

    def get(self, item_id: str) -> str:
        """Look up display name by 8-digit id (e.g. '00008758')."""
        return self._entries.get(item_id, "")

    def get_by_key(self, key: str) -> str:
        """
        Look up by Items_XXXXXXXX key format.
        Strips the 'Items_' prefix automatically.
        """
        if '_' in key:
            item_id = key.split('_', 1)[1]
            return self.get(item_id)
        return ""


# ---------------------------------------------------------------------------
# CLI for testing
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from src.wad_reader import WadArchive

    wad = WadArchive(
        r"C:\ProgramData\KingsIsle Entertainment\Wizard101"
        r"\Data\GameData\Root.wad"
    )

    reader = LocaleReader()

    # Load English items
    n = reader.load_from_wad(wad, "Locale/en-US/Items.lang")
    print(f"Loaded {n:,} entries from Items.lang")

    # Also load WizItems for supplementary names
    try:
        n2 = reader.load_from_wad(wad, "Locale/en-US/WizItems.lang")
        print(f"Loaded {n2:,} entries from WizItems.lang")
    except KeyError:
        print("WizItems.lang not found")

    print(f"Total entries: {reader.count:,}")

    # Test known items
    test_keys = [
        "Items_00000001",  # Woolen Hood
        "Items_00000002",  # Woolen Robe
        "Items_00000003",  # Fur Lined Boots
        "Items_00008758",  # Blade of the Felled Titan?
        "Items_00012490",  # Balance Mastery amulet
        "Items_00030142",  # Blank hat
        "Items_00030140",  # Blank wand
        "Items_00030181",  # Wand Drop-S63
    ]

    print(f"\n{'Key':<25s} {'Display Name'}")
    print("-" * 60)
    for key in test_keys:
        name = reader.get_by_key(key)
        print(f"{key:<25s} {name or '(not found)'}")
