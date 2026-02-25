"""
Gather sample items per tier by joining:
- gear_database.json (has display names)  
- WAD BINd data (has float32 level)
Pick 2 items per tier with real display names.
"""
import sys, os, struct, re, json
sys.path.insert(0, 'C:/ProgramData/KingsIsle Entertainment/wisewiz101/src')
from wad_reader import WadArchive
from bind_parser import BINdParser

WAD_PATH = r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad'
wad = WadArchive(WAD_PATH)
parser = BINdParser()

# Load the existing JSON database for display names
with open('C:/ProgramData/KingsIsle Entertainment/wisewiz101/web/public/data/gear_database.json', 'r') as f:
    db = json.load(f)

# Build lookup: internal name -> display_name
name_to_display = {}
for item in db:
    if item.get('display_name'):
        name_to_display[item['name']] = item['display_name']

def find_float_level(data, strings):
    for s in strings:
        if s['text'] == 'OPERATOR_GREATER_THAN_EQ':
            op_pos = s['pos']
            for off in range(max(0, op_pos - 30), op_pos):
                if off + 4 <= len(data):
                    fval = struct.unpack_from('<f', data, off)[0]
                    if 1.0 <= fval <= 200.0 and fval == int(fval):
                        return int(fval)
    return 0

# Collect samples per tier (2 items each)
samples = {}
for f in wad.files:
    if not f.name.endswith('.xml') or 'ObjectData' not in f.name:
        continue
    bn = os.path.basename(f.name)
    tm = re.search(r'-T(\d+)', bn)
    if not tm:
        continue
    tier = 'T' + tm.group(1)
    tier_num = int(tm.group(1))
    if tier_num > 11:
        continue  # Only T1-T11
    if tier not in samples:
        samples[tier] = []
    if len(samples[tier]) >= 2:
        continue
    
    # Derive internal name from filename
    internal_name = bn.replace('.xml', '')
    display_name = name_to_display.get(internal_name, '')
    if not display_name:
        continue
    
    data = wad.extract_file(f.name)
    if not data or len(data) < 16 or data[:4] != b'BINd':
        continue
    
    strings = parser._extract_strings(data)
    level = find_float_level(data, strings)
    
    samples[tier].append({
        'display_name': display_name,
        'internal': internal_name,
        'float_level': level,
        'path': f.name,
    })

print("Items to look up on the Wizard101 Wiki:")
print("=" * 70)
for tier in sorted(samples.keys(), key=lambda x: int(x[1:])):
    print(f"\n{tier}:")
    for s in samples[tier]:
        print(f'  "{s["display_name"]}" -> binary says level {s["float_level"]}')
        print(f'    (internal: {s["internal"]})')
