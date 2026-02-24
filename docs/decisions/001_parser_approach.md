# ADR-001: Building the BINd Parser from Binary Pattern Analysis

> **Date:** 2026-02-23  
> **Status:** Accepted  
> **Context:** How to parse Wizard101's proprietary BINd binary serialization format

## Decision

We build our BINd parser by **reverse-engineering the binary format directly from hex analysis of extracted files**, rather than using community tools or hooking into the live game.

## Context

KingsIsle's `.xml` files inside WAD archives are not plaintext XML — they use a proprietary binary serialization format called BINd. We need to parse these to extract gear stats.

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **1. Our own parser from binary analysis** | Zero dependencies, no trust issues, works offline, full control | Slower to develop, may miss edge cases |
| **2. [wizspoil/wiztype](https://github.com/wizspoil/wiztype)** | Has full type definitions as JSON | Requires running Wizard101 instance, hooks into live memory, trust concern |
| **3. [StarrFox/wizwalker](https://github.com/StarrFox/wizwalker)** | Mature scripting API | Memory-based (not file-based), no BINd file parser, heavy dependency |
| **4. QuickBMS scripts** | Community-proven extraction | Only handles WAD extraction, not BINd parsing |

### Why Option 1

1. **Trust** — User explicitly prefers not relying on third-party tools
2. **Independence** — No need for a running game instance or external dependencies
3. **Pragmatism** — For our use case (gear stats), we don't need to parse every BINd field. We only need to reliably extract the ~15 fields relevant to gear (name, type, stats, school, rarity, sockets, flags)
4. **String extraction is sufficient** — The BINd format embeds all property names and enum values as readable ASCII strings. Even without fully understanding the record framing, we can extract structured data by reading these strings and their surrounding numeric values

## Approach

### Phase 1: String Extraction (MVP)
- Scan BINd data for length-prefixed strings and surrounding numeric context
- Map known string patterns to gear properties (stat names, types, flags)
- Produces a usable gear database without needing full format understanding

### Phase 2: Structural Parsing (If Needed)
- If string extraction proves insufficient, invest in full binary record parsing
- Use wiztype JSON as a reference for property hash → name mappings
- Reconstruct the full object tree

## Consequences

- We accept **potential gaps** in obscure or numeric-only fields that lack nearby string context
- We can **validate results** against Wizard101 Central wiki data
- The parser is a **living document** — we update `docs/formats/bind_spec.md` as we learn more
- If the community later publishes a complete BINd spec, we can adopt it without rewriting the extraction layer (the gear_extractor API stays the same)
