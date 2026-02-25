"""Verify float32 extraction for specific known items."""
import sys, os, struct
sys.path.insert(0, 'C:/ProgramData/KingsIsle Entertainment/wisewiz101/src')
from wad_reader import WadArchive
from bind_parser import BINdParser

wad = WadArchive(r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad')
parser = BINdParser()

targets = [
    ("ObjectData/CraftedEquipment/Athames/Athame-Craft-T2-005.xml", "Lifebringer's Athame", "T2", 10),
    ("ObjectData/CraftedEquipment/Athames/Athame-Craft-T3-001.xml", "Stinger of the Scorpion", "T3", 20),
    ("ObjectData/CraftedEquipment/Amulets/Amulet-Craft-T6-001.xml", "Vial of Judgement", "T6", None),
    ("ObjectData/CraftedEquipment/Amulets/Amulet-Craft-T8-AV-001.xml", "Lifetree Amulet", "T8", 74),
    ("ObjectData/CraftedEquipment/Amulets/Amulet-Craft-T10-KR-001.xml", "Hopper's Desert Relic", "T10", 94),
    ("ObjectData/CraftedEquipment/Rings/Ring-Craft-T2-002.xml", "Ring of Insight", "T2", None),
]

for path, display_name, tier, wiki_level in targets:
    data = wad.extract_file(path)
    if not data:
        print(f"MISSING: {path}")
        continue
    
    strings = parser._extract_strings(data)
    float_level = 0
    for s in strings:
        if s['text'] == 'OPERATOR_GREATER_THAN_EQ':
            op_pos = s['pos']
            for off in range(max(0, op_pos - 30), op_pos):
                if off + 4 <= len(data):
                    fval = struct.unpack_from('<f', data, off)[0]
                    if 1.0 <= fval <= 200.0 and fval == int(fval):
                        float_level = int(fval)
    
    wiki_str = f"wiki={wiki_level}" if wiki_level else "wiki=???"
    match_str = ""
    if wiki_level:
        match_str = " MATCH" if float_level == wiki_level else " MISMATCH"
    
    print(f'{tier} | "{display_name}" | binary={float_level} | {wiki_str}{match_str}')
