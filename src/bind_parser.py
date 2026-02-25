# BINd Binary Serialization Parser
# =================================
# Parses Wizard101's proprietary BINd binary format to extract gear data.
#
# Approach: String-extraction-based parsing (see docs/decisions/001_parser_approach.md)
# Format details: see docs/formats/bind_spec.md
#
# Key discoveries:
#   - Strings use length*2 prefix: byte B followed by B//2 ASCII chars
#     (engine likely uses wchar_t internally, stores byte count)
#   - Stat values: stat_name -> 8-byte gap (60 00 00 00 CC 4F F4 60) -> int32LE value
#   - Hash 0x78F28C29 precedes every stat property entry
#   - Root class hash 0x3B1F88D1 identifies item object files

import struct
from dataclasses import dataclass, field
from enum import Enum

BIND_MAGIC = b"BINd"

# Known stat property hash (appears before every Canonical* stat entry)
STAT_PROPERTY_HASH = 0x78F28C29

# 8-byte sequence between stat name string and its int32 value
STAT_VALUE_GAP = bytes([0x60, 0x00, 0x00, 0x00, 0xCC, 0x4F, 0xF4, 0x60])


class StatType(Enum):
    FLAT = "FLAT"           # e.g., Health, Critical
    PERCENTAGE = "PERCENT"  # e.g., Damage, Resist
    BOOLEAN = "BOOLEAN"     # e.g., Mastery amulets


@dataclass(frozen=True)
class StatValue:
    """Value Object representing a single stat and its encoding logic."""
    name: str
    raw: int
    type: StatType

    @property
    def display_value(self) -> int:
        """The canonical value as seen by the player in-game."""
        if self.type == StatType.PERCENTAGE:
            return self.raw - 99
        elif self.type == StatType.FLAT:
            return self.raw + 1
        return self.raw  # Boolean or unknown

    def __repr__(self):
        suffix = "%" if self.type == StatType.PERCENTAGE else ""
        return f"{self.display_value}{suffix} (raw: {self.raw})"


# ==============================================================================
# Stat Taxonomy (Exhaustive Classification of 92 Known Stats)
# ==============================================================================

PERCENTAGE_STATS = frozenset({
    # Accuracy (8)
    "AllAccuracy", "BalanceAccuracy", "DeathAccuracy", "FireAccuracy",
    "IceAccuracy", "LifeAccuracy", "MythAccuracy", "StormAccuracy",
    # ArmorPiercing (9)
    "AllArmorPiercing", "BalanceArmorPiercing", "DeathArmorPiercing",
    "FireArmorPiercing", "IceArmorPiercing", "LifeArmorPiercing",
    "MythArmorPiercing", "ShadowArmorPiercing", "StormArmorPiercing",
    # Damage (9)
    "AllDamage", "BalanceDamage", "DeathDamage", "FireDamage",
    "IceDamage", "LifeDamage", "MythDamage", "ShadowDamage", "StormDamage",
    # ReduceDamage (9)
    "AllReduceDamage", "BalanceReduceDamage", "DeathReduceDamage",
    "FireReduceDamage", "IceReduceDamage", "LifeReduceDamage",
    "MythReduceDamage", "ShadowReduceDamage", "StormReduceDamage",
    # Healing (2)
    "IncHealing", "LifeHealing",
    # Other (4)
    "AllFishingLuck", "MaxManaPercentReduce", "PowerPip", "StunResistance",
})

FLAT_STATS = frozenset({
    # Health/Mana/Energy (3)
    "MaxHealth", "MaxMana", "MaxEnergy",
    # Block (9)
    "AllBlock", "BalanceBlock", "DeathBlock", "FireBlock",
    "IceBlock", "LifeBlock", "MythBlock", "ShadowBlock", "StormBlock",
    # CriticalHit (8)
    "AllCriticalHit", "BalanceCriticalHit", "DeathCriticalHit",
    "FireCriticalHit", "IceCriticalHit", "LifeCriticalHit",
    "MythCriticalHit", "StormCriticalHit",
    # FlatDamage (7)
    "BalanceFlatDamage", "DeathFlatDamage", "FireFlatDamage",
    "IceFlatDamage", "LifeFlatDamage", "MythFlatDamage", "StormFlatDamage",
    # FlatReduceDamage (7)
    "BalanceFlatReduceDamage", "DeathFlatReduceDamage", "FireFlatReduceDamage",
    "IceFlatReduceDamage", "LifeFlatReduceDamage", "MythFlatReduceDamage",
    "StormFlatReduceDamage",
    # PipConversion (8)
    "AllPipConversion", "BalancePipConversion", "DeathPipConversion",
    "FirePipConversion", "IcePipConversion", "LifePipConversion",
    "MythPipConversion", "StormPipConversion",
    # Other (2)
    "AllArchmastery", "ShadowPipRating",
})

BOOLEAN_STATS = frozenset({
    # Mastery (7)
    "BalanceMastery", "DeathMastery", "FireMastery", "IceMastery",
    "LifeMastery", "MythMastery", "StormMastery",
})

def classify_stat(name: str) -> StatType:
    """Classify a known stat name into its structural type."""
    if name in PERCENTAGE_STATS:
        return StatType.PERCENTAGE
    elif name in FLAT_STATS:
        return StatType.FLAT
    elif name in BOOLEAN_STATS:
        return StatType.BOOLEAN

    # Fallback to FLAT and log (in a real app, we'd log a warning)
    # print(f"WARNING: Unknown stat '{name}' defaulted to FLAT classification.")
    return StatType.FLAT

# ==============================================================================

# Equipment slot types (as they appear in BINd strings)
EQUIPMENT_TYPES = frozenset({
    "Hat", "Robe", "Shoes", "Shoe", "Boot", "Boots",
    "Wand", "Weapon", "Athame", "Amulet", "Ring", "Deck",
})

# Wand-specific subtypes (weapon model categories)
WAND_SUBTYPES = frozenset({
    "Spear", "Staff", "Sword", "Relic", "Banner", "Fist",
    "TwoHandedSword", "OFFHAND",
})

# Path-based type detection fallback (when BINd strings don't have a type)
PATH_TYPE_MAP = {
    "/Hats/": "Hat", "/Hat/": "Hat",
    "/Robes/": "Robe", "/Robe/": "Robe",
    "/Shoes/": "Shoes", "/Boots/": "Shoes", "/Boot/": "Shoes",
    "/Wands/": "Wand", "/Wand/": "Wand",
    "/Athames/": "Athame", "/Athame/": "Athame",
    "/Amulets/": "Amulet", "/Amulet/": "Amulet",
    "/Rings/": "Ring", "/Ring/": "Ring",
    "/Decks/": "Deck", "/Deck/": "Deck",
}

# Socket types
SOCKET_TYPES = frozenset({
    "SOCKETTYPE_TEAR", "SOCKETTYPE_CIRCLE", "SOCKETTYPE_TRIANGLE",
    "SOCKETTYPE_SQUARE", "SOCKETTYPE_POWER",
})

# Rarity tiers
RARITY_TIERS = frozenset({
    "RT_COMMON", "RT_UNCOMMON", "RT_RARE", "RT_EPIC", "RT_LEGENDARY",
})

# Item flags
KNOWN_FLAGS = frozenset({
    "FLAG_NoAuction", "FLAG_NoPvP", "FLAG_CrownsOnly",
    "FLAG_NoTrade", "FLAG_NoSell", "FLAG_NoShatter",
    "FLAG_ArenaOnly", "FLAG_PvPOnly", "FLAG_NoHatchmaking",
})

# Schools
SCHOOLS = frozenset({
    "All", "Fire", "Ice", "Storm", "Myth", "Life", "Death", "Balance",
    "Star", "Sun", "Moon", "Shadow", "Gardening", "Fishing",
})


@dataclass
class GearItem:
    """Extracted gear data from a BINd file."""
    source_path: str = ""             # WAD path this came from
    name: str = ""                    # Internal item name
    display_name_key: str = ""        # Locale key (e.g. Items_00008758)
    display_name: str = ""             # Resolved display name
    acquisition_type: str = ""        # Craft, Crowns, Drop, etc.
    season_id: str = ""               # S61, T11, etc.
    set_id: str = ""                  # e.g. 006
    item_type: str = ""               # Equipment slot (Hat, Robe, etc.)
    wand_subtype: str = ""            # Wand weapon subtype (Spear, Staff, etc.)
    school: str = ""                  # Magic school
    rarity: str = ""                  # RT_COMMON, RT_EPIC, etc.
    flags: list[str] = field(default_factory=list)
    sockets: list[str] = field(default_factory=list)
    _stats: dict[str, StatValue] = field(default_factory=dict)
    behaviors: list[str] = field(default_factory=list)
    adjref: str = ""                  # Adjacency reference
    set_name: str = ""                # Set bonus name (if any)
    level_req: int = 0                # Required level (from path heuristic)
    model_path: str = ""              # NIF model path
    type_source: str = ""             # How the type was determined (string/path)
    bind_version: int = 0
    class_hash: int = 0

    def add_stat(self, name: str, raw_value: int) -> None:
        """Factory method to classify and add a stat VO."""
        stat_type = classify_stat(name)
        self._stats[name] = StatValue(name=name, raw=raw_value, type=stat_type)

    @property
    def stats(self) -> dict[str, int]:
        """Gets consumer-ready, math-corrected stat values."""
        return {name: vo.display_value for name, vo in self._stats.items()}

    @property
    def is_blank(self) -> bool:
        """Blank templates have no stats and minimal data."""
        return not self._stats and not self.flags

    @property
    def has_stats(self) -> bool:
        return bool(self._stats)

    def to_dict(self, include_raw: bool = False) -> dict:
        """Convert to a plain dict for JSON serialization."""
        d = {
            "source_path": self.source_path,
            "name": self.name,
            "display_name": self.display_name,
            "display_name_key": self.display_name_key,
            "item_type": self.item_type,
            "school": self.school,
            "rarity": self.rarity,
            "flags": self.flags,
            "sockets": self.sockets,
            "stats": self.stats,   # The default behavior is correct display stats
            "behaviors": self.behaviors,
            "adjref": self.adjref,
            "set_name": self.set_name,
            "level_req": self.level_req,
            "type_source": self.type_source,
        }
        if self.acquisition_type:
            d["acquisition_type"] = self.acquisition_type
        if self.season_id:
            d["season_id"] = self.season_id
        if self.set_id:
            d["set_id"] = self.set_id
        if self.wand_subtype:
            d["wand_subtype"] = self.wand_subtype

        if include_raw:
            d["raw_stats"] = {name: vo.raw for name, vo in self._stats.items()}

        return d


class BINdParser:
    """
    Parser for Wizard101's BINd binary serialization format.

    Usage:
        parser = BINdParser()
        item = parser.parse(raw_bytes, source_path="ObjectData/AQ/Athames/...")
        print(item.name, item.stats)
    """

    def parse(self, data: bytes, source_path: str = "") -> GearItem | None:
        """
        Parse BINd binary data into a GearItem.

        Returns None if the data is not valid BINd or not a gear item.
        """
        if len(data) < 12 or data[:4] != BIND_MAGIC:
            return None

        item = GearItem(source_path=source_path)
        item.bind_version = struct.unpack_from("<I", data, 4)[0]
        item.class_hash = struct.unpack_from("<I", data, 8)[0]

        # Extract all embedded strings
        strings = self._extract_strings(data)

        # Classify each string by its content
        self._classify_strings(item, strings, data)

        # Extract stat values using the gap pattern
        self._extract_stat_values(item, strings, data)

        # Extract level requirement from binary data, fallback to path heuristic
        item.level_req = self._level_from_binary(strings, data)
        if item.level_req == 0:
            item.level_req = self._level_from_path(source_path)

        # Path-based type fallback if no type found in strings
        if not item.item_type:
            self._type_from_path(item, source_path)

        return item

    def _extract_strings(self, data: bytes) -> list[dict]:
        """
        Find all length*2 prefixed strings in the BINd data.

        The BINd format encodes strings with a single byte prefix equal to
        string_length * 2 (likely because the engine uses wchar_t internally
        but serializes as ASCII).

        Returns list of dicts with 'pos', 'end', 'text' keys.
        """
        strings = []
        pos = 12  # Skip BINd header (magic + version + class_hash)

        while pos < len(data) - 2:
            b = data[pos]
            # Length byte must be even and >= 4 (min 2-char string)
            if b >= 4 and b % 2 == 0:
                slen = b // 2
                end = pos + 1 + slen
                if end <= len(data):
                    candidate = data[pos + 1 : end]
                    # All bytes must be printable ASCII
                    if all(0x20 <= c <= 0x7E for c in candidate) and slen >= 2:
                        text = candidate.decode("ascii")
                        strings.append({
                            "pos": pos,      # Position of length byte
                            "end": end,      # First byte after string
                            "text": text,
                        })
                        pos = end
                        continue
            pos += 1

        return strings

    def _classify_strings(self, item: GearItem, strings: list[dict],
                          data: bytes) -> None:
        """Classify extracted strings into gear item fields."""
        seen_name = False

        for i, s in enumerate(strings):
            text = s["text"]

            # Equipment type
            if text in EQUIPMENT_TYPES and not item.item_type:
                # Normalize to canonical slot names
                if text == "Weapon":
                    item.item_type = "Wand"
                elif text in ("Shoe", "Boot", "Boots"):
                    item.item_type = "Shoes"
                else:
                    item.item_type = text
                item.type_source = "string"

            # Wand subtype (weapon model category)
            elif text in WAND_SUBTYPES:
                item.wand_subtype = text

            # Rarity
            elif text in RARITY_TIERS:
                item.rarity = text

            # Socket types
            elif text in SOCKET_TYPES:
                item.sockets.append(text)

            # Flags
            elif text.startswith("FLAG_"):
                item.flags.append(text)

            # Locale key (Items_XXXXXXXX)
            elif text.startswith("Items_") and text[6:].isdigit():
                item.display_name_key = text

            # Behaviors
            elif text.endswith("Behavior"):
                item.behaviors.append(text)

            # School
            elif text in SCHOOLS and not item.school:
                item.school = text

            # AdjRef (contains ".AdjRef" suffix)
            elif text.endswith(".AdjRef"):
                item.adjref = text
                # The name is everything before .AdjRef
                if not item.name:
                    item.name = text[:-7]
                seen_name = True

            # Item name — heuristic: looks like an item ID pattern
            # Usually formatted as Type-World-Level-Num or similar
            elif not seen_name and "-" in text and not text.startswith(("Texture", "/")):
                if not any(text.startswith(p) for p in ("SOCKET", "FLAG_", "RT_",
                            "OT_", "ROP_", "OPERATOR", "Canonical", "NO_")):
                    if not item.name:
                        item.name = text
                        seen_name = True

            # Set name (SchoolMastery, etc.)
            elif "Mastery" in text or "Set" in text:
                if text not in ("CanonicalBalanceMastery",
                                "CanonicalFireMastery",
                                "CanonicalIceMastery",
                                "CanonicalStormMastery",
                                "CanonicalMythMastery",
                                "CanonicalLifeMastery",
                                "CanonicalDeathMastery"):
                    if not item.set_name:
                        item.set_name = text

    def _extract_stat_values(self, item: GearItem, strings: list[dict],
                             data: bytes) -> None:
        """
        Extract numeric stat values for Canonical* stat strings.

        Pattern: After a stat name string, there's an 8-byte gap
        (60 00 00 00 CC 4F F4 60) followed by the stat value as int32LE.
        """
        for s in strings:
            text = s["text"]
            if not text.startswith("Canonical"):
                continue

            end = s["end"]
            # Look for the stat value gap pattern after the string
            gap_start = end
            gap_end = gap_start + len(STAT_VALUE_GAP)
            val_end = gap_end + 4

            if val_end <= len(data):
                gap_bytes = data[gap_start:gap_end]
                if gap_bytes == STAT_VALUE_GAP:
                    value = struct.unpack_from("<i", data, gap_end)[0]
                    # Strip "Canonical" prefix for cleaner stat names
                    stat_name = text[9:]  # Remove "Canonical"
                    item.add_stat(stat_name, value)

    @staticmethod
    def _level_from_binary(strings: list[dict], data: bytes) -> int:
        """
        Extract level requirement from the BINd requirement expression tree.

        The game stores equip requirements as an expression tree:
            ROP_AND -> OPERATOR_GREATER_THAN_EQ -> <level as float32>

        The level is encoded as an IEEE 754 float32 (little-endian) in the
        bytes immediately before the OPERATOR_GREATER_THAN_EQ string.
        """
        for s in strings:
            if s["text"] == "OPERATOR_GREATER_THAN_EQ":
                op_pos = s["pos"]
                # Scan the 30 bytes before the operator for a plausible level float
                for off in range(max(0, op_pos - 30), op_pos):
                    if off + 4 <= len(data):
                        fval = struct.unpack_from("<f", data, off)[0]
                        if 1.0 <= fval <= 200.0 and fval == int(fval):
                            return int(fval)
        return 0

    @staticmethod
    def _level_from_path(path: str) -> int:
        """
        Fallback: try to extract a level number from the WAD file path.
        E.g. "Athame-AQ-L90-001" -> 90
        """
        import re
        match = re.search(r"-L(\d+)-", path)
        if match:
            return int(match.group(1))
        return 0

    @staticmethod
    def _type_from_path(item: 'GearItem', path: str) -> None:
        """
        Fallback: detect equipment type from the WAD file path.
        Used when the BINd data doesn't contain an explicit type string.
        """
        for pattern, slot in PATH_TYPE_MAP.items():
            if pattern in path:
                item.item_type = slot
                item.type_source = "path"
                return


# ---------------------------------------------------------------------------
# CLI for testing
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json
    import sys

    sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent.parent))
    from src.wad_reader import WadArchive

    wad_path = sys.argv[1] if len(sys.argv) > 1 else (
        r"C:\ProgramData\KingsIsle Entertainment\Wizard101"
        r"\Data\GameData\Root.wad"
    )

    wad = WadArchive(wad_path)
    parser = BINdParser()

    # Test files
    test_paths = [
        "ObjectData/Aquila Gear/Athames/Athame-AQ-L90-001.xml",
        "ObjectData/Aquila Gear/Amulets/Amulet-AQ-Balance-Mastery.xml",
        "ObjectData/Aquila Gear/Hats/AQ-Blank-Hat-01.xml",
    ]

    for path in test_paths:
        try:
            raw = wad.extract_file(path)
        except KeyError:
            print(f"SKIP: {path}")
            continue

        item = parser.parse(raw, source_path=path)
        if item:
            print(f"\n{'='*60}")
            print(json.dumps(item.to_dict(), indent=2))
            print(f"  is_blank={item.is_blank}  has_stats={item.has_stats}")
