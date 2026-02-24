"""
Integration tests: parse real BINd files from the WAD and assert
display values match wiki-verified ground truth.

These tests require the Wizard101 game files to be present locally.
They will be skipped in CI or environments without game data.
"""

import os

import pytest
from src.bind_parser import BINdParser

WAD_PATH = os.path.join(
    r"C:\ProgramData\KingsIsle Entertainment\Wizard101",
    "Data", "GameData", "Root.wad",
)

# Skip entire module if WAD is not available
pytestmark = pytest.mark.skipif(
    not os.path.exists(WAD_PATH),
    reason="Root.wad not available (CI environment)",
)


@pytest.fixture(scope="module")
def wad():
    from src.wad_reader import WadArchive
    return WadArchive(WAD_PATH)


@pytest.fixture(scope="module")
def parser():
    return BINdParser()


# =========================================================================
# Wiki-Verified Items
# =========================================================================
# Each dict maps stat_name → expected display value from the Wizard101 Wiki.

WIKI_ITEMS = {
    "ObjectData/Aquila Gear/Amulets/Amulet-AQ-L90-001.xml": {
        "display_name": "Amulet of Divine Influence",
        "stats": {
            "MaxHealth": 200,
            "AllArmorPiercing": 3,
            "AllBlock": 45,
            "AllCriticalHit": 30,
            "AllReduceDamage": 3,
        },
    },
    "ObjectData/Aquila Gear/Athames/Athame-AQ-L90-001.xml": {
        "display_name": "Alpha and Omega",
        "stats": {
            "MaxHealth": 320,
            "MaxMana": 210,
            "PowerPip": 17,
            "LifeHealing": 17,
            "AllDamage": 15,
            "AllBlock": 15,
        },
    },
}


class TestWikiVerifiedItems:
    """Parse known items and assert every stat matches the wiki exactly."""

    @pytest.mark.parametrize(
        "wad_path,expected",
        WIKI_ITEMS.items(),
        ids=[p.split("/")[-1] for p in WIKI_ITEMS],
    )
    def test_item_stats(self, wad, parser, wad_path, expected):
        data = wad.extract_file(wad_path)
        item = parser.parse(data, wad_path)

        assert item is not None, f"Parser returned None for {wad_path}"
        assert item.has_stats, f"Item {wad_path} should have stats"

        for stat_name, expected_value in expected["stats"].items():
            actual = item.stats.get(stat_name)
            assert actual == expected_value, (
                f"{expected['display_name']}.{stat_name}: "
                f"expected {expected_value}, got {actual}"
            )
