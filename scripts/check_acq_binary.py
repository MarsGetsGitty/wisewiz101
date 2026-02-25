"""
Deep investigation of BINd binary strings for unclassified items.
Check for FLAG_NoAuction, rarity, and other classifying markers 
that could distinguish Crowns from Drops.
"""
import sys, os, re, json, struct
from collections import Counter
sys.path.insert(0, 'C:/ProgramData/KingsIsle Entertainment/wisewiz101/src')
from wad_reader import WadArchive
from bind_parser import BINdParser

wad = WadArchive(r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad')
parser = BINdParser()

# Load JSON database for metadata
with open('C:/ProgramData/KingsIsle Entertainment/wisewiz101/web/public/data/gear_database.json', 'r') as f:
    db = json.load(f)
name_to_item = {item['name']: item for item in db}

# Classify by locating specific strings in BINd data
INTERESTING_STRINGS = {
    'FLAG_NoAuction', 'FLAG_CrownsOnly', 'FLAG_NoTrade', 'FLAG_NoBazaar',
    'FLAG_PvPOnly', 'FLAG_Retired', 'FLAG_CrownsRedeemable',
    'Crowns', 'Crown', 'Drop', 'Crafted', 'Vendor', 'PVP',
    'RT_COMMON', 'RT_UNCOMMON', 'RT_RARE', 'RT_EPIC', 'RT_ULTRA_RARE',
}

FOLDERS_TO_CHECK = [
    ('SpecialSets', 20),          # Mixed: Crowns + unclassified
    ('Aquila Gear', 10),          # Mixed: Drop + Crafted + unclassified
    ('Polaris Equipment', 5),     # All unclassified (world drops?)
    ('Gauntlet', 5),              # All unclassified (gauntlet drops?)
    ('Tier4', 5),                 # All unclassified (generic drops?)
    ('Blanks', 5),                # All unclassified (cosmetics?)
    ('Holiday', 5),               # All unclassified (event items?)
    ('Tourney Season01', 5),      # All unclassified (tourney pvp?)
    ('Battlegrounds', 5),         # All unclassified (BG pvp?)
    ('OneShotDungeons', 5),       # All unclassified (dungeon drops?)
    ('Ultra Dungeons', 5),        # All unclassified
    ('PVP', 5),                   # Mixed: PVP + unclassified
    ('MonsterItems', 5),          # All unclassified
    ('Purchased Character Gear', 5),
    ('Durable Items', 5),
    ('SkeletonKeys', 5),
    ('DerbyGear', 5),
]

for folder_name, max_samples in FOLDERS_TO_CHECK:
    # Get unclassified items from this folder
    folder_items = [i for i in db if f'/{folder_name}/' in i['source_path'] and not i.get('acquisition_type')]
    if not folder_items:
        continue
    
    print(f"\n{'='*70}")
    print(f"  {folder_name} ({len(folder_items)} unclassified)")
    print(f"{'='*70}")
    
    # Check BINd data for some samples
    flag_counter = Counter()
    rarity_counter = Counter()
    has_crowns_str = 0
    has_noauction = 0
    checked = 0
    
    for item in folder_items[:max_samples]:
        path = item['source_path']
        entry = None
        for f in wad.files:
            if f.name == path:
                entry = f
                break
        if not entry:
            continue
        
        data = wad.extract_file(path)
        if not data or data[:4] != b'BINd':
            continue
        
        checked += 1
        strings = parser._extract_strings(data)
        str_texts = [s['text'] for s in strings]
        
        found_flags = [s for s in str_texts if s.startswith('FLAG_')]
        found_rarity = [s for s in str_texts if s.startswith('RT_')]
        
        for f in found_flags:
            flag_counter[f] += 1
        for r in found_rarity:
            rarity_counter[r] += 1
        
        if 'Crowns' in str_texts or 'Crown' in str_texts:
            has_crowns_str += 1
        if 'FLAG_NoAuction' in str_texts:
            has_noauction += 1
        
        # Also check for "Crafted" or "Drop" strings
        acq_strs = [s for s in str_texts if s in ('Crowns', 'Crown', 'Drop', 'Crafted', 'Vendor', 'PVP')]
        if acq_strs:
            print(f"  ** {item['name']}: FOUND acquisition strings: {acq_strs}")
    
    print(f"  Checked {checked} items")
    print(f"  Flags: {dict(flag_counter)}")
    print(f"  Rarity: {dict(rarity_counter)}")
    if has_noauction:
        print(f"  Items with FLAG_NoAuction: {has_noauction}/{checked}")

    # Also compare with classified items in the same folder
    classified = [i for i in db if f'/{folder_name}/' in i['source_path'] and i.get('acquisition_type')]
    if classified:
        cls_types = Counter(i['acquisition_type'] for i in classified)
        print(f"  Classified items in same folder: {dict(cls_types)}")

# Special deep check: SpecialSets - compare FLAG_NoAuction between 
# classified Crowns items vs unclassified items
print(f"\n{'='*70}")
print("  SPECIAL ANALYSIS: SpecialSets - Crowns vs Unclassified FLAG comparison")
print(f"{'='*70}")

ss_crowns = [i for i in db if '/SpecialSets/' in i['source_path'] and i.get('acquisition_type') == 'Crowns']
ss_unclassified = [i for i in db if '/SpecialSets/' in i['source_path'] and not i.get('acquisition_type')]

for label, items in [("Crowns (classified)", ss_crowns[:10]), ("Unclassified", ss_unclassified[:10])]:
    noauction_count = 0
    checked = 0
    crowns_str_count = 0
    for item in items:
        entry = None
        for f in wad.files:
            if f.name == item['source_path']:
                entry = f
                break
        if not entry:
            continue
        data = wad.extract_file(item['source_path'])
        if not data or data[:4] != b'BINd':
            continue
        checked += 1
        strings = [s['text'] for s in parser._extract_strings(data)]
        if 'FLAG_NoAuction' in strings:
            noauction_count += 1
        if 'Crowns' in strings:
            crowns_str_count += 1
    print(f"\n  {label} ({checked} checked):")
    print(f"    FLAG_NoAuction: {noauction_count}/{checked}")
    print(f"    'Crowns' string: {crowns_str_count}/{checked}")
