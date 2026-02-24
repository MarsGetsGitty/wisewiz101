const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'public/data/gear_database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const prefixesToInvestigate = [
    'Accuracy-Shoe-',
    'Crown-',
    'Block-Athame-',
    'IncOut-',
    'Resist-Hat-'
];

console.log('--- Deep Dive: Mysterious Prefixes ---\n');

prefixesToInvestigate.forEach(prefix => {
    const items = data.filter(i => i.name.startsWith(prefix));

    console.log(`[Prefix: ${prefix}] -> Found ${items.length} items`);
    if (items.length === 0) {
        console.log('');
        return;
    }

    let hasDisplayName = 0;
    let hasStats = 0;
    let totalStatsKeys = new Set();

    items.forEach(i => {
        if (i.display_name) hasDisplayName++;
        if (Object.keys(i.stats).length > 0) hasStats++;
        Object.keys(i.stats).forEach(k => totalStatsKeys.add(k));
    });

    console.log(`   Has display_name: ${hasDisplayName}/${items.length}`);
    console.log(`   Has Stats: ${hasStats}/${items.length} (Keys present: ${Array.from(totalStatsKeys).join(', ')})`);

    // Show 3 complete samples to inspect structure
    console.log('   Samples:');
    items.slice(0, 3).forEach(i => {
        console.log(`      * Name: ${i.name}`);
        console.log(`        Display: ${i.display_name}`);
        console.log(`        Stats: ${JSON.stringify(i.stats)}`);
        console.log(`        Level: ${i.level_req} | School: ${i.school} | Rarity: ${i.rarity}`);
    });
    console.log('');
});
