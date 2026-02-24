# Domain Specification: Stat Modeling (Gear Extraction)

## 1. Overview
The Wizard101 binary data (BINd format) does not store player-facing stat values directly. Instead, it stores raw integers that require mathematical correction based on the *type* of stat (Flat vs. Percentage). 

To prevent this binary parsing logic from bleeding into presentation layers or downstream applications (like a TypeScript frontend), the Python extractor will implement a Domain-Driven Design (DDD) approach. It will act as the boundary that ingests binary quirks and outputs a clean, "display-ready" JSON database.

## 2. The Domain Models

### 2.1 The Value Object: `StatValue`
A `StatValue` represents a single statistic (e.g., "+10% Fire Damage", "+200 Health"). 
It is an **immutable Value Object** that encapsulates the core business rule: converting a raw binary integer into a player-facing display value.

**Properties:**
- `key` (string): The internal identifier from the BINd file (e.g., `"FireDamage"`, `"MaxHealth"`).
- `raw_value` (integer): The exact `int32LE` value extracted from the binary file.
- `type` (StatType Enum): The classification of the stat (`FLAT`, `PERCENTAGE`, or `BOOLEAN`).

**Behaviors:**
- `display_value` (integer): A computed property yielding the player-facing value.
  - If `type == PERCENTAGE`: Returns `raw_value - 99`
  - If `type == FLAT`: Returns `raw_value + 1`
  - If `type == BOOLEAN`: Returns `raw_value` (Identity)

### 2.2 The Aggregate Root: `GearItem`
The `GearItem` represents an equippable piece of gear. As the **Aggregate Root**, it manages its collection of `StatValue` objects and controls the serialization boundary.

**Relationships:**
- Owns a collection (Dictionary) of `StatValue` objects, keyed by their stat string.

**Behaviors:**
- `add_stat(key: str, raw_value: int)`: A factory method. The Aggregate takes the raw binary inputs, determines the correct `StatType` via an internal taxonomy lookup, instantiates the `StatValue` VO, and adds it to its internal collection.
- `to_dict(include_raw: bool = False)`: Defines the JSON serialization boundary. 
  - Iterates over all owned `StatValue` objects.
  - By default, populates the `stats` dictionary using `StatValue.display_value`.
  - If `include_raw==True`, populates a secondary `raw_stats` dictionary using `StatValue.raw_value` for auditing and data preservation.

## 3. The Stat Taxonomy (Exhaustive Classification)
To correctly instantiate a `StatValue`, the Aggregate must classify the incoming stat string into a `StatType`. The following exhaustive list defines the classification for all 92 distinct stats found in the game data.

*Note: All stat strings are stripped of their "Canonical" prefix before classification.*

### 3.1 Percentage Stats (`StatType.PERCENTAGE`)
These 41 stats are stored with a `+100` bias and a `-1` offset (Formula: `display = raw - 99`).
- **Accuracy (8)**: AllAccuracy, BalanceAccuracy, DeathAccuracy, FireAccuracy, IceAccuracy, LifeAccuracy, MythAccuracy, StormAccuracy
- **ArmorPiercing (9)**: AllArmorPiercing, BalanceArmorPiercing, DeathArmorPiercing, FireArmorPiercing, IceArmorPiercing, LifeArmorPiercing, MythArmorPiercing, ShadowArmorPiercing, StormArmorPiercing
- **Damage (9)**: AllDamage, BalanceDamage, DeathDamage, FireDamage, IceDamage, LifeDamage, MythDamage, ShadowDamage, StormDamage
- **ReduceDamage (9)**: AllReduceDamage, BalanceReduceDamage, DeathReduceDamage, FireReduceDamage, IceReduceDamage, LifeReduceDamage, MythReduceDamage, ShadowReduceDamage, StormReduceDamage
- **Healing (2)**: IncHealing, LifeHealing
- **Other (4)**: AllFishingLuck, MaxManaPercentReduce, PowerPip, StunResistance

### 3.2 Flat Stats (`StatType.FLAT`)
These 44 stats are stored with a simple `-1` offset (Formula: `display = raw + 1`).
- **Health/Mana/Energy (3)**: MaxHealth, MaxMana, MaxEnergy
- **Block (9)**: AllBlock, BalanceBlock, DeathBlock, FireBlock, IceBlock, LifeBlock, MythBlock, ShadowBlock, StormBlock
- **CriticalHit (8)**: AllCriticalHit, BalanceCriticalHit, DeathCriticalHit, FireCriticalHit, IceCriticalHit, LifeCriticalHit, MythCriticalHit, StormCriticalHit
- **FlatDamage (7)**: BalanceFlatDamage, DeathFlatDamage, FireFlatDamage, IceFlatDamage, LifeFlatDamage, MythFlatDamage, StormFlatDamage
- **FlatReduceDamage (7)**: BalanceFlatReduceDamage, DeathFlatReduceDamage, FireFlatReduceDamage, IceFlatReduceDamage, LifeFlatReduceDamage, MythFlatReduceDamage, StormFlatReduceDamage
- **PipConversion (8)**: AllPipConversion, BalancePipConversion, DeathPipConversion, FirePipConversion, IcePipConversion, LifePipConversion, MythPipConversion, StormPipConversion
- **Other (2)**: AllArchmastery, ShadowPipRating

### 3.3 Boolean / Utility Stats (`StatType.BOOLEAN`)
These 7 stats do not follow the mathematical offset pattern and usually represent a binary flag (0 or 1). (Formula: `display = raw`).
- **Mastery (7)**: BalanceMastery, DeathMastery, FireMastery, IceMastery, LifeMastery, MythMastery, StormMastery

*(Any future stat discovered that is not in this explicit list must default to `FLAT` and trigger a warning for manual classification).*
