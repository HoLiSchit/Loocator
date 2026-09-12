// Karma-Rang-Berechnung, ausgelagert damit sie ohne DOM getestet werden kann.
(function (global) {
    const karmaRanks = [
        { min: 0, key: "rank0", emoji: "🧻" },
        { min: 1, key: "rank1", emoji: "🚶‍♂️" },
        { min: 5, key: "rank2", emoji: "🔑" },
        { min: 15, key: "rank3", emoji: "🕵️‍♀️" },
        { min: 35, key: "rank4", emoji: "🚓" },
        { min: 75, key: "rank5", emoji: "👑" },
        { min: 150, key: "rank6", emoji: "🛡️" },
        { min: 300, key: "rank7", emoji: "🌟" },
        { min: 600, key: "rank8", emoji: "🏰" },
        { min: 1000, key: "rank9", emoji: "🔱" }
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
