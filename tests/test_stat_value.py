"""
Unit tests for StatValue Value Object.
Tests the core business rule: raw binary integer → display value.
"""

import pytest
from src.bind_parser import StatType, StatValue


class TestFlatStatMath:
    """Flat stats: display = raw + 1."""

    def test_zero_raw(self):
        vo = StatValue(name="MaxHealth", raw=0, type=StatType.FLAT)
        assert vo.display_value == 1

    def test_typical_health(self):
        vo = StatValue(name="MaxHealth", raw=199, type=StatType.FLAT)
        assert vo.display_value == 200

    def test_large_value(self):
        vo = StatValue(name="MaxHealth", raw=999, type=StatType.FLAT)
        assert vo.display_value == 1000

    def test_critical_hit(self):
        vo = StatValue(name="AllCriticalHit", raw=29, type=StatType.FLAT)
        assert vo.display_value == 30

    def test_block(self):
        vo = StatValue(name="FireBlock", raw=44, type=StatType.FLAT)
        assert vo.display_value == 45


class TestPercentageStatMath:
    """Percentage stats: display = raw - 99."""

    def test_typical_damage(self):
        vo = StatValue(name="FireDamage", raw=129, type=StatType.PERCENTAGE)
        assert vo.display_value == 30

    def test_zero_percent(self):
        vo = StatValue(name="AllDamage", raw=99, type=StatType.PERCENTAGE)
        assert vo.display_value == 0

    def test_one_percent(self):
        vo = StatValue(name="AllAccuracy", raw=100, type=StatType.PERCENTAGE)
        assert vo.display_value == 1

    def test_fifty_percent(self):
        vo = StatValue(name="StormDamage", raw=149, type=StatType.PERCENTAGE)
        assert vo.display_value == 50

    def test_power_pip(self):
        vo = StatValue(name="PowerPip", raw=116, type=StatType.PERCENTAGE)
        assert vo.display_value == 17

    def test_resist(self):
        vo = StatValue(name="AllReduceDamage", raw=102, type=StatType.PERCENTAGE)
        assert vo.display_value == 3


class TestBooleanStatMath:
    """Boolean stats: display = raw (identity)."""

    def test_true(self):
        vo = StatValue(name="FireMastery", raw=1, type=StatType.BOOLEAN)
        assert vo.display_value == 1

    def test_false(self):
        vo = StatValue(name="FireMastery", raw=0, type=StatType.BOOLEAN)
        assert vo.display_value == 0


class TestStatValueProperties:
    """Immutability, repr, and equality."""

    def test_frozen_immutable(self):
        vo = StatValue(name="MaxHealth", raw=199, type=StatType.FLAT)
        with pytest.raises(AttributeError):
            vo.raw = 500  # type: ignore[misc]

    def test_repr_flat_shows_both_values(self):
        vo = StatValue(name="MaxHealth", raw=199, type=StatType.FLAT)
        r = repr(vo)
        assert "200" in r
        assert "199" in r

    def test_repr_percentage_shows_percent_sign(self):
        vo = StatValue(name="FireDamage", raw=129, type=StatType.PERCENTAGE)
        assert "30%" in repr(vo)

    def test_equality_same_values(self):
        a = StatValue(name="MaxHealth", raw=199, type=StatType.FLAT)
        b = StatValue(name="MaxHealth", raw=199, type=StatType.FLAT)
        assert a == b

    def test_inequality_different_raw(self):
        a = StatValue(name="MaxHealth", raw=199, type=StatType.FLAT)
        b = StatValue(name="MaxHealth", raw=200, type=StatType.FLAT)
        assert a != b
