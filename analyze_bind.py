"""
Investigate items with unknown types — what are they and why didn't we detect a type?
Also spot-check stat values against known wiki data.
"""
import sys
import json
import struct
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).parent))
from src.wad_reader import WadArchive
from src.bind_parser import BINdParser, BIND_MAGIC

wad = WadArchive(r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad')
parser = BINdParser()

# Load full extraction to analyze unknown types
with open(r'C:\ProgramData\KingsIsle Entertainment\wisewiz101\output\gear_database.json') as f:
    items = json.load(f)

unknown = [i for i in items if not i['item_type']]
known = [i for i in items if i['item_type']]

print(f"Total: {len(items):,}")
print(f"Known type: {len(known):,}")
print(f"Unknown type: {len(unknown):,}")

# What paths do unknown-type items come from?
print(f"\n=== Unknown Type: Path patterns (top 30) ===")
path_parts = Counter()
for i in unknown:
    parts = i['source_path'].split('/')
    # Get 2nd-level dir and the slot-like part
    if len(parts) >= 3:
        path_parts[parts[2]] += 1  # e.g. "Hats", "Robes"
for k, v in path_parts.most_common(30):
    print(f"  {k:30s} {v:,}")

# Look at all extracted strings from a sample unknown item
print(f"\n=== Sample unknown items ===")
for i in unknown[:5]:
    print(f"\n  Path: {i['source_path']}")
    print(f"  Name: {i['name']}")
    print(f"  Stats: {i['stats']}")
    print(f"  Rarity: {i['rarity']}")
    print(f"  School: {i['school']}")
    
    # Re-parse to see ALL strings
    try:
        raw = wad.extract_file(i['source_path'])
        strings = parser._extract_strings(raw)
        all_texts = [s['text'] for s in strings]
        print(f"  All strings: {all_texts}")
    except:
        pass

# Check: do unknown items have equipment-like strings that we missed?
print(f"\n=== Scanning unknown items for type-like strings ===")
type_candidates = Counter()
for i in unknown[:500]:  # sample 500
    try:
        raw = wad.extract_file(i['source_path'])
        strings = parser._extract_strings(raw)
        for s in strings:
            t = s['text']
            # Look for potential type identifiers we missed
            if len(t) < 20 and t[0].isupper() and not t.startswith(('FLAG_', 'RT_', 'OT_', 
                    'ROP_', 'OPERATOR', 'Canonical', 'SOCKET', 'Items_', 'NO_', 'Textures',
                    'MALE', 'FEMALE', 'NONE', 'Scene', 'Char')):
                if 'Behavior' not in t and '/' not in t and '|' not in t and '.' not in t:
                    if '-' not in t and '_' not in t:
                        type_candidates[t] += 1
    except:
        pass

print("Short capitalized strings in unknowns (top 30):")
for k, v in type_candidates.most_common(30):
    print(f"  {k:30s} {v:,}")
