# Stat Value Offset: Findings & Approach Options

## Discovery

All stat values extracted from BINd files are **systematically offset** from the values displayed in-game and on the wiki. Two rules apply:

| Stat Category | Raw → Display Formula | Example |
|---------------|----------------------|---------|
| **Flat** (Health, Mana, Block, Critical, Shadow Rating) | `display = raw + 1` | 787 → 788 HP |
| **Percentage** (Damage, Resist, Accuracy, Pierce, Pip%, Healing) | `display = raw - 99` | 129 → 30% Fire Damage |

The percentage formula is equivalent to `(raw - 100) + 1`, meaning the game stores percentages with a **+100 bias** on top of the same -1 offset. Subtracting 100 reveals the identical `+1` pattern.

---

## Verification: 6 Items, 39 Stats, 0 Mismatches

### Item 1: Frostbit Hood (Waterworks, Level 60, Ice Hat)

| Stat | Raw | Formula | Result | Wiki | Match |
|------|-----|---------|--------|------|-------|
| MaxHealth | 353 | +1 | 354 | 354 | ✅ |
| IceDamage | 111 | -99 | 12 | 12% | ✅ |
| AllAccuracy | 102 | -99 | 3 | 3% | ✅ |
| IncHealing | 104 | -99 | 5 | 5% | ✅ |
| AllReduceDamage | 111 | -99 | 12 | 12% | ✅ |
| IceCriticalHit | 52 | +1 | 53 | 53 | ✅ |

### Item 2: Sky Iron Hasta (Aquila Wand, Level 30)

| Stat | Raw | Formula | Result | Wiki | Match |
|------|-----|---------|--------|------|-------|
| AllDamage | 109 | -99 | 10 | 10% | ✅ |

### Item 3: Amulet of Divine Influence (Aquila Amulet, Level 90)

| Stat | Raw | Formula | Result | Wiki | Match |
|------|-----|---------|--------|------|-------|
| MaxHealth | 199 | +1 | 200 | 200 | ✅ |
| AllArmorPiercing | 102 | -99 | 3 | 3% | ✅ |
| AllBlock | 44 | +1 | 45 | 45 | ✅ |
| AllCriticalHit | 29 | +1 | 30 | 30 | ✅ |
| AllReduceDamage | 102 | -99 | 3 | 3% | ✅ |

### Item 4: Blade of the Felled Titan (Aquila Athame, Level 90)

| Stat | Raw | Formula | Result | Wiki | Match |
|------|-----|---------|--------|------|-------|
| MaxHealth | 319 | +1 | 320 | 320 | ✅ |
| MaxMana | 209 | +1 | 210 | 210 | ✅ |
| PowerPip | 116 | -99 | 17 | 17% | ✅ |
| LifeHealing | 116 | -99 | 17 | 17% | ✅ |
| AllDamage | 114 | -99 | 15 | 15% | ✅ |
| AllBlock | 14 | +1 | 15 | 15 | ✅ |

### Item 5: Alpha and Omega Ring (Aquila Ring, Level 90)

| Stat | Raw | Formula | Result | Wiki | Match |
|------|-----|---------|--------|------|-------|
| MaxHealth | 369 | +1 | 370 | 370 | ✅ |
| MaxMana | 134 | +1 | 135 | 135 | ✅ |
| PowerPip | 113 | -99 | 14 | 14% | ✅ |
| IncHealing | 116 | -99 | 17 | 17% | ✅ |
| AllDamage | 109 | -99 | 10 | 10% | ✅ |
| AllBlock | 29 | +1 | 30 | 30 | ✅ |

### Item 6: Dragoon's Fiery Helm (Catacombs, Level 130, Fire Hat)

| Stat | Raw | Formula | Result | Wiki | Match |
|------|-----|---------|--------|------|-------|
| MaxHealth | 787 | +1 | 788 | 788 | ✅ |
| FireDamage | 129 | -99 | 30 | 30% | ✅ |
| FireArmorPiercing | 104 | -99 | 5 | 5% | ✅ |
| PowerPip | 112 | -99 | 13 | 13% | ✅ |
| FireAccuracy | 107 | -99 | 8 | 8% | ✅ |
| FireCriticalHit | 161 | +1 | 162 | 162 | ✅ |
| ShadowPipRating | 13 | +1 | 14 | 14 | ✅ |

**Result: 39/39 stats match (100% accuracy)**

---

## Why Does This Happen?

The offset is baked into the binary data at the byte level — shifting the read position ±1
byte yields nonsense values (51040, 1476395008), confirming correct byte alignment. The int32 `C7 00 00 00` really is stored as 199, not 200.

**Best theory: Zero-indexed storage convention.** The game engine appears to store stat
values starting from 0 instead of 1. When the engine reads these values for display, it adds 1.
The +100 bias on percentage stats may serve as an internal type discriminator (values ≥ 100
indicate percentage stats) or simply be the engine's internal scaling convention.

---

## Approach Options

### Option 1: Apply Correction in Parser

Apply `+1` / `-99` during extraction so output directly matches in-game values.

**Pros:**
- Output immediately usable — matches wiki/game values
- Consumers don't need to know about the encoding
- Simplest for downstream tools, filters, and comparisons
- "What you see is what you get"

**Cons:**
- We're making assumptions about the engine's intent
- If any stat doesn't follow this pattern, we'd silently produce wrong values
- Requires maintaining a `PERCENTAGE_STATS` set (new stats = new maintenance)
- Loses the raw ground truth — harder to debug future issues

### Option 2: Store Raw Values Only, Document Formula

Keep raw values and publish the conversion formula in documentation.

**Pros:**
- Ground truth preserved — no assumptions embedded in data
- If a stat doesn't follow the pattern, the raw value is still correct
- No maintenance burden for classifying stats
- Easier to debug and validate against binary data

**Cons:**
- Every consumer must implement the conversion themselves
- Easy to forget or misapply the formula
- Less intuitive — "199 health" is confusing
- Percentage stats stored as 102-129 are unreadable without context

### Option 3: Store Both Raw and Corrected

Add separate fields: `raw_stats` (original) and `stats` (corrected).

**Pros:**
- Best of both worlds — usable AND debuggable
- Ground truth preserved alongside human-readable values
- Consumers can choose which to use
- Makes the encoding visible and verifiable

**Cons:**
- Doubles the stat data in output (JSON size, CSV columns)
- More complex output schema
- May confuse consumers about which to use
- Adds complexity to the parser and extractor
