"""
Unit tests for classify_stat() — exhaustive taxonomy verification.
Every single one of the 92 known stats must map to its correct StatType.
"""

import pytest
from src.bind_parser import (
    BOOLEAN_STATS,
    FLAT_STATS,
    PERCENTAGE_STATS,
    StatType,
    classify_stat,
)


class TestPercentageClassification:
    """All 41 percentage stats must classify correctly."""

    @pytest.mark.parametrize("stat_name", sorted(PERCENTAGE_STATS))
    def test_percentage_stat(self, stat_name: str):
        assert classify_stat(stat_name) == StatType.PERCENTAGE, (
            f"{stat_name} should be PERCENTAGE"
        )


class TestFlatClassification:
    """All 44 flat stats must classify correctly."""

    @pytest.mark.parametrize("stat_name", sorted(FLAT_STATS))
    def test_flat_stat(self, stat_name: str):
        assert classify_stat(stat_name) == StatType.FLAT, (
            f"{stat_name} should be FLAT"
        )


class TestBooleanClassification:
    """All 7 boolean stats must classify correctly."""

    @pytest.mark.parametrize("stat_name", sorted(BOOLEAN_STATS))
    def test_boolean_stat(self, stat_name: str):
        assert classify_stat(stat_name) == StatType.BOOLEAN, (
            f"{stat_name} should be BOOLEAN"
        )


class TestUnknownStatFallback:
    """Unknown stats default to FLAT as a safety net."""

    def test_unknown_defaults_to_flat(self):
        assert classify_stat("SomeNewStat2025") == StatType.FLAT

    def test_empty_string_defaults_to_flat(self):
        assert classify_stat("") == StatType.FLAT
