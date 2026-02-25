# Wizard101 Gear Source Path Nomenclature

The `source_path` property on gear items in the Wizard101 dataset contains a highly structured, hyphen-separated string indicating exactly where the item originates, what tier it belongs to, and its intended demographics. 

This document deciphers the known tokens and metadata hidden within these strings.

## Structure

While the exact structure varies between eras, modern gear strictly adheres to conventions resembling:
`[Source]-[Season/Tier]-[ItemType]-[Level]-[School]-[SetID]-[Variant]`

### Example Analysis

**Code:** `Crowns-S61-Amulet-L10-DS-006-01`
- **Crowns:** Source (Crowns shop or Pack)
- **S61:** Season 61 (Internal Game Phase)
- **Amulet:** Item Type
- **L10:** Level 10 Requirement
- **DS:** Death School
- **006:** Item Set #6
- **01:** Variant 1 (Often color or stat variations)

**Code:** `Amulet-T11-DM-001`
- **Amulet:** Item Type
- **T11:** Tier 11 (Max Level Tier for that era)
- **DM:** Darkmoor (World/Dungeon)
- **001:** ID 1

---

## 1. Source Prefixes
The first token usually describes *how* the player obtains the item.

| Tag | Description |
|---|---|
| `Drop` | Acquired by defeating a monster or boss. |
| `Craft` / `Crafted` | Acquired by crafting it at a recipe station. |
| `Crowns` / `Crown` | Acquired via the Crowns Shop, Hoard Packs, or Lore Packs. |
| `PVP` / `Arena` | Acquired from PvP Arena vendors via tickets. |
| `Promo` / `Gift` | Acquired from promotional codes, bundles, or gifts. |
| `Vendor` | Acquired by purchasing from a standard gold vendor. |
| `Test` / `Blank` | Developer placeholder items. |

## 2. Temporal Tags (Seasons & Tiers)
KingsIsle categorizes the generational progression of gear into "Seasons" (S) or "Tiers" (T).

| Token | Meaning | Context |
|---|---|---|
| `S##` | **Season / Series** | Ranges from `S01` to `S65`. Correlates heavily to max level caps. For instance, `S61` through `S65` map perfectly to Level 170+ Wallaru gear. |
| `T##` | **Tier** | Typically used for major dungeon releases. E.g., `T11` is heavily correlated with Level 100 Darkmoor (`DM`) drops. |

## 3. Demographics
These tags specify who can use the gear.

- **Level Codes:** `L10`, `L170`. Directly corresponds to the `level_req` property.
- **School Codes:**
  - `BS` = Balance School
  - `DS` = Death School
  - `FS` = Fire School
  - `IS` = Ice School
  - `LS` = Life School
  - `MS` = Myth School
  - `SS` = Storm School
  *(Note: Universal "Any/All" items will still often carry a school code if they belong to a themed pack, e.g., a Fire-themed pack wand that any school can use might be tagged `FS` or `All`).*

## 4. Worlds and Dungeon Abbreviations
Items dropped in specific locations use 2-3 letter acronyms for those locations.

| Tag | Location / World |
|---|---|
| `WC` / `WC1` | Wizard City |
| `KT` | Krokotopia |
| `MB` | Marleybone |
| `MS` | MooShu |
| `DS` | Dragonspyre (Overlaps with Death School depending on slot) |
| `CL` | Celestia |
| `ZF` | Zafaria |
| `AV` | Avalon |
| `AZ` | Azteca |
| `KR` | Khrysalis |
| `PL` | Polaris |
| `MR` | Mirage |
| `EM` | Empyrea |
| `KM` | Karamelle |
| `LM` | Lemuria |
| `NOV` | Novus |
| `WM` | Wallaru |
| `DM` | Darkmoor |
| `AQ` | Aquila |

---
## 5. Feature Opportunities

Because these tags are extremely structural, we can parse them directly into our internal `GearItem` model and expose powerful new UI features:

### A. Acquisition Flags (Source Filters)
We can parse the primary prefix (`Crowns`, `Craft`, `Drop`, `PVP`) into an `acquisition_type` property. 
**Feature:** In the Filter Sidebar, add a "Source" section with checkboxes. Users can quickly filter out premium Crowns gear, or view only Farmable (Drop) and Crafted options.

### B. "Complete the Set" (Outfit Matching)
Items that share the same `[Season]`, `[School]`, and `[SetID]` belong to the exact same visual and thematic gear set.
**Feature:** When a user clicks on an item to view its details (or hovers over it), we can query the database for the matching `<Source>-<Season>-*-<Level>-<School>-<SetID>` items and display a "Matching Set" widget, showing the rest of the outfit.

### C. Generational "Item Levels" (Tier Highlighting)
The `Season` (e.g., `S61`) and `Tier` (e.g., `T11`) tags provide a form of internal "Item Level" tracking independent of the raw required level.
**Feature:** Display the Season/Tier tag as a subtle badge on the item card. This helps users understand if a Level 170 item belongs to the base Wallaru release (`S61`) or a later, theoretically stronger Nightmare Dungeon tier (`S65`).
