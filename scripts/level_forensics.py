"""
Level Forensics: Investigate whether BINd binary files contain embedded level requirements.

Strategy:
1. Read two items from the WAD archive:
   - A known-level item (has -L##- in path, e.g. L90)
   - A tier-coded item (has -T##- in path, no -L##-)
2. Dump all int32LE values from the binary and search for the known level integer.
3. If found, check the same offset in the tier-coded item.
"""

import sys, os, struct, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from wad_reader import WadArchive
from bind_parser import BINdParser

# Path to the WAD archive
WAD_PATH = os.path.join(os.path.dirname(__file__), '..', 'Data', 'GameData', 'Root.wad')
if not os.path.exists(WAD_PATH):
    # Try alternative path
    WAD_PATH = r"C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad"

print(f"Opening WAD: {WAD_PATH}")
wad = WadArchive(WAD_PATH)
print(f"WAD contains {len(wad.files)} files")

# Find our target items
# 1. Known-level items: paths containing -L##-
# 2. Tier-coded items: paths containing -T##- but no -L##-
known_level_items = []
tier_items = []

for f in wad.files:
    if not f.name.endswith('.xml'):
        continue
    basename = os.path.basename(f.name)
    
    level_match = re.search(r'-L(\d+)-', basename)
    tier_match = re.search(r'-T(\d+)', basename)
    
    if level_match and 'Craft' in basename:
        known_level_items.append((f.name, int(level_match.group(1))))
    elif tier_match and not level_match and 'Craft' in basename:
        tier_items.append((f.name, tier_match.group(0)))

print(f"\nFound {len(known_level_items)} crafted items with known levels")
print(f"Found {len(tier_items)} crafted items with tier codes only\n")

parser = BINdParser()

# Analyze a few known-level items
print("=" * 70)
print("PHASE 1: Scanning known-level items for embedded level integer")
print("=" * 70)

level_offsets = {}  # offset -> list of (path, expected_level, found_value)

for path, expected_level in known_level_items[:10]:
    data = wad.extract_file(path)
    if not data or len(data) < 16:
        continue
    
    print(f"\n--- {os.path.basename(path)} (expected level: {expected_level}) ---")
    
    # Search for the expected level as int32LE anywhere in the binary
    found_positions = []
    for offset in range(0, len(data) - 3):
        val = struct.unpack_from('<i', data, offset)[0]
        if val == expected_level:
            found_positions.append(offset)
    
    if found_positions:
        print(f"  Found level {expected_level} at offsets: {found_positions}")
        for pos in found_positions:
            if pos not in level_offsets:
                level_offsets[pos] = []
            level_offsets[pos].append((path, expected_level, expected_level))
    else:
        print(f"  Level {expected_level} NOT found in binary data!")

# Find consistent offsets 
print("\n" + "=" * 70)
print("PHASE 2: Looking for consistent offset patterns")
print("=" * 70)

for offset, matches in sorted(level_offsets.items()):
    if len(matches) >= 2:
        print(f"\nOffset {offset} appears in {len(matches)} items:")
        for path, expected, found in matches:
            print(f"  {os.path.basename(path)}: expected={expected}, found={found}")

# Now check tier items at those same offsets
print("\n" + "=" * 70)
print("PHASE 3: Checking tier-coded items at promising offsets")
print("=" * 70)

promising_offsets = [off for off, matches in level_offsets.items() if len(matches) >= 2]

for path, tier in tier_items[:10]:
    data = wad.extract_file(path)
    if not data or len(data) < 16:
        continue
    
    print(f"\n--- {os.path.basename(path)} ({tier}) ---")
    for offset in promising_offsets:
        if offset + 4 <= len(data):
            val = struct.unpack_from('<i', data, offset)[0]
            print(f"  Offset {offset}: value = {val}")
        else:
            print(f"  Offset {offset}: out of bounds (file is {len(data)} bytes)")

# Also extract all strings from a tier item to see if there's a level string
print("\n" + "=" * 70)
print("PHASE 4: Full string dump of first tier-coded item")
print("=" * 70)

if tier_items:
    path, tier = tier_items[0]
    data = wad.extract_file(path)
    if data:
        item = parser.parse(data, source_path=path)
        if item:
            print(f"Item: {item.name}")
            print(f"Display: {item.display_name}")
            print(f"Level: {item.level_req}")
            print(f"Stats: {item.stats}")
        
        # Dump ALL strings from this file
        strings = parser._extract_strings(data)
        print(f"\nAll extracted strings ({len(strings)}):")
        for s in strings:
            print(f"  pos={s['pos']:4d}  text={s['text']}")
