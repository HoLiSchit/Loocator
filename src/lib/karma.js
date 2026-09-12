// Karma-Rang-Berechnung, ausgelagert damit sie ohne DOM getestet werden kann.
(function (global) {
    // badge: ein durchgängiges Icon-System statt 10 stilistisch beliebiger Emoji
    // (die vorher wild unterschiedliches Gewicht hatten, z.B. 🧻 vs. 🏰 vs. 🔱).
    // Alle Ränge zeigen dasselbe gezeichnete Icon (Klopapierrolle) in einem
    // farblich eskalierenden Badge (teal -> pink -> gold), mit 0-3 Sternen als
    // Fortschrittsanzeige und einer Krone nur beim Maximalrang.
    const karmaRanks = [
        { min: 0,    key: "rank0", badge: { color: '#99f6e4', stars: 0, crown: false } },
        { min: 1,    key: "rank1", badge: { color: '#5eead4', stars: 1, crown: false } },
        { min: 5,    key: "rank2", badge: { color: '#2dd4bf', stars: 1, crown: false } },
        { min: 15,   key: "rank3", badge: { color: '#14b8a6', stars: 2, crown: false } },
        { min: 35,   key: "rank4", badge: { color: '#0f766e', stars: 2, crown: false } },
        { min: 75,   key: "rank5", badge: { color: '#ef5a92', stars: 2, crown: false } },
        { min: 150,  key: "rank6", badge: { color: '#e5316b', stars: 3, crown: false } },
        { min: 300,  key: "rank7", badge: { color: '#c22458', stars: 3, crown: false } },
        { min: 600,  key: "rank8", badge: { color: '#9c1c47', stars: 3, crown: false } },
        { min: 1000, key: "rank9", badge: { color: '#f59e0b', stars: 3, crown: true } }
    ];

    function getRankIndex(points) {
        let index = 0;
        for (let i = 0; i < karmaRanks.length; i++) {
            if (points >= karmaRanks[i].min) index = i;
        }
        return index;
    }

    const api = { karmaRanks, getRankIndex };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.LoocatorLib = global.LoocatorLib || {};
        global.LoocatorLib.karma = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
