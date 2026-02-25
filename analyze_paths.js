const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'web', 'public', 'data', 'gear_database.json');
const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const schoolMap = {};

items.forEach(item => {
    let p = item.source_path || '';
    if (p.includes('/')) p = p.split('/').pop();

    // find tags like BS, DS, FS, IS, LS, MS, SS
    const match = p.match(/-([BDFILMS]S)-/);
    if (match) {
        const tag = match[1];
        if (!schoolMap[tag]) schoolMap[tag] = new Set();
        schoolMap[tag].add(item.school || 'None');
    }
});

Object.entries(schoolMap).forEach(([tag, schools]) => {
    console.log(`${tag} -> ${Array.from(schools).join(', ')}`);
});
