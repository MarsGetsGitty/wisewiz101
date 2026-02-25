"""Search the WAD file directly for vendor item files."""
import sys, os
sys.path.insert(0, 'C:/ProgramData/KingsIsle Entertainment/wisewiz101/src')
from wad_reader import WadArchive

wad = WadArchive(r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad')

# Search for vendor-related files
vendor_files = [f for f in wad.files if 'vendor' in f.name.lower() or 'shop' in f.name.lower()]
print(f"Files with 'vendor' or 'shop' in name: {len(vendor_files)}")
for f in vendor_files[:20]:
    print(f"  {f.name}")

print()

# Search for specific vendor item names in locale files
# The items might use generic template names and get their display names from locale
locale_files = [f for f in wad.files if 'locale' in f.name.lower() or 'lang' in f.name.lower()]
print(f"Locale files: {len(locale_files)}")
for f in locale_files[:10]:
    print(f"  {f.name}")

print()

# Check if there are other WAD files we aren't reading
import glob
wad_files = glob.glob(r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\*.wad')
print(f"All WAD files in GameData:")
for w in sorted(wad_files):
    size_mb = os.path.getsize(w) / (1024*1024)
    print(f"  {os.path.basename(w)}: {size_mb:.0f} MB")

print()

# Search for "Burning" or "Admirable" or "Debonair" in locale data
from bind_parser import BINdParser
parser = BINdParser()

# Check if locale files contain the vendor item names
from locale_reader import LocaleReader
locale = LocaleReader()
locale_path = r'C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad'
# Try loading locale and searching for specific display names
locale_wad = WadArchive(locale_path)
for f in locale_wad.files:
    if f.name.endswith('.lang') and 'en-US' in f.name:
        data = locale_wad.extract_file(f.name) 
        if data:
            text = data.decode('utf-8', errors='ignore')
            for search in ['Cap of Burning', 'Admirable', 'Debonair', 'Desert Cap', 'Desert Garb']:
                if search.lower() in text.lower():
                    # Find the line
                    for line in text.split('\n'):
                        if search.lower() in line.lower():
                            print(f"FOUND '{search}' in {f.name}: {line.strip()[:100]}")
                            break
