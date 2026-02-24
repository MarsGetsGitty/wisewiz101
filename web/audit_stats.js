const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'public/data/gear_database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const prefixGroups = new Map();

data.filter(i => i.name.includes('-')).forEach(i => {
    const match = i.name.match(/^([^-]+)-/);
    if (!match) return;
    const p = match[1];

    if (!prefixGroups.has(p)) {
        prefixGroups.set(p, { count: 0, hasStatsInfo: 0, disp: 0, samples: [] });
    }

    const g = prefixGroups.get(p);
    g.count++;

    const hasStats = Object.keys(i.stats).length > 0;
    if (hasStats) g.hasStatsInfo++;
    if (i.display_name) g.disp++;

    if (hasStats && g.samples.length < 5) g.samples.push(i.name);
});

console.log('--- Dev/Anomaly Prefixes with Stats ---');
const suspects = Array.from(prefixGroups.entries())
    .filter(([p, g]) => ['Test', 'Blank', 'QA', 'Tourney01', 'PvP', 'Admin', 'DM', 'Crowns', 'Promo', 'Vendor'].map(x => x.toLowerCase()).includes(p.toLowerCase()))
    .sort((a, b) => b[1].count - a[1].count);

suspects.forEach(([p, g]) => {
    if (g.hasStatsInfo > 0) {
        console.log(`[${p}-] Total: ${g.count} | Have Stats: ${g.hasStatsInfo} | Have DisplayName: ${g.disp}`);
        console.log(`   Samples with Stats: ${g.samples.join(', ')}\n`);
    }
});
