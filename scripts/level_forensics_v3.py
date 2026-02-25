"""
Level Forensics v3: Verify float32 level hypothesis.

Hypothesis: The level requirement is stored as a 32-bit IEEE 754 float
at a fixed offset relative to the OPERATOR_GREATER_THAN_EQ string.

L30: bytes `00 00 f0 41` = 0x41F00000 = 30.0f
L70: bytes `00 00 8c 42` = 0x428C0000 = 70.0f
"""

import sys, os, struct, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from wad_reader import WadArchive
from bind_parser import BINdParser

WAD_PATH = r"C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad"
wad = WadArchive(WAD_PATH)
parser = BINdParser()

def find_float_level(data, strings):
    """Search for the level as a float32 near OPERATOR_GREATER_THAN_EQ."""
    for s in strings:
        if s['text'] == 'OPERATOR_GREATER_THAN_EQ':
            op_pos = s['pos']
            # Check for float32 values in a window BEFORE the operator string
            # The pattern appears to be: ... <float32_level> <gap_bytes> <operator_string>
            for off in range(max(0, op_pos - 30), op_pos):
                if off + 4 <= len(data):
                    fval = struct.unpack_from('<f', data, off)[0]
                    if 1.0 <= fval <= 200.0 and fval == int(fval):
                        return int(fval), off, op_pos
    return None, None, None

# Collect ALL crafted items and check which ones have the operator string
print("Scanning ALL crafted gear items for level requirement data...")
print("=" * 70)

results = {
    'has_operator_and_level': [],
    'has_operator_no_level': [],
    'no_operator': [],
}

all_craft_files = [f for f in wad.files if 'Craft' in f.name and f.name.endswith('.xml')]
print(f"Total crafted items in WAD: {len(all_craft_files)}")

for f in all_craft_files:
    data = wad.extract_file(f.name)
    if not data or len(data) < 16:
        continue
    
    strings = parser._extract_strings(data)
    has_operator = any(s['text'] == 'OPERATOR_GREATER_THAN_EQ' for s in strings)
    
    if has_operator:
        level, off, op_pos = find_float_level(data, strings)
        if level:
            results['has_operator_and_level'].append((f.name, level))
        else:
            results['has_operator_no_level'].append(f.name)
    else:
        results['no_operator'].append(f.name)

print(f"\nResults:")
print(f"  Items WITH OPERATOR_GREATER_THAN_EQ + float level: {len(results['has_operator_and_level'])}")
print(f"  Items WITH OPERATOR but NO float level found: {len(results['has_operator_no_level'])}")
print(f"  Items WITHOUT OPERATOR_GREATER_THAN_EQ: {len(results['no_operator'])}")

# Show some samples of each category
print("\n--- Sample items WITH embedded float level ---")
level_dist = {}
for path, level in results['has_operator_and_level'][:20]:
    basename = os.path.basename(path)
    # Extract tier/season from path
    tier_match = re.search(r'-(T\d+|S\d+|L\d+)', basename)
    tag = tier_match.group(1) if tier_match else '???'
    print(f"  {basename}: level={level}, tag={tag}")
    if tag not in level_dist:
        level_dist[tag] = set()
    level_dist[tag].add(level)

# Build ALL tier-level mappings from these results
print("\n--- Building tier-to-level mapping from ALL data ---")
level_dist_all = {}
for path, level in results['has_operator_and_level']:
    basename = os.path.basename(path)
    tier_match = re.search(r'-(T\d+|S\d+|L\d+)', basename)
    tag = tier_match.group(1) if tier_match else '???'
    if tag not in level_dist_all:
        level_dist_all[tag] = set()
    level_dist_all[tag].add(level)

for tag in sorted(level_dist_all.keys(), key=lambda x: (x[0], int(re.search(r'\d+', x).group()))):
    levels = sorted(level_dist_all[tag])
    print(f"  {tag}: levels = {levels}")

# Show sample items WITHOUT operator
print("\n--- Sample items WITHOUT OPERATOR (no level requirement) ---")
for path in results['no_operator'][:15]:
    print(f"  {os.path.basename(path)}")

# Now let's also check ALL items (not just crafted)
print("\n" + "=" * 70)
print("FULL SCAN: All gear items in WAD")
print("=" * 70)

all_gear_files = [f for f in wad.files if 'ObjectData' in f.name and f.name.endswith('.xml')]
print(f"Total gear files: {len(all_gear_files)}")

total_with_level = 0
total_without_operator = 0
total_scanned = 0

full_tier_map = {}

for f in all_gear_files:
    data = wad.extract_file(f.name)
    if not data or len(data) < 16:
        continue
    
    # Quick check: does it start with BINd magic?
    if data[:4] != b'BINd':
        continue
    
    total_scanned += 1
    strings = parser._extract_strings(data)
    has_operator = any(s['text'] == 'OPERATOR_GREATER_THAN_EQ' for s in strings)
    
    if has_operator:
        level, off, op_pos = find_float_level(data, strings)
        if level:
            total_with_level += 1
            basename = os.path.basename(f.name)
            tier_match = re.search(r'-(T\d+|S\d+)', basename)
            if tier_match:
                tag = tier_match.group(1)
                if tag not in full_tier_map:
                    full_tier_map[tag] = set()
                full_tier_map[tag].add(level)
    else:
        total_without_operator += 1

print(f"\nTotal BINd gear files scanned: {total_scanned}")
print(f"Items with float level requirement: {total_with_level} ({100*total_with_level/total_scanned:.1f}%)")
print(f"Items WITHOUT any operator (no level req): {total_without_operator} ({100*total_without_operator/total_scanned:.1f}%)")

print("\n--- FULL Tier/Season -> Level mapping ---")
for tag in sorted(full_tier_map.keys(), key=lambda x: (x[0], int(re.search(r'\d+', x).group()))):
    levels = sorted(full_tier_map[tag])
    print(f"  {tag}: {levels}")
