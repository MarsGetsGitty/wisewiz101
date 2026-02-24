"""
Unit tests for GearItem Aggregate Root.
Tests add_stat factory, display_stats property, serialization boundary.
"""

from src.bind_parser import GearItem


class TestAddStat:
    """The add_stat factory must classify and store VOs correctly."""

    def test_add_flat_stat(self):
        item = GearItem()
        item.add_stat("MaxHealth", 199)
        assert item.stats["MaxHealth"] == 200

    def test_add_percentage_stat(self):
        item = GearItem()
        item.add_stat("FireDamage", 129)
        assert item.stats["FireDamage"] == 30

    def test_add_boolean_stat(self):
        item = GearItem()
        item.add_stat("FireMastery", 1)
        assert item.stats["FireMastery"] == 1

    def test_add_multiple_stats(self):
        item = GearItem()
        item.add_stat("MaxHealth", 199)
        item.add_stat("AllBlock", 44)
        item.add_stat("AllArmorPiercing", 102)
        assert item.stats == {
            "MaxHealth": 200,
            "AllBlock": 45,
            "AllArmorPiercing": 3,
        }


class TestItemState:
    """is_blank and has_stats reflect internal state correctly."""

    def test_blank_when_empty(self):
        item = GearItem()
        assert item.is_blank

    def test_not_blank_with_stats(self):
        item = GearItem()
        item.add_stat("MaxHealth", 199)
        assert not item.is_blank

    def test_not_blank_with_flags(self):
        item = GearItem(flags=["FLAG_NoAuction"])
        assert not item.is_blank

    def test_has_stats_false_empty(self):
        item = GearItem()
        assert not item.has_stats

    def test_has_stats_true(self):
        item = GearItem()
        item.add_stat("MaxHealth", 199)
        assert item.has_stats


class TestSerialization:
    """to_dict must produce correct display stats and optionally raw stats."""

    def test_default_has_display_stats_only(self):
        item = GearItem(name="TestItem", item_type="Hat")
        item.add_stat("MaxHealth", 199)
        item.add_stat("FireDamage", 129)
        d = item.to_dict()
        assert d["stats"]["MaxHealth"] == 200
        assert d["stats"]["FireDamage"] == 30
        assert "raw_stats" not in d

    def test_include_raw_adds_raw_stats(self):
        item = GearItem(name="TestItem", item_type="Hat")
        item.add_stat("MaxHealth", 199)
        item.add_stat("FireDamage", 129)
        d = item.to_dict(include_raw=True)
        assert d["stats"]["MaxHealth"] == 200
        assert d["raw_stats"]["MaxHealth"] == 199
        assert d["stats"]["FireDamage"] == 30
        assert d["raw_stats"]["FireDamage"] == 129

    def test_wand_subtype_included(self):
        item = GearItem(name="TestWand", item_type="Wand", wand_subtype="Staff")
        d = item.to_dict()
        assert d["wand_subtype"] == "Staff"

    def test_wand_subtype_absent_when_empty(self):
        item = GearItem(name="TestHat", item_type="Hat")
        d = item.to_dict()
        assert "wand_subtype" not in d
