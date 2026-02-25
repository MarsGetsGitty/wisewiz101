"""
Level Forensics v2: Focus on the OPERATOR_GREATER_THAN_EQ requirement expression tree.

Hypothesis: The level requirement is encoded as a conditional expression like:
  ROP_AND -> OPERATOR_GREATER_THAN_EQ -> <level_value>

This script will:
1. Find the OPERATOR_GREATER_THAN_EQ string position
2. Scan nearby bytes (within 50 bytes) for int32LE values that match known levels
3. Compare known-level items vs tier-coded items to verify
"""

import sys, os, struct, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from wad_reader import WadArchive
from bind_parser import BINdParser

WAD_PATH = r"C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad"
wad = WadArchive(WAD_PATH)
parser = BINdParser()

def dump_region(data, center, radius=40):
    """Dump bytes and int32 values around a specific offset."""
    start = max(0, center - radius)
    end = min(len(data), center + radius)
    
    # Show int32LE values in the region
    results = []
    for off in range(start, end - 3):
        val = struct.unpack_from('<i', data, off)[0]
        if 1 <= val <= 200:  # Plausible level range
            results.append((off, val))
    return results

def analyze_item(path, expected_level=None):
    """Analyze a single item for level requirement patterns."""
    data = wad.extract_file(path)
    if not data:
        return None
    
    strings = parser._extract_strings(data)
    basename = os.path.basename(path)
    
    print(f"\n{'='*60}")
    print(f"  {basename} (expected level: {expected_level or '???'})")
    print(f"  File size: {len(data)} bytes")
    print(f"{'='*60}")
    
    # Find operator strings and their positions
    operator_positions = []
    rop_positions = []
    for s in strings:
        if 'OPERATOR' in s['text']:
            operator_positions.append(s)
            print(f"  OPERATOR at pos {s['pos']}: {s['text']}")
        elif 'ROP_' in s['text']:
            rop_positions.append(s)
            print(f"  ROP at pos {s['pos']}: {s['text']}")
    
    # For each operator, scan nearby bytes for plausible levels
    for op in operator_positions:
        op_end = op['end']
        print(f"\n  Scanning bytes after '{op['text']}' (end pos {op_end}):")
        
        # Scan the next 60 bytes after the operator string
        for off in range(op_end, min(op_end + 60, len(data) - 3)):
            val = struct.unpack_from('<i', data, off)[0]
            if 1 <= val <= 200:
                # Check if this could be a level
                marker = " <-- MATCHES EXPECTED!" if expected_level and val == expected_level else ""
                print(f"    offset {off} (op+{off-op_end}): int32={val}{marker}")
    
    # Also check for any int16LE values near operators
    for op in operator_positions:
        op_end = op['end']
        print(f"\n  Scanning int16 after '{op['text']}':")
        for off in range(op_end, min(op_end + 40, len(data) - 1)):
            val = struct.unpack_from('<H', data, off)[0]
            if 1 <= val <= 200:
                marker = " <-- MATCHES!" if expected_level and val == expected_level else ""
                print(f"    offset {off} (op+{off-op_end}): int16={val}{marker}")
    
    # Raw hex dump around operator
    if operator_positions:
        op = operator_positions[0]
        start = max(0, op['pos'] - 20)
        end = min(len(data), op['end'] + 60)
        print(f"\n  Hex dump [{start}:{end}]:")
        for row_off in range(start, end, 16):
            row_end = min(row_off + 16, end)
            hex_str = ' '.join(f'{data[i]:02x}' for i in range(row_off, row_end))
            ascii_str = ''.join(chr(data[i]) if 32 <= data[i] < 127 else '.' for i in range(row_off, row_end))
            print(f"    {row_off:5d}: {hex_str:<48s}  {ascii_str}")
    
    return data

# ============================================
# Test with known-level crafted items
# ============================================
print("\n" + "#" * 70)
print("# KNOWN-LEVEL ITEMS (crafted with -L##- in path)")
print("#" * 70)

known_items = [
    ("ObjectData/Aquila Gear/Hats/Hat-Craft-AQ-Senator-L30-001.xml", 30),
    ("ObjectData/Aquila Gear/Hats/Hat-Craft-AQ-Senator-L30-004.xml", 30),
]

# Find more level-coded crafted items at different levels
for f in wad.files:
    if 'Craft' in f.name and f.name.endswith('.xml'):
        m = re.search(r'-L(\d+)-', os.path.basename(f.name))
        if m:
            lvl = int(m.group(1))
            if lvl not in [30] and len(known_items) < 6:
                known_items.append((f.name, lvl))

for path, level in known_items:
    analyze_item(path, expected_level=level)

# ============================================  
# Test with tier-coded items
# ============================================
print("\n" + "#" * 70)
print("# TIER-CODED ITEMS (no -L##- in path)")
print("#" * 70)

tier_test_items = [
    "ObjectData/CraftedEquipment/Athames/Athame-Craft-T2-005.xml",   # Lifebringer's Athame (wiki says L10)
    "ObjectData/CraftedEquipment/Rings/Ring-Craft-T2-002.xml",       # Ring of Insight
    "ObjectData/CraftedEquipment/Amulets/Amulet-Craft-T10-KR-001.xml",
]

# Find items from different tiers
for tier_num in [1, 3, 4, 5, 6, 7, 8, 9, 11]:
    for f in wad.files:
        bname = os.path.basename(f.name)
        if f'Craft-T{tier_num}-' in bname and f.name.endswith('.xml'):
            tier_test_items.append(f.name)
            break

for path in tier_test_items:
    analyze_item(path)
