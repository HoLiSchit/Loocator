const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    isPublicAccess,
    isEurokeyOrWheelchair,
    hasChangingTable,
    isFreeToilet,
    classifyRating,
    getPriorityKey
} = require('../src/lib/toiletRules');

test('access=private/customers gilt nicht als öffentlich', () => {
    assert.equal(isPublicAccess({}), true);
    assert.equal(isPublicAccess({ access: 'private' }), false);
    assert.equal(isPublicAccess({ access: 'customers' }), false);
    assert.equal(isPublicAccess({ access: 'yes' }), true);
});

test('Eurokey/Rollstuhl über verschiedene Tag-Varianten erkannt', () => {
    assert.equal(isEurokeyOrWheelchair({ eurokey: 'yes' }), true);
    assert.equal(isEurokeyOrWheelchair({ wheelchair: 'designated' }), true);
    assert.equal(isEurokeyOrWheelchair({ 'toilets:wheelchair': 'yes' }), true);
    assert.equal(isEurokeyOrWheelchair({}), false);
});

test('Wickeltisch über changing_table oder diaper', () => {
    assert.equal(hasChangingTable({ changing_table: 'yes' }), true);
    assert.equal(hasChangingTable({ diaper: 'yes' }), true);
    assert.equal(hasChangingTable({}), false);
});

test('fehlendes fee-Tag zählt als kostenlos (bewusste Produktentscheidung)', () => {
    assert.equal(isFreeToilet({}), true);
});

test('explizit gesetzter kostenloser Wert zählt als kostenlos', () => {
    assert.equal(isFreeToilet({ fee: 'no' }), true);
    assert.equal(isFreeToilet({ 'toilets:fee': 'false' }), true);
    assert.equal(isFreeToilet({ charge: 'none' }), true);
});

test('explizit gesetzter kostenpflichtiger Wert zählt nicht als kostenlos', () => {
    assert.equal(isFreeToilet({ fee: 'yes' }), false);
    assert.equal(isFreeToilet({ fee: '0.50 EUR' }), false);
});

test('classifyRating: keine Bewertung -> neutral', () => {
    assert.deepEqual(classifyRating(null), { isDefect: false, isTopRated: false, isBad: false });
});

test('classifyRating: schlechte Erfolgsquote markiert defekt', () => {
    const r = classifyRating({ usable_yes: 1, usable_no: 9 });
    assert.equal(r.isDefect, true);
});

test('classifyRating: hohe Erfolgsquote ab 2 Votes markiert top bewertet', () => {
    const r = classifyRating({ usable_yes: 9, usable_no: 1 });
    assert.equal(r.isTopRated, true);
});

test('classifyRating: schlechte Sauberkeit ab 2 Votes markiert "bad"', () => {
    const r = classifyRating({ cleanliness_sum: 3, cleanliness_count: 2 });
    assert.equal(r.isBad, true);
});

test('getPriorityKey: Rangfolge Favorit > Eurokey > Wickeltisch > kostenlos > öffentlich', () => {
    const eurokeyTags = { eurokey: 'yes', changing_table: 'yes' };
    assert.equal(getPriorityKey(eurokeyTags, true), 'favorite');
    assert.equal(getPriorityKey(eurokeyTags, false), 'eurokey');
    assert.equal(getPriorityKey({ changing_table: 'yes' }, false), 'changing');
    assert.equal(getPriorityKey({}, false), 'free'); // kein fee-Tag -> kostenlos
    assert.equal(getPriorityKey({ fee: 'yes' }, false), 'public');
});
