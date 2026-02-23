# wisewiz101

A zero-dependency Python tool for extracting gear data from Wizard101's game files and building a structured gear database.

## What It Does

Reads Wizard101's proprietary **KIWAD** (`.wad`) archive files and **BINd** binary XML format to extract every gear item's stats, school, type, rarity, sockets, and flags — no third-party tools required.

## Project Structure

```
wisewiz101/
├── src/
│   ├── wad_reader.py       # KIWAD .wad archive reader
│   ├── bind_parser.py      # BINd binary XML parser  
│   └── gear_extractor.py   # Gear data extraction + DB builder
├── output/                 # Generated gear database files
└── README.md
```

## Usage

```bash
python src/gear_extractor.py
```

By default, reads from `C:\ProgramData\KingsIsle Entertainment\Wizard101\Data\GameData\Root.wad` and outputs gear data to `output/`.

## Requirements

- Python 3.8+
- No external dependencies (stdlib only)

## Game Data Source

The tool reads from the locally installed Wizard101 game files. Wizard101 streams content on-demand, so your local `Root.wad` may not contain every item if you haven't visited all game worlds. The tool reports any gaps it finds.

## Disclaimer

This project is not affiliated with KingsIsle Entertainment. It is an independent tool for personal data analysis of locally installed game files.
