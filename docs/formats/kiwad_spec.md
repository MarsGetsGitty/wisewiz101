# KIWAD Archive Format Specification

> **Version:** 1.0 — Verified against `Root.wad` v2 (r792258.Wizard_1_590)  
> **Status:** Complete — fully reverse-engineered and validated

## Overview

KIWAD (`.wad`) is KingsIsle Entertainment's proprietary archive format used to bundle game assets (XML data, models, textures, audio, etc.) into single files. All game data lives in WAD archives under `Data/GameData/`.

## Binary Layout

### Header (14 bytes for v2)

| Offset | Size | Type    | Description                        |
|--------|------|---------|------------------------------------|
| 0      | 5    | ASCII   | Magic: `KIWAD`                     |
| 5      | 4    | int32LE | Version (observed: `2`)            |
| 9      | 4    | int32LE | File count                         |
| 13     | 1    | byte    | Spacer (v2+ only, always `0x01`)   |

### File Table (repeated `file_count` times)

| Offset | Size | Type    | Description                        |
|--------|------|---------|------------------------------------|
| 0      | 4    | int32LE | Data offset (byte position in WAD) |
| 4      | 4    | int32LE | Uncompressed size                  |
| 8      | 4    | int32LE | Compressed size                    |
| 12     | 1    | byte    | Is compressed (`0`=no, `1`=yes)    |
| 13     | 4    | uint32LE| CRC32 checksum                     |
| 17     | 4    | int32LE | Filename length (including null)   |
| 21     | N    | ASCII   | Filename (null-terminated)         |

### Data Section

File contents stored at the offsets specified in the file table. Compressed files use **zlib** (standard deflate with 2-byte header, `wbits=15`).

## Key WAD Files

| File                       | Size    | Contents                                      |
|----------------------------|---------|-----------------------------------------------|
| `Root.wad`                 | 274 MB  | Item definitions, spells, mobs, locale, templates (~166,912 files) |
| `Equipment-WorldData.wad`  | 709 MB  | 3D models for equipment (world detail)        |
| `Equipment-HighDetail.wad` | 533 MB  | 3D models for equipment (high detail)         |
| `_Shared-WorldData.wad`    | varies  | Icons and shared graphical assets             |

## Streaming Gaps

Wizard101 downloads content on-demand. The file table is always complete, but data offsets may point past the actual file size for content not yet downloaded. Detect with:

```
is_available = (entry.offset + entry.data_size) <= wad_file_size_on_disk
```

Our `Root.wad` has **zero gaps** — all 166,912 files are fully available.

## Implementation

See [`src/wad_reader.py`](../../src/wad_reader.py) — zero-dependency Python implementation.
