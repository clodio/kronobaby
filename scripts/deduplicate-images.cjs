const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'image-assets.js');
const prefix = 'const IMAGE_ASSETS = ';
const apply = process.argv.includes('--apply');

function listFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? listFiles(filename) : [filename];
    });
}

function relative(filename) {
    return path.relative(root, filename).split(path.sep).join('/');
}

const files = listFiles(path.join(root, 'images')).sort((left, right) => {
    return left.split(path.sep).length - right.split(path.sep).length || left.localeCompare(right, 'en');
});
const assets = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8').trim().slice(prefix.length, -1))
    : {};
const groups = new Map();
const replacements = new Map();
const duplicates = [];
let savedBytes = 0;

for (const filename of files) {
    const content = fs.readFileSync(filename);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const candidates = groups.get(hash) || [];
    const canonical = candidates.find(candidate => content.equals(fs.readFileSync(candidate)));
    if (canonical) {
        replacements.set(relative(filename), relative(canonical));
        duplicates.push(filename);
        savedBytes += content.length;
    } else {
        candidates.push(filename);
        groups.set(hash, candidates);
        replacements.set(relative(filename), relative(filename));
    }
}

for (const [logical, target] of Object.entries(assets)) {
    assert.ok(fs.existsSync(path.join(root, target)), `Missing target: ${logical} -> ${target}`);
    assets[logical] = replacements.get(target) || target;
}
for (const [logical, target] of replacements) assets[logical] = target;

for (const [logical, target] of Object.entries(assets)) {
    assert.ok(fs.existsSync(path.join(root, target)), `Missing image: ${target}`);
    if (fs.existsSync(path.join(root, logical))) {
        assert.ok(fs.readFileSync(path.join(root, logical)).equals(fs.readFileSync(path.join(root, target))), `Different contents: ${logical}`);
    }
}

if (apply) {
    const sortedAssets = Object.fromEntries(Object.entries(assets).sort(([left], [right]) => left.localeCompare(right, 'en')));
    fs.writeFileSync(manifestPath, `${prefix}${JSON.stringify(sortedAssets, null, 2)};\n`);
    for (const filename of duplicates) fs.unlinkSync(filename);
}

console.log(JSON.stringify({ mode: apply ? 'apply' : 'check', files: files.length, aliases: Object.keys(assets).length, duplicates: duplicates.length, savedBytes }, null, 2));