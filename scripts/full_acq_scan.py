"""
Full-scale BINd scan: check FLAG_CrownsOnly and 'Crafted' strings across ALL items.
Goal: determine if binary strings can reliably classify acquisition type.
"""
import sys, os, json
from collections import Counter
sys.path.insert(0, 'C:/ProgramData/KingsIsle Entertainment/wisewiz101/src')
from wad_reader import WadArchive
from bind_parser import BINdParser

wad = WadArchive(r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad')
parser = BINdParser()

with open('C:/ProgramData/KingsIsle Entertainment/wisewiz101/web/public/data/gear_database.json', 'r') as f:
    db = json.load(f)

# Build a fast lookup from source_path to JSON item
path_to_item = {item['source_path']: item for item in db}

# Scan ALL BINd files for flags and acquisition strings
results = {
    'crowns_only_flag': {'classified': Counter(), 'unclassified': Counter()},
    'crafted_string': {'classified': Counter(), 'unclassified': Counter()},
    'no_auction_flag': {'classified': Counter(), 'unclassified': Counter()},
    'no_trade_flag': {'classified': Counter(), 'unclassified': Counter()},
}

total_checked = 0
for f in wad.files:
    if not f.name.endswith('.xml') or 'ObjectData' not in f.name:
        continue
    
    item = path_to_item.get(f.name)
    if not item:
        continue
    
    data = wad.extract_file(f.name)
    if not data or len(data) < 16 or data[:4] != b'BINd':
        continue
    
    total_checked += 1
    strings = parser._extract_strings(data)
    str_texts = set(s['text'] for s in strings)
    
    acq = item.get('acquisition_type') or ''
    category = 'classified' if acq else 'unclassified'
    
    if 'FLAG_CrownsOnly' in str_texts:
        results['crowns_only_flag'][category][acq or '(none)'] += 1
    if 'Crafted' in str_texts:
        results['crafted_string'][category][acq or '(none)'] += 1
    if 'FLAG_NoAuction' in str_texts:
        results['no_auction_flag'][category][acq or '(none)'] += 1
    if 'FLAG_NoTrade' in str_texts:
        results['no_trade_flag'][category][acq or '(none)'] += 1

print(f"Total items checked: {total_checked}\n")

for signal, data in results.items():
    total = sum(data['classified'].values()) + sum(data['unclassified'].values())
    print(f"\n{signal} (found in {total} items):")
    print(f"  Among CLASSIFIED items:")
    for acq, count in sorted(data['classified'].items(), key=lambda x: -x[1]):
        print(f"    {acq}: {count}")
    print(f"  Among UNCLASSIFIED items:")
    for acq, count in sorted(data['unclassified'].items(), key=lambda x: -x[1]):
        print(f"    {acq}: {count}")

# Also: check if 'Crafted' string in binary perfectly correlates with 
# items already classified as Crafted
print(f"\n\n{'='*60}")
print("CORRELATION: 'Crafted' string vs classified acquisition_type")
print(f"{'='*60}")

crafted_in_binary = 0
crafted_in_acq = 0
both = 0
crafted_binary_only = 0
crafted_acq_only = 0

for f in wad.files:
    if not f.name.endswith('.xml') or 'ObjectData' not in f.name:
        continue
    item = path_to_item.get(f.name)
    if not item:
        continue
    data = wad.extract_file(f.name)
    if not data or len(data) < 16 or data[:4] != b'BINd':
        continue
    strings = set(s['text'] for s in parser._extract_strings(data))
    
    has_binary = 'Crafted' in strings
    has_acq = item.get('acquisition_type') == 'Crafted'
    
    if has_binary:
        crafted_in_binary += 1
    if has_acq:
        crafted_in_acq += 1
    if has_binary and has_acq:
        both += 1
    if has_binary and not has_acq:
        crafted_binary_only += 1
        # Show first few
        if crafted_binary_only <= 5:
            p = item['source_path'].split('/')
            folder = p[1] if len(p) >= 2 else '???'
            print(f"  Binary=Crafted but acq='{item.get('acquisition_type','')}': {item['name']} ({folder})")
    if has_acq and not has_binary:
        crafted_acq_only += 1
        if crafted_acq_only <= 5:
            print(f"  acq=Crafted but NOT in binary: {item['name']}")

print(f"\n  'Crafted' in binary: {crafted_in_binary}")
print(f"  acq='Crafted': {crafted_in_acq}")
print(f"  Both: {both}")
print(f"  Binary only (RECOVERABLE): {crafted_binary_only}")
print(f"  acq only (binary missing): {crafted_acq_only}")
