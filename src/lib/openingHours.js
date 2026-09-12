// Vereinfachter, aber wochentags- und mehrfenster-fähiger OSM opening_hours-Parser.
// Deckt keine Feiertage (PH) oder Monats-/Saisonangaben ab - in solchen Fällen wird
// im Zweifel "geöffnet" angenommen, statt fälschlich als geschlossen zu markieren.
//
// UMD-lite: läuft unverändert per <script> im Browser (hängt sich an window.LoocatorLib)
// und per require() unter Node (für die Tests in test/).
(function (global) {
    const OH_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; // Date.getDay(): 0 = Sonntag

    function expandOhDayToken(token) {
        const days = new Set();
        token.split(',').forEach(part => {
            const rangeMatch = part.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)-(Mo|Tu|We|Th|Fr|Sa|Su)$/);
            if (rangeMatch) {
                let i = OH_WEEKDAYS.indexOf(rangeMatch[1]);
                const end = OH_WEEKDAYS.indexOf(rangeMatch[2]);
                if (i === -1 || end === -1) return;
                while (true) {
                    days.add(i);
                    if (i === end) break;
                    i = (i + 1) % 7;
                }
            } else {
                const idx = OH_WEEKDAYS.indexOf(part);
                if (idx !== -1) days.add(idx);
            }
        });
        return days;
    }

    function parseOhTimeRanges(str) {
        const ranges = [];
        str.split(',').forEach(part => {
            const m = part.trim().match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
            if (m) {
                ranges.push([
                    parseInt(m[1]) * 60 + parseInt(m[2]),
                    parseInt(m[3]) * 60 + parseInt(m[4])
                ]);
            }
        });
        return ranges;
    }

    function isLikelyClosedNow(openingHoursStr, now) {
        if (!openingHoursStr) return false;
        const trimmed = openingHoursStr.trim();
        if (trimmed === '24/7') return false;

        now = now || new Date();
        const currentDay = now.getDay();
        const prevDay = (currentDay + 6) % 7;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const rules = trimmed.split(';').map(r => r.trim()).filter(Boolean);
        if (rules.length === 0) return false;

        let todayRule = null;
        let anyRuleCoversToday = false;
        let hadEvaluableRule = false;

        for (const rule of rules) {
            if (/^PH\b/i.test(rule)) continue; // Feiertage können wir nicht berechnen
            hadEvaluableRule = true;

            const dayMatch = rule.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)*)\s+(.*)$/);
            const dayToken = dayMatch ? dayMatch[1] : null;
            const rest = dayMatch ? dayMatch[2] : rule;
            const days = dayToken ? expandOhDayToken(dayToken) : new Set([0, 1, 2, 3, 4, 5, 6]);
            const isOff = /\boff\b|\bclosed\b/i.test(rest);

            if (days.has(currentDay)) {
                anyRuleCoversToday = true;
                todayRule = isOff ? { closed: true } : { closed: false, ranges: parseOhTimeRanges(rest) };
            }

            // Zeitfenster vom Vortag, das über Mitternacht bis in heute hineinreicht
            if (days.has(prevDay) && !isOff) {
                for (const [start, end] of parseOhTimeRanges(rest)) {
                    if (end < start && currentMinutes <= end) return false;
                }
            }
        }

        if (!hadEvaluableRule) return false; // Nur PH-Regeln (o.ä.) - Feiertage können wir nicht berechnen, im Zweifel offen
        if (!anyRuleCoversToday) return true; // Kein Regelsatz gilt heute -> vermutlich geschlossen
        if (todayRule.closed) return true;
        if (!todayRule.ranges || todayRule.ranges.length === 0) return false; // Format nicht erkannt -> im Zweifel offen

        return !todayRule.ranges.some(([start, end]) =>
            end >= start ? (currentMinutes >= start && currentMinutes <= end)
                         : (currentMinutes >= start || currentMinutes <= end) // über Mitternacht
        );
    }

    const api = { isLikelyClosedNow, expandOhDayToken, parseOhTimeRanges };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.LoocatorLib = global.LoocatorLib || {};
        global.LoocatorLib.openingHours = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
