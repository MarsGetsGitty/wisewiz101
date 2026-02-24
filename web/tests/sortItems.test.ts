// @ts-expect-error bun is available at runtime
import { expect, test } from "bun:test";
import { sortItems } from "../src/lib/filters";
import type { GearItem } from "../src/data/types";

test("sortItems does not mutate the original array or leak stats", () => {
    const mockItems = [
        {
            name: "Item-A",
            display_name: "Item A",
            source_path: "A",
            item_type: "Hat",
            level_req: 10,
            school: "Fire",
            rarity: "RT_COMMON",
            stats: { MaxHealth: 100, PowerPip: 5 },
        } as unknown as GearItem,
        {
            name: "Item-B",
            display_name: "Item B",
            source_path: "B",
            item_type: "Hat",
            level_req: 10,
            school: "Ice",
            rarity: "RT_COMMON",
            stats: { MaxHealth: 200, IceDamage: 10 },
        } as unknown as GearItem,
    ];

    // Create a strict copy of original data for comparison
    const originalCopy = JSON.parse(JSON.stringify(mockItems));

    // Perform the sort
    const sorted = sortItems(mockItems, [{ key: "school", direction: "desc" }]);

    // 1. Verify we properly reversed the order (Ice, Fire)
    expect(sorted[0].name).toBe("Item-B");
    expect(sorted[1].name).toBe("Item-A");

    // 2. Verify original array was not mutated (still Fire, Ice)
    expect(mockItems[0].name).toBe("Item-A");
    expect(mockItems[1].name).toBe("Item-B");

    // 3. Deep equality check on the objects inside mockItems vs originalCopy
    // This catches if we accidentally modify the properties of the objects themselves.
    expect(mockItems).toEqual(originalCopy);
});
