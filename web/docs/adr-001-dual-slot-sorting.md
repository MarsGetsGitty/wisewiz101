# Architecture Decision Record (ADR)

## Dual-Slot Column Sorting System

**Date:** 2026-02-24
**Status:** Accepted

### Context
Users browsing through 50,000+ gear items need a powerful, yet intuitive sorting mechanism. The previous multi-sort system (Shift+Click) was opaque, physically taxing (requiring a keyboard modifier), and didn't align with how players typically search for MMO gear (e.g., "I want the highest Health among all Fire rings").

Additionally, clicking a numeric stat column defaulted to an Ascending sort (smallest to largest), which is antithetical to typical RPG gear searching where players prioritize the highest values (Descending).

### Decision
We replaced the raw multi-sort logic with a semantic **Dual-Slot Column Sorting System**. 

The system categorizes all table columns into two distinct, mutually-exclusive groups:
1. **Group 1 (Metadata):** Name, Type, School, Level, Rarity
2. **Group 2 (Stats):** Any numeric gear stat (Health, Damage, Resist, etc.)

**Rules of the System:**
1. **The Rule of Two:** A user can have at most *one* active sort from Group 1, and *one* active sort from Group 2 at any given time.
2. **Auto-Replacement:** Clicking a column within a Group immediately replaces any existing sort in that same Group. This removes the need for holding the `Shift` key.
3. **Primary Precedence:** When both a Group 1 and Group 2 sort are active, Group 1 is *always* evaluated first, acting as the primary grouping mechanism (e.g., Group by School, then Sort by Max Health descending).
4. **Smart Defaults:** 
   - All Group 2 (Stats) and `Level` default to **Descending** (highest first) on the initial click. 
   - All other Group 1 (Metadata) columns default to **Ascending** (A-Z).
5. **Visual Affordance:** 
   - Active Group 1 columns are highlighted with an **Accent/Gold** sort arrow.
   - Active Group 2 columns are highlighted with a **Primary/Purple** sort arrow.
   - The numerical "1" and "2" badges were removed in favor of this cleaner color-coding.

### Consequences
**Positive:**
- Dramatically simplifies the mental model of multi-sorting gear.
- Removes keyboard reliance, making the system fully touch-friendly and discoverable.
- Eliminates the frustration of "backwards" stat sorting by defaulting to Descending limits.

**Negative:**
- Users can no longer sort by three or more columns simultaneously (e.g., School -> Type -> Level). However, through extensive playtesting, this was deemed an edge-case heavily outweighed by the improved UX of the dual-slot system. Deep filtering is handled by the Sidebar, not the column sorts.
