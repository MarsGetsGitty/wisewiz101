"""
Stat Value Forensics v2 — Post-value structure analysis
========================================================
Investigates the full binary layout AFTER each stat value to find
what other int32 values exist in the record and whether they explain
the universal -1 offset.
"""
import sys
import struct
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from src.wad_reader import WadArchive

WAD_PATH = (
    r"C:\ProgramData\KingsIsle Entertainment\Wizard101"
    r"\Data\GameData\Root.wad"
)

GAP = bytes([0x60, 0x00, 0x00, 0x00, 0xCC, 0x4F, 0xF4, 0x60])

# Amulet of Divine Influence
# Wiki: +200 HP, +3% Pierce, +30 Critical, +3% Resist, +45 Block
TEST_FILES = [
    ("ObjectData/Aquila Gear/Amulets/Amulet-AQ-L90-001.xml",
     "Amulet of Divine Influence",
     {"MaxHealth": 200, "AllArmorPiercing": 3, "AllBlock": 45,
      "AllCriticalHit": 30, "AllReduceDamage": 3}),
]


def find_canonical_name(data, gap_idx):
    """Find the Canonical* string that precedes this gap."""
    for back in range(4, 100):
        pos = gap_idx - back
        if pos < 0:
            break
        length_byte = data[pos]
        str_len = length_byte // 2
        if str_len > 2 and str_len < 80 and pos + 1 + str_len == gap_idx:
            try:
                name = data[pos + 1 : pos + 1 + str_len].decode("ascii")
                if name.startswith("Canonical"):
                    return name[9:]  # strip "Canonical"
            except (UnicodeDecodeError, ValueError):
                pass
    return "???"


def main():
    wad = WadArchive(WAD_PATH)

    for path, display_name, expected in TEST_FILES:
        data = wad.extract_file(path)
        print(f"=== {display_name} ({path}) ===")
        print(f"File size: {len(data)} bytes\n")

        header = f"{'Stat':<30s} {'raw':>6s}  {'raw+1':>6s}  {'wiki':>6s}  {'next_hash':>10s}  {'val2':>6s}  {'val3':>6s}  {'val2/2':>6s}"
        print(header)
        print("-" * len(header))

        pos = 0
        while pos < len(data) - 20:
            idx = data.find(GAP, pos)
            if idx == -1:
                break

            stat_name = find_canonical_name(data, idx)

            # Read: int32 value at gap+8
            raw = struct.unpack_from("<i", data, idx + 8)[0]

            # Read: next 4 bytes (likely hash) at gap+12
            next_hash = struct.unpack_from("<I", data, idx + 12)[0]

            # Read: val2 at gap+16
            val2 = struct.unpack_from("<i", data, idx + 16)[0] if idx + 20 <= len(data) else -1

            # Read: val3 at gap+20
            val3 = struct.unpack_from("<i", data, idx + 20)[0] if idx + 24 <= len(data) else -1

            wiki = expected.get(stat_name, "?")

            print(f"{stat_name:<30s} {raw:6d}  {raw+1:6d}  {str(wiki):>6s}  0x{next_hash:08X}  {val2:6d}  {val3:6d}  {val2/2:6.1f}")

            pos = idx + 8

        print()

    # Now test with Blade of the Felled Titan (Athame)
    # Wiki: +320 HP, +210 Mana, +17% Power Pip, +15% Damage, +15 Block, +17% Healing
    path2 = "ObjectData/Aquila Gear/Athames/Athame-AQ-L90-001.xml"
    expected2 = {"MaxHealth": 320, "MaxMana": 210, "PowerPip": 17,
                 "AllDamage": 15, "AllBlock": 15, "LifeHealing": 17}
    data2 = wad.extract_file(path2)
    print(f"=== Blade of the Felled Titan ({path2}) ===")
    print(f"File size: {len(data2)} bytes\n")

    header = f"{'Stat':<30s} {'raw':>6s}  {'raw+1':>6s}  {'wiki':>6s}  {'next_hash':>10s}  {'val2':>6s}  {'val3':>6s}  {'val2/2':>6s}"
    print(header)
    print("-" * len(header))

    pos = 0
    while pos < len(data2) - 20:
        idx = data2.find(GAP, pos)
        if idx == -1:
            break

        stat_name = find_canonical_name(data2, idx)
        raw = struct.unpack_from("<i", data2, idx + 8)[0]
        next_hash = struct.unpack_from("<I", data2, idx + 12)[0]
        val2 = struct.unpack_from("<i", data2, idx + 16)[0] if idx + 20 <= len(data2) else -1
        val3 = struct.unpack_from("<i", data2, idx + 20)[0] if idx + 24 <= len(data2) else -1
        wiki = expected2.get(stat_name, "?")

        print(f"{stat_name:<30s} {raw:6d}  {raw+1:6d}  {str(wiki):>6s}  0x{next_hash:08X}  {val2:6d}  {val3:6d}  {val2/2:6.1f}")

        pos = idx + 8

    # Also check: is val2/2 = wiki for flat stats?
    # And for percentage stats, what pattern fits?
    print("\n\n=== Summary: Does raw+1 ALWAYS match wiki? ===")
    all_items = [
        ("ObjectData/Aquila Gear/Amulets/Amulet-AQ-L90-001.xml",
         {"MaxHealth": 200, "AllArmorPiercing": 3, "AllBlock": 45,
          "AllCriticalHit": 30, "AllReduceDamage": 3}),
        ("ObjectData/Aquila Gear/Athames/Athame-AQ-L90-001.xml",
         {"MaxHealth": 320, "MaxMana": 210, "PowerPip": 17,
          "AllDamage": 15, "AllBlock": 15, "LifeHealing": 17}),
    ]
    matches = 0
    total = 0
    for path, exp in all_items:
        d = wad.extract_file(path)
        p = 0
        while p < len(d) - 12:
            idx = d.find(GAP, p)
            if idx == -1:
                break
            stat_name = find_canonical_name(d, idx)
            raw = struct.unpack_from("<i", d, idx + 8)[0]
            wiki = exp.get(stat_name)
            if wiki is not None:
                total += 1
                ok = (raw + 1 == wiki)
                matches += ok
                if not ok:
                    print(f"  MISMATCH: {stat_name} raw={raw}, raw+1={raw+1}, wiki={wiki}")
            p = idx + 8

    print(f"\n  raw+1 == wiki for {matches}/{total} stats")


if __name__ == "__main__":
    main()
