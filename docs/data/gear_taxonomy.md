# Gear Data Taxonomy

> **Version:** 1.0  
> **Source:** Extracted from `Root.wad` file table analysis (166,912 entries)  
> **Last Updated:** 2026-02-23

## Equipment Slot Types

| Slot     | Path Keywords       | File Count (broad) | Wiki Count | Notes |
|----------|---------------------|--------------------:|------------|-------|
| Hat      | `/Hats/`, `/Hat/`   | 9,928               | ~8,560     | Discrepancy due to blanks, monster items, deprecated items |
| Robe     | `/Robes/`, `/Robe/` | 9,434               | ~6,700+    | Same |
| Shoes    | `/Shoes/`, `/Shoe/` | 9,276               | ~8,560     | Game calls them "Shoes" not "Boots" |
| Wand     | `/Wands/`, `/Wand/` | 8,354               | TBD        | |
| Deck     | `/Decks/`, `/Deck/` | 7,170               | TBD        | |
| Athame   | `/Athames/`         | 4,061               | TBD        | |
| Ring     | `/Rings/`           | 3,750               | TBD        | |
| Amulet   | `/Amulets/`, `/Amulet/` | 3,562           | TBD        | |
| **Total** |                    | **55,534**          |            | Unique files across all categories |

## Why File Counts Exceed Wiki Counts

Our raw file count is higher than Wizard101 Central's item counts because our count includes:

1. **Blank templates** (`Blanks/` — 875 files) — Base templates not obtainable by players
2. **Monster/NPC items** (`MonsterItems/` — 1,284 files) — Worn by enemies, not player-equippable
3. **Deprecated items** — Removed from game but data files persist
4. **Visual variants** — Male/female model configs sharing the same logical item
5. **Dev/test items** — Internal QA items never released

## Top-Level ObjectData Categories

The 55,534+ gear files are spread across **1,326 different ObjectData directories**:

| Category | File Count | Description |
|----------|------------|-------------|
| CrownItems | 27,781 | Crown Shop items (Series 1–65+) |
| Housing | 8,699 | Housing items (not gear) |
| SpecialSets | 4,544 | Special gear sets |
| Jewels | 4,405 | Jewel items (not gear slots) |
| Decks | 3,795 | Deck items |
| Gauntlet | 2,213 | Gauntlet reward gear |
| CraftedEquipment | 1,619 | Crafted gear |
| Mounts | 1,475 | Mounts (not gear) |
| Pets | 1,423 | Pets (not gear) |
| MonsterItems | 1,284 | NPC/monster-only items |
| Blanks | 875 | Template files |
| Tier2–Tier6 | ~4,000 | Tiered gear |
| World-specific | ~10,000+ | WC, KT, MB, MR, AZ, etc. |

## Gear Identification Strategy

**Path-based filtering is unreliable.** Gear files sit at variable depths under diverse parent directories. Instead, we identify gear by:

1. **BINd content** — Parse the binary data for type identifiers (`Hat`, `Robe`, `Athame`, etc.)
2. **Path as hint** — Use directory names as a secondary signal
3. **Exclusion rules** — Filter out `Blanks/`, `Housing/`, `Pets/`, `Mounts/`, `Jewels/`
