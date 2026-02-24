# How We Cracked the BINd Format

> **Date:** 2026-02-23  
> **Author:** wisewiz101 project  
> **Status:** Phase 1 complete — string extraction approach validated

## The Problem

Wizard101's game data files have `.xml` extensions but contain **proprietary binary data**, not XML. The game engine calls this format "BINd" (the magic bytes at the start of every file). No public specification exists.

We needed to parse these files to extract gear stats (health, damage, sockets, rarity, etc.) without hooking into the live game or using third-party tools.

## Method: Iterative Hex Analysis

### Step 1 — Identify the Format Exists

We extracted a gear file (`Amulet-AQ-Balance-Mastery.xml`) from `Root.wad` expecting XML. Instead, the first bytes were:

```
42 49 4E 64 07 00 00 00 D1 88 1F 3B
B  I  N  d  .  .  .  .  .  .  .  ;
```

This told us three things:
- Magic bytes: `BINd` (not XML)
- A version field: `07 00 00 00` = 7 (uint32 LE)
- A constant: `0x3B1F88D1` (same across all gear files → class hash)

### Step 2 — Find Readable Strings

We dumped the full hex of a 1,239-byte athame file and spotted readable ASCII embedded in the binary:

```
RenderBehavior, JewelSocketBehavior, SOCKETTYPE_TEAR, 
Athame-AQ-L90-001, FLAG_NoAuction, Items_00008758,
CanonicalMaxHealth, CanonicalAllDamage, RT_COMMON
```

These were clearly structured game properties — not random noise.

### Step 3 — Discover the String Encoding

We needed to find how strings were delimited. We tested several hypotheses:

| Hypothesis | Result |
|------------|--------|
| Null-terminated strings | ❌ No null bytes before many strings |
| Single-byte length prefix | ❌ Lengths didn't match character counts |
| **Byte = string_length × 2** | ✅ Matched every string perfectly |

**Discovery:** The byte immediately before each string equals `len(string) * 2`.

Validation across 3 files:
- `0x0C` → "Athame" (6 chars, 6×2=12=0x0C) ✅
- `0x1C` → "FLAG_NoAuction" (14 chars, 14×2=28=0x1C) ✅
- `0x30` → "Athame-AQ-L90-001.AdjRef" (24 chars, 24×2=48=0x30) ✅

**Why ×2?** The game engine likely uses `wchar_t` (2-byte characters) internally. The length byte stores the byte count in the engine's native format, even though the serialized file uses single-byte ASCII.

### Step 4 — Map the Stat Value Pattern

After finding all strings, we examined the bytes **after** each stat name string (e.g., `CanonicalMaxHealth`). We found a consistent 8-byte gap followed by an int32:

```
"CanonicalMaxHealth" → 60 00 00 00 CC 4F F4 60 → 3F 01 00 00 (=319)
"CanonicalMaxMana"   → 60 00 00 00 CC 4F F4 60 → D1 00 00 00 (=209)
"CanonicalPowerPip"  → 60 00 00 00 CC 4F F4 60 → 74 00 00 00 (=116)
"CanonicalAllDamage"  → 60 00 00 00 CC 4F F4 60 → 72 00 00 00 (=114)
```

The 8-byte gap `60 00 00 00 CC 4F F4 60` is **constant across all stat entries** and acts as a delimiter between the stat name and its value.

### Step 5 — Identify the Stat Property Hash

We also noticed that every stat entry was preceded (before the stat name string) by the 4-byte hash `0x78F28C29`. This is the property hash that identifies "this is a stat property" in the BINd serialization schema.

### Step 6 — String Classification

Rather than fully parsing the binary record structure (which would require a complete type system), we classified strings by pattern:

| Pattern | Classification |
|---------|---------------|
| `Hat`, `Robe`, `Athame`, etc. | Equipment type |
| `FLAG_*` | Item flags |
| `SOCKETTYPE_*` | Jewel socket |
| `RT_*` | Rarity tier |
| `Canonical*` | Stat name |
| `Items_XXXXXXXX` | Locale display name key |
| `*Behavior` | Object behavior component |
| Ends with `.AdjRef` | Adjacency reference (item name embedded) |
| `All`, `Fire`, `Ice`, etc. | School |

This approach extracts all gear-relevant data without needing to understand every byte.

## What We Can Parse

After these steps, our parser reliably extracts from any gear BINd file:

- ✅ Item name  
- ✅ Equipment type (Hat/Robe/Athame/etc.)  
- ✅ All stat values (health, mana, damage, block, healing, pip chance, etc.)  
- ✅ Jewel sockets  
- ✅ Item flags (NoAuction, CrownsOnly, etc.)  
- ✅ Rarity tier  
- ✅ School  
- ✅ Locale key (links to display name)  
- ✅ Blank template detection  
- ✅ Set name  
- ✅ Level requirement (from file path)  

## What We Can't Parse (Yet)

- ❓ Full object tree structure (nested property records)
- ❓ Numeric-only fields without nearby string context
- ❓ Complete hash-to-name mapping for all properties

## Tools & Data Used

- **Input:** `Root.wad` → zlib-decompressed gear `.xml` files
- **Analysis:** Python `struct` module for binary reading, manual hex dumps
- **Validation:** Cross-referenced stat values against Wizard101 Central wiki
- **No external dependencies** — entire analysis done with Python standard library
