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
