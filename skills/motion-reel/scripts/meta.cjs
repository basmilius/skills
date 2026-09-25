const fs = require('node:fs');
const vm = require('node:vm');
const PRINCIPLES = ['Squash and stretch', 'Anticipation', 'Staging', 'Straight ahead and pose to pose', 'Follow through and overlapping action', 'Slow in and slow out', 'Arcs', 'Secondary action', 'Timing', 'Exaggeration', 'Solid drawing', 'Appeal'];
const coverage = Object.fromEntries(PRINCIPLES.map((name) => [name, 0]));
const ids = new Set();
let failures = 0;
const fail = (file, message) => {
    console.error(file + ': ' + message);
    failures++;
};
const files = fs.readdirSync('pieces').filter((name) => name.endsWith('.js') && !name.startsWith('_'));
if (!files.length) fail('pieces', 'no takes found');
for (const file of files) {
    const definitions = [];
    try {
        vm.runInNewContext(fs.readFileSync('pieces/' + file, 'utf8'), {
            Reel: { add: (definition) => definitions.push(definition), R: {} }, window: {}, console
        }, { filename: file, timeout: 1000 });
    } catch (error) {
        fail(file, error.message);
        continue;
    }
    if (definitions.length !== 1) fail(file, 'expected one Reel.add call');
    for (const definition of definitions) {
        for (const key of ['id', 'title', 'line', 'tech', 'hint']) {
            if (typeof definition[key] !== 'string' || !definition[key].trim()) fail(file, 'missing ' + key);
        }
        if (definition.id !== file.slice(0, -3)) fail(file, 'id must match filename');
        if (ids.has(definition.id)) fail(file, 'duplicate id ' + definition.id);
        ids.add(definition.id);
        if (typeof definition.create !== 'function') fail(file, 'missing create function');
        if (!Number.isFinite(definition.poster) || definition.poster < 0) fail(file, 'invalid poster time');
        if (!Array.isArray(definition.principles) || ![2, 3].includes(definition.principles.length)) {
            fail(file, 'expected two or three principles');
            continue;
        }
        if (new Set(definition.principles).size !== definition.principles.length) fail(file, 'duplicate principle');
        for (const principle of definition.principles) {
            if (!PRINCIPLES.includes(principle)) fail(file, 'unknown principle ' + principle);
            else coverage[principle]++;
        }
        console.log(definition.id, '|', definition.title, '|', definition.principles.join(', '));
    }
}
const missing = PRINCIPLES.filter((name) => !coverage[name]);
console.log('Principles covered:', PRINCIPLES.length - missing.length, '/', PRINCIPLES.length);
if (missing.length) {
    console.log('Not covered:', missing.join(', '));
    if (process.argv.includes('--full')) fail('reel', 'full coverage required');
}
if (failures) process.exitCode = 1;
