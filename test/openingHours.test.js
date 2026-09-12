const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isLikelyClosedNow } = require('../src/lib/openingHours');

// 2026-09-14 ist ein Montag - alle Testdaten bauen auf dieser Woche auf.
const DAY_DATE = { Mo: 14, Tu: 15, We: 16, Th: 17, Fr: 18, Sa: 19, Su: 20 };
function at(dayName, h, m) {
    return new Date(2026, 8, DAY_DATE[dayName], h, m);
}

test('24/7 ist nie geschlossen', () => {
    assert.equal(isLikelyClosedNow('24/7', at('Mo', 3, 0)), false);
});

test('leerer/undefinierter Wert gilt als offen', () => {
    assert.equal(isLikelyClosedNow(undefined, at('Mo', 3, 0)), false);
    assert.equal(isLikelyClosedNow('', at('Mo', 3, 0)), false);
});

test('einfaches Zeitfenster innerhalb/außerhalb', () => {
    assert.equal(isLikelyClosedNow('Mo-Fr 08:00-18:00', at('Mo', 10, 0)), false);
    assert.equal(isLikelyClosedNow('Mo-Fr 08:00-18:00', at('Mo', 19, 0)), true);
});

test('Wochentags-Bereich schließt Wochenende korrekt aus', () => {
    assert.equal(isLikelyClosedNow('Mo-Fr 08:00-18:00', at('Sa', 10, 0)), true);
});

test('mehrere Zeitfenster pro Tag (Mittagspause)', () => {
    assert.equal(isLikelyClosedNow('Mo-Fr 08:00-12:00,13:00-18:00', at('Mo', 12, 30)), true);
    assert.equal(isLikelyClosedNow('Mo-Fr 08:00-12:00,13:00-18:00', at('Mo', 9, 0)), false);
});

test('mehrere Regeln getrennt durch ";", inkl. "off"', () => {
    assert.equal(isLikelyClosedNow('Mo-Sa 08:00-20:00; Su off', at('Su', 10, 0)), true);
    assert.equal(isLikelyClosedNow('Mo-Sa 08:00-20:00; Su off', at('Sa', 10, 0)), false);
});

test('über Mitternacht reichende Öffnungszeiten', () => {
    assert.equal(isLikelyClosedNow('22:00-02:00', at('Mo', 23, 30)), false);
    assert.equal(isLikelyClosedNow('22:00-02:00', at('Tu', 1, 30)), false);
    assert.equal(isLikelyClosedNow('22:00-02:00', at('Tu', 5, 0)), true);
});

test('Aufzählung einzelner Wochentage (Mo,We,Fr)', () => {
    assert.equal(isLikelyClosedNow('Mo,We,Fr 09:00-12:00', at('Tu', 10, 0)), true);
    assert.equal(isLikelyClosedNow('Mo,We,Fr 09:00-12:00', at('We', 10, 0)), false);
});

test('unbekannte/komplexe Syntax gilt im Zweifel als offen', () => {
    assert.equal(isLikelyClosedNow('Apr-Oct 08:00-18:00', at('Mo', 22, 0)), false);
    assert.equal(isLikelyClosedNow('PH off', at('Mo', 22, 0)), false);
});
