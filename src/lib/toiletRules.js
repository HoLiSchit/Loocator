// Reine Klassifizierungs-Logik für einen OSM-Toilet-Eintrag (Tags) bzw. dessen
// Community-Bewertung. Ausgelagert, damit Filter- und Marker-Rendering exakt
// dieselbe Definition von "kostenlos", "Eurokey" etc. verwenden - vorher gab es
// hier zwei leicht unterschiedliche Implementierungen (Filter vs. Marker-Farbe).
(function (global) {
    const FREE_FEE_VALUES = ['no', '0', 'false', 'none'];

    function isPublicAccess(tags) {
        const access = tags.access || tags['toilets:access'] || 'yes';
        return access !== 'private' && access !== 'customers';
    }

    function isExplicitEurokey(tags) {
        return tags['central_key'] === 'eurokey'
            || tags['eurokey'] === 'yes'
            || tags.access === 'central_key'
            || tags['toilets:eurokey'] === 'yes'
            || tags['toilets:central_key'] === 'eurokey';
    }

    function isWheelchairAccessible(tags) {
        return tags.wheelchair === 'yes'
            || tags.wheelchair === 'designated'
            || tags['toilets:wheelchair'] === 'yes'
            || tags['toilets:wheelchair'] === 'designated';
    }

    function isEurokeyOrWheelchair(tags) {
        return isExplicitEurokey(tags) || isWheelchairAccessible(tags);
    }

    function hasChangingTable(tags) {
        return tags['changing_table'] === 'yes' || tags.diaper === 'yes';
    }

    // Kein fee-Tag = wird als kostenlos behandelt (viele OSM-WCs ohne Angabe sind
    // tatsächlich kostenlos) - nur ein explizit gesetzter, nicht-freier Wert zählt
    // als kostenpflichtig. Filter und Marker-Farbe nutzen bewusst dieselbe Regel.
    function isFreeToilet(tags) {
        const fee = tags.fee || tags['toilets:fee'] || tags.charge;
        if (!fee) return true;
        return FREE_FEE_VALUES.includes(String(fee).toLowerCase());
    }

    function isOpen247(tags) {
        return tags.opening_hours === '24/7';
    }

    // Klassifiziert eine WC anhand ihrer aggregierten Community-Bewertung (aus
    // backend.php: usable_yes/usable_no/cleanliness_sum/cleanliness_count).
    function classifyRating(rating) {
        let isDefect = false;
        let isTopRated = false;
        let isBad = false;
        if (!rating) return { isDefect, isTopRated, isBad };

        const usableYes = parseInt(rating.usable_yes) || 0;
        const usableNo = parseInt(rating.usable_no) || 0;
        const total = usableYes + usableNo;
        if (total > 0) {
            const successRate = usableYes / total;
            if (successRate < 0.4) isDefect = true;
            if (total >= 2 && successRate >= 0.85) isTopRated = true;
            if (total >= 2 && successRate < 0.5) isBad = true;
        }

        const cleanCount = parseInt(rating.cleanliness_count) || 0;
        const cleanSum = parseInt(rating.cleanliness_sum) || 0;
        if (cleanCount >= 2) {
            const avgClean = cleanSum / cleanCount;
            if (avgClean <= 2.0) isBad = true;
        }

        return { isDefect, isTopRated, isBad };
    }

    // Bestimmt die Haupt-Priorität (= Pin-Farbe) einer WC nach fester Rangfolge:
    // Favorit > Eurokey/Rollstuhl > Wickeltisch > kostenlos > öffentlich (Default).
    function getPriorityKey(tags, isFavorite) {
        if (isFavorite) return 'favorite';
        if (isEurokeyOrWheelchair(tags)) return 'eurokey';
        if (hasChangingTable(tags)) return 'changing';
        if (isFreeToilet(tags)) return 'free';
        return 'public';
    }

    const api = {
        isPublicAccess,
        isExplicitEurokey,
        isWheelchairAccessible,
        isEurokeyOrWheelchair,
        hasChangingTable,
        isFreeToilet,
        isOpen247,
        classifyRating,
        getPriorityKey
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.LoocatorLib = global.LoocatorLib || {};
        global.LoocatorLib.toiletRules = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
