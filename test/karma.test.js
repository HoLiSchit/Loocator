const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getRankIndex, karmaRanks } = require('../src/lib/karma');

test('0 Punkte -> Rang 0', () => {
    assert.equal(getRankIndex(0), 0);
});

test('genau auf einer Rang-Schwelle liegt im neuen Rang', () => {
    assert.equal(getRankIndex(5), karmaRanks.findIndex(r => r.key === 'rank2'));
});

test('knapp unter einer Schwelle bleibt im alten Rang', () => {
    assert.equal(getRankIndex(4), karmaRanks.findIndex(r => r.key === 'rank1'));
});

test('Rang-Indizes sind monoton steigend mit den Punkten', () => {
    let lastIndex = -1;
    for (let points = 0; points <= 1200; points += 25) {
        const idx = getRankIndex(points);
        assert.ok(idx >= lastIndex, `Rang fiel bei ${points} Punkten von ${lastIndex} auf ${idx}`);
        lastIndex = idx;
    }
});

test('sehr hohe Punktzahl erreicht den Maximal-Rang', () => {
    assert.equal(getRankIndex(999999), karmaRanks.length - 1);
});

test('jeder Rang hat ein gültiges Badge (Farbe, Sterne 0-3)', () => {
    for (const rank of karmaRanks) {
        assert.match(rank.badge.color, /^#[0-9a-f]{6}$/i);
        assert.ok(rank.badge.stars >= 0 && rank.badge.stars <= 3);
        assert.equal(typeof rank.badge.crown, 'boolean');
    }
});

test('nur der Maximalrang trägt die Krone', () => {
    const crowned = karmaRanks.filter(r => r.badge.crown);
    assert.equal(crowned.length, 1);
    assert.equal(crowned[0].key, karmaRanks[karmaRanks.length - 1].key);
});
