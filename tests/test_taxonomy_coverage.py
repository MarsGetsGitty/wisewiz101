"""
Taxonomy coverage assertions.
Ensures the three stat frozensets are complete, correctly sized,
and have zero overlap.
"""

from src.bind_parser import BOOLEAN_STATS, FLAT_STATS, PERCENTAGE_STATS


EXPECTED_TOTAL = 92


class TestCounts:
    """Each category must have the exact expected count."""

    def test_percentage_count(self):
        assert len(PERCENTAGE_STATS) == 41

    def test_flat_count(self):
        assert len(FLAT_STATS) == 44

    def test_boolean_count(self):
        assert len(BOOLEAN_STATS) == 7

    def test_total_count(self):
        total = len(PERCENTAGE_STATS) + len(FLAT_STATS) + len(BOOLEAN_STATS)
        assert total == EXPECTED_TOTAL, (
            f"Expected {EXPECTED_TOTAL} total stats, got {total}"
        )


class TestNoOverlap:
    """No stat should appear in more than one category."""

    def test_percentage_vs_flat(self):
        overlap = PERCENTAGE_STATS & FLAT_STATS
        assert not overlap, f"Overlap between PERCENTAGE and FLAT: {overlap}"

    def test_percentage_vs_boolean(self):
        overlap = PERCENTAGE_STATS & BOOLEAN_STATS
        assert not overlap, f"Overlap between PERCENTAGE and BOOLEAN: {overlap}"

    def test_flat_vs_boolean(self):
        overlap = FLAT_STATS & BOOLEAN_STATS
        assert not overlap, f"Overlap between FLAT and BOOLEAN: {overlap}"

    def test_all_three(self):
        """Triple intersection must be empty."""
        overlap = PERCENTAGE_STATS & FLAT_STATS & BOOLEAN_STATS
        assert not overlap, f"Three-way overlap: {overlap}"
