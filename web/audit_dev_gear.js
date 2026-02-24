const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'public/data/gear_database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const hyphenItems = data.filter(i => i.name.includes('-'));
const prefixGroups = new Map();

hyphenItems.forEach(i => {
    // Extract everything before the first hyphen
    const match = i.name.match(/^([^-]+)-/);
    const prefix = match ? match[1] : 'UNKNOWN_HYPHEN_PATTERN';

    if (!prefixGroups.has(prefix)) {
        prefixGroups.set(prefix, {
            count: 0,
            missingDisplayNameCount: 0,
            zeroStatCount: 0,
            samples: []
        });
    }

    const group = prefixGroups.get(prefix);
    group.count++;
    if (!i.display_name) group.missingDisplayNameCount++;
    if (Object.keys(i.stats).length === 0) group.zeroStatCount++;

    // Collect up to 5 unique samples
    if (group.samples.length < 5 && !group.samples.includes(i.name)) {
        group.samples.push(i.name);
    }
});

// Sort groups by total count descending
const sortedGroups = Array.from(prefixGroups.entries())
    .sort((a, b) => b[1].count - a[1].count);

console.log('=========================================');
console.log(' DEVELOPER GEAR AUDIT: HYPHEN PREFIXES   ');
console.log('=========================================');
console.log(`Total Items Scanned: ${data.length}`);
console.log(`Items with Hyphen: ${hyphenItems.length}`);
console.log(`Unique Prefixes: ${sortedGroups.length}\n`);

sortedGroups.forEach(([prefix, stats]) => {
    // Filter out edge cases or very small sets to keep the report readable,
    // but ALWAYS show it if they are missing display names (strong developer flag)
    if (stats.count >= 20 || stats.missingDisplayNameCount > 0 || stats.zeroStatCount > 0) {
        console.log(`[Prefix: ${prefix}- ] -> ${stats.count} items`);
        console.log(`   Missing Display Name: ${stats.missingDisplayNameCount} | Zero Stats: ${stats.zeroStatCount}`);
        console.log(`   Samples: ${stats.samples.join(', ')}`);
        console.log('');
    }
});
