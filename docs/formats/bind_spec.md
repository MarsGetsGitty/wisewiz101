# BINd Binary Serialization Format Specification

> **Version:** 0.2 — String encoding and stat values decoded  
> **Status:** Partial — usable for gear extraction, full record framing TBD  
> **Last Updated:** 2026-02-23

## Overview

BINd is KingsIsle's proprietary binary serialization format. Files with `.xml` extensions inside WAD archives are **not** plaintext XML — they are BINd-encoded binary data. The game's engine deserializes these at runtime into PropertyClass object trees.

## Header (12 bytes)

| Offset | Size | Type     | Description                                    |
|--------|------|----------|------------------------------------------------|
| 0      | 4    | ASCII    | Magic: `BINd`                                  |
| 4      | 4    | uint32LE | Serializer version (observed: `7`)             |
| 8      | 4    | uint32LE | Root class hash (observed: `0x3B1F88D1` for items) |

## String Encoding (CONFIRMED)

Strings use a **length×2 prefix byte**: a single byte `B` followed by `B ÷ 2` ASCII characters.

| Prefix Byte | ÷2 | Actual String | Match? |
|-------------|-----|---------------|--------|
| `0x0C` (12) | 6   | `Athame`      | ✅ |
| `0x1C` (28) | 14  | `FLAG_NoAuction` | ✅ |
| `0x22` (34) | 17  | `Athame-AQ-L90-001` | ✅ |
| `0x30` (48) | 24  | `Athame-AQ-L90-001.AdjRef` | ✅ |

**Why ×2?** The engine likely uses `wchar_t` (2 bytes/char) internally. The length byte stores the internal byte count, but the serialized file uses single-byte ASCII. See [002_reverse_engineering_method.md](../decisions/002_reverse_engineering_method.md) for the full discovery process.

## Stat Value Encoding (CONFIRMED)

Stat entries follow this exact byte pattern:

```
[hash 0x78F28C29] ... [length_byte] [stat_name_string] [8-byte gap] [int32LE value]
```

### Known Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| Stat property hash | `0x78F28C29` | Precedes every `Canonical*` stat entry |
| Stat value gap | `60 00 00 00 CC 4F F4 60` | 8 bytes between stat name and its int32 value |

### Example (Athame-AQ-L90-001)

```
Stat Name              → Gap (8 bytes)          → Value (int32LE)
CanonicalMaxHealth     → 60 00 00 00 CC 4F F4 60 → 3F 01 00 00 = 319
CanonicalMaxMana       → 60 00 00 00 CC 4F F4 60 → D1 00 00 00 = 209
CanonicalPowerPip      → 60 00 00 00 CC 4F F4 60 → 74 00 00 00 = 116
CanonicalLifeHealing   → 60 00 00 00 CC 4F F4 60 → 74 00 00 00 = 116
CanonicalAllDamage     → 60 00 00 00 CC 4F F4 60 → 72 00 00 00 = 114
CanonicalAllBlock      → 60 00 00 00 CC 4F F4 60 → 0E 00 00 00 = 14
```

## String Field Classification

| Pattern | Classification | Example |
|---------|---------------|---------|
| Equipment slot keyword | Item type | `Hat`, `Robe`, `Athame`, `Deck` |
| `Weapon` | Wand type | Wands use `Weapon` not `Wand` in BINd data |
| Wand subtype keyword | Weapon model | `Spear`, `Staff`, `Sword`, `Relic`, `Banner`, `Fist`, `TwoHandedSword` |
| `FLAG_*` | Item flag | `FLAG_NoAuction`, `FLAG_CrownsOnly` |
| `SOCKETTYPE_*` | Jewel socket | `SOCKETTYPE_TEAR`, `SOCKETTYPE_CIRCLE` |
| `RT_*` | Rarity tier | `RT_COMMON`, `RT_EPIC`, `RT_LEGENDARY` |
| `Canonical*` | Stat name | `CanonicalMaxHealth`, `CanonicalAllDamage` |
| `Items_XXXXXXXX` | Locale key | `Items_00008758` → display name in lang files |
| `*Behavior` | Behavior component | `RenderBehavior`, `JewelSocketBehavior` |
| `.AdjRef` suffix | Adjacency ref | `Athame-AQ-L90-001.AdjRef` |
| School name | School | `All`, `Fire`, `Ice`, `Storm`, `Balance` |
| `OT_*` | Object type enum | `OT_UNDEFINED` |
| `ROP_*` | Requirement operator | `ROP_AND` |
| `OPERATOR_*` | Comparison op | `OPERATOR_GREATER_THAN_EQ` |
| `MALE` / `FEMALE` | Gender variant | Visual model variant |
| `*.nif` | 3D model path | `Mob|WorldData|Athames/AQ/AQ_Athames_Gold.nif` |
| `*.dds` | Texture path | `Textures/Characters/Boy/...Hood_013.dds` |

## What We Don't Know Yet

1. **Full record framing** — exact byte-level structure of property records beyond strings/stats
2. **Hash-to-name mapping** — a complete table of all 4-byte property hashes (wiztype could provide)
3. **Nested object depth** — how behavior sub-objects are delimited
4. **Non-Canonical numeric fields** — values not associated with a `Canonical*` string

## Related Documents

- [ADR-001: Parser Approach](../decisions/001_parser_approach.md)
- [ADR-002: Reverse Engineering Method](../decisions/002_reverse_engineering_method.md)
- [Gear Taxonomy](../data/gear_taxonomy.md)

## Implementation

See [`src/bind_parser.py`](../../src/bind_parser.py) — validated against 3 item types.
