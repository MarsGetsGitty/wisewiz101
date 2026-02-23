# Gear Data Taxonomy

> **Version:** 2.0 — Updated with actual extraction results  
> **Source:** Full extraction from `Root.wad` (166,912 entries) via `gear_extractor.py`  
> **Last Updated:** 2026-02-23

## Extraction Results

| Metric | Value |
|--------|-------|
| WAD files scanned | 50,928 gear candidates |
| Items extracted | **50,822** |
| Read errors | 0 |
| Throughput | ~1,900 files/sec (~27 seconds total) |
| Output JSON | 31.5 MB |
| Output CSV | 13.3 MB |

## Equipment Slot Distribution

| Slot | Count | Notes |
|------|------:|-------|
| Hat | 7,736 | |
| Robe | 7,684 | |
| Shoes | 7,573 | Game uses "Shoes" not "Boots" |
| Wand | 1,462 | |
| Athame | 4,021 | |
| Amulet | 3,503 | |
| Ring | 3,673 | |
| Deck | 3,396 | |
| (unknown) | ~11,774 | Items without a detected type string |

## Rarity Distribution

| Rarity | Count |
|--------|------:|
| RT_EPIC | 21,268 |
| RT_COMMON | 13,637 |
| RT_RARE | 7,455 |
| (none) | 8,323 |
| RT_UNCOMMON | 139 |

## School Distribution

| School | Count |
|--------|------:|
| All | 16,652 |
| Fire | 6,578 |
| Balance | 4,429 |
| Ice | 4,419 |
| Death | 4,403 |
| Life | 4,386 |
| Myth | 4,367 |
| Storm | 4,363 |
| Shadow | 3 |
| (none) | 1,222 |

## Stats Coverage

| Metric | Count |
|--------|------:|
| Items with stats | 47,147 |
| Blank items (no stats, no flags) | 469 |
| Items with flags | 40,759 |
| Items with jewel sockets | 14,882 |
| **Unique stat types** | **92** |

### All 92 Stat Types (with item counts)

| Stat | Items | Stat | Items |
|------|------:|------|------:|
| MaxHealth | 34,288 | PowerPip | 20,048 |
| AllBlock | 15,468 | AllReduceDamage | 15,179 |
| AllDamage | 8,545 | ShadowPipRating | 7,496 |
| MaxMana | 5,696 | LifeHealing | 5,049 |
| IceDamage | 5,074 | MythDamage | 5,071 |
| AllCriticalHit | 4,989 | DeathDamage | 4,919 |
| StormDamage | 4,911 | LifeDamage | 4,893 |
| FireDamage | 4,860 | AllAccuracy | 4,692 |
| BalanceDamage | 4,255 | IncHealing | 4,048 |
| AllArmorPiercing | 3,639 | StormAccuracy | 2,471 |
| FireAccuracy | 2,380 | IceAccuracy | 2,373 |
| MythAccuracy | 2,359 | MythCriticalHit | 2,299 |
| StormCriticalHit | 2,250 | FireCriticalHit | 2,239 |
| IceCriticalHit | 2,209 | DeathCriticalHit | 2,180 |
| LifeCriticalHit | 2,135 | DeathAccuracy | 2,059 |
| LifeAccuracy | 2,125 | BalanceAccuracy | 1,814 |
| StunResistance | 1,881 | AllArchmastery | 1,589 |
| AllPipConversion | 1,411 | MaxEnergy | 1,372 |
| DeathReduceDamage | 1,290 | FireReduceDamage | 1,244 |
| MythReduceDamage | 1,215 | LifeReduceDamage | 1,214 |
| StormReduceDamage | 1,204 | FireArmorPiercing | 1,146 |
| MythArmorPiercing | 1,125 | IceArmorPiercing | 1,105 |
| StormArmorPiercing | 1,102 | DeathArmorPiercing | 1,083 |
| LifeArmorPiercing | 1,085 | IceReduceDamage | 1,085 |
| BalanceArmorPiercing | 1,005 | AllFishingLuck | 701 |
| IcePipConversion | 536 | LifePipConversion | 529 |
| MythPipConversion | 519 | StormPipConversion | 519 |
| FirePipConversion | 514 | DeathPipConversion | 513 |
| DeathBlock | 503 | StormBlock | 497 |
| MythBlock | 487 | LifeBlock | 469 |
| BalancePipConversion | 468 | FireBlock | 468 |
| IceBlock | 422 | BalanceReduceDamage | 400 |
| MaxManaPercentReduce | 365 | BalanceBlock | 147 |
| ShadowDamage | 37 | ShadowReduceDamage | 36 |
| ShadowArmorPiercing | 32 | BalanceMastery | 27 |
| DeathMastery | 24 | IceMastery | 24 |
| LifeMastery | 23 | MythMastery | 23 |
| FireMastery | 22 | StormMastery | 22 |
| BalanceFlatDamage | 18 | DeathFlatDamage | 18 |
| LifeFlatDamage | 18 | StormFlatDamage | 16 |
| FireFlatDamage | 13 | MythFlatDamage | 13 |
| IceFlatDamage | 11 | BalanceFlatReduceDamage | 10 |
| DeathFlatReduceDamage | 10 | FireFlatReduceDamage | 10 |
| IceFlatReduceDamage | 10 | LifeFlatReduceDamage | 10 |
| MythFlatReduceDamage | 10 | StormFlatReduceDamage | 10 |
| ShadowBlock | 1 | | |

## Gear Identification Strategy

Items are identified by **BINd content parsing**, not file paths:

1. **String extraction** — `length×2` prefix encoding finds all embedded strings
2. **Pattern classification** — strings classified by known patterns (types, flags, stats, etc.)
3. **Stat value extraction** — 8-byte gap pattern between stat name and int32LE value
4. **Blank detection** — items with no stats AND no flags are marked as blanks
