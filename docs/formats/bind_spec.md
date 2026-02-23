# BINd Binary Serialization Format Specification

> **Version:** 0.1 (Draft) — Active reverse-engineering in progress  
> **Status:** Partial — header and string extraction understood, full record structure TBD  
> **Last Updated:** 2026-02-23

## Overview

BINd is KingsIsle's proprietary binary serialization format. Files with `.xml` extensions inside WAD archives are **not** plaintext XML — they are BINd-encoded binary data. The game's engine deserializes these at runtime into PropertyClass object trees.

## What We Know

### Header (12 bytes)

| Offset | Size | Type     | Description                                    |
|--------|------|----------|------------------------------------------------|
| 0      | 4    | ASCII    | Magic: `BINd`                                  |
| 4      | 4    | uint32LE | Serializer version (observed: `7`)             |
| 8      | 4    | uint32LE | Root class hash (observed: `0x3B1F88D1` for items) |

### Body Structure (Under Investigation)

The body contains a tree of PropertyClass objects. Based on hex analysis of gear files:

- **Property hashes** — 4-byte little-endian values that identify properties by hash (not name)
- **Strings** — embedded with a length byte, containing:
  - Item names (e.g. `Athame-AQ-L90-001`)
  - Type identifiers (e.g. `Athame`, `Hat`, `Robe`, `Deck`)
  - Stat names (e.g. `CanonicalMaxHealth`, `CanonicalAllDamage`)
  - Flags (e.g. `FLAG_NoAuction`)
  - Socket types (e.g. `SOCKETTYPE_TEAR`, `SOCKETTYPE_CIRCLE`)
  - Rarity (e.g. `RT_COMMON`, `RT_EPIC`)
  - Locale keys (e.g. `Items_00008758`)
  - Model paths (e.g. `Mob|WorldData|Athames/AQ/AQ_Athames_Gold.nif`)
  - Texture paths (`.dds` files for male/female variants)
- **Nested objects** — sub-records for behaviors (`RenderBehavior`, `JewelSocketBehavior`, `BasicDeckBehavior`)
- **Numeric values** — stat values appear as integers near their stat name strings
- **Enum values** — strings like `OT_UNDEFINED`, `ROP_AND`, `OPERATOR_GREATER_THAN_EQ`

### Observed String Fields in Gear Files

| Field | Example Values | Purpose |
|-------|---------------|---------|
| Item name | `Athame-AQ-L90-001` | Internal identifier |
| AdjRef | `Athame-AQ-L90-001.AdjRef` | Adjacency reference |
| Type | `Athame`, `Hat`, `Robe`, `Deck`, `Amulet` | Equipment slot |
| Flags | `FLAG_NoAuction` | Item restrictions |
| Locale key | `Items_00008758` | Links to display name in locale files |
| Object type | `OT_UNDEFINED` | Object classification |
| Rarity | `RT_COMMON`, `RT_EPIC` | Item rarity tier |
| School | `All`, `Fire`, `Ice`, etc. | Magic school |
| Socket types | `SOCKETTYPE_TEAR`, `SOCKETTYPE_CIRCLE`, `SOCKETTYPE_TRIANGLE` | Jewel socket slots |
| Stats | `CanonicalMaxHealth`, `CanonicalMaxMana`, `CanonicalPowerPip`, `CanonicalAllDamage`, `CanonicalAllBlock`, `CanonicalLifeHealing` | Gear stat bonuses |
| Behaviors | `RenderBehavior`, `JewelSocketBehavior`, `BasicDeckBehavior` | Object behavior components |
| Model paths | `Mob\|WorldData\|Athames/AQ/AQ_Athames_Gold.nif` | 3D model reference |
| Gender | `MALE`, `FEMALE` | Visual variant |
| Hair | `NO_HAIR`, `NONE` | Hair visibility flag |

### Community Reference

- **[wizspoil/wiztype](https://github.com/wizspoil/wiztype)** — Type dumper that extracts class/property definitions from live game memory as JSON. Requires a running Wizard101 instance.
- **[StarrFox/wizwalker](https://github.com/StarrFox/wizwalker)** — Scripting API that reads game memory. Has WAD reader but no BINd file parser.
- **[latelylk/On-Wiz](https://github.com/latelylk/On-Wiz)** — Documentation of Wizard101 internals.

## What We Don't Know Yet

1. **Exact record framing** — how are property boundaries delimited? Is it type-tag + length, or fixed offsets?
2. **Hash-to-name mapping** — the 4-byte property hashes need a lookup table (wiztype JSON could provide this)
3. **Nested object depth** — how deep can the object tree go?
4. **Numeric encoding** — are stat values int32, float32, or variable?

## Parser Strategy

See [Design Decision: Parser Approach](../decisions/001_parser_approach.md)

## Implementation

See [`src/bind_parser.py`](../../src/bind_parser.py) (in progress)
