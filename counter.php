<?php
require_once __DIR__ . '/db.php';

header('Access-Control-Allow-Origin: *');

// Der Pfad zur Zähler-Datei
$file = __DIR__ . '/visits.txt';

// 1. Wenn die App einfach nur den Zähler +1 setzen will (beim Laden)
if (isset($_GET['hit'])) {
    header('Content-Type: application/json');

    // Max. 30 Hits pro IP und 10 Minuten - verhindert künstliches Hochtreiben der Statistik
    if (!loocator_rate_limit('counter_hit', 30, 10 * 60)) {
        http_response_code(429);
        echo json_encode(['status' => 'rate_limited']);
        exit;
    }

    // Datei-Lock verhindert verlorene Zählungen bei gleichzeitigen Requests
    $fp = fopen($file, 'c+');
    flock($fp, LOCK_EX);
    $count = (int)fread($fp, 1024);
    $count++;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, (string)$count);
    flock($fp, LOCK_UN);
    fclose($fp);

    echo json_encode(['status' => 'ok']);
    exit;
}

// 2. Wenn DU dir die Zahlen ansehen willst (show=1)
if (isset($_GET['show'])) {
    $count = file_exists($file) ? (int)file_get_contents($file) : 0;

    // Tages-Differenz berechnen (Startdatum: 27.06.2026)
    $startDate = new DateTime('2026-06-27');
    $now = new DateTime();
    $days = $now->diff($startDate)->days;
    $daysNum = max(1, $days);

    $topClean = [];
    $topUsable = [];
    $error = "";

    try {
        $db = loocator_db();

        // Rechnet die einzelnen Votes zusammen für die Top-Sauberkeit
        $queryClean = "SELECT osm_id,
                              SUM(cleanliness_vote) as cleanliness_sum,
                              SUM(CASE WHEN cleanliness_vote IS NOT NULL THEN 1 ELSE 0 END) as cleanliness_count,
                              CAST(SUM(cleanliness_vote) AS FLOAT) / SUM(CASE WHEN cleanliness_vote IS NOT NULL THEN 1 ELSE 0 END) as avg_clean
                       FROM votes
                       GROUP BY osm_id
                       HAVING cleanliness_count >= 2
                       ORDER BY avg_clean DESC, cleanliness_count DESC
                       LIMIT 5";
        $topClean = $db->query($queryClean)->fetchAll(PDO::FETCH_ASSOC);

        // Rechnet die einzelnen Votes zusammen für die Top-Zuverlässigkeit
        $queryUsable = "SELECT osm_id,
                               SUM(CASE WHEN usable_vote = 'yes' THEN 1 ELSE 0 END) as usable_yes,
                               SUM(CASE WHEN usable_vote = 'no' THEN 1 ELSE 0 END) as usable_no,
                               CAST(SUM(CASE WHEN usable_vote = 'yes' THEN 1 ELSE 0 END) AS FLOAT) /
                               (SUM(CASE WHEN usable_vote = 'yes' THEN 1 ELSE 0 END) + SUM(CASE WHEN usable_vote = 'no' THEN 1 ELSE 0 END)) as success_rate,
                               (SUM(CASE WHEN usable_vote = 'yes' THEN 1 ELSE 0 END) + SUM(CASE WHEN usable_vote = 'no' THEN 1 ELSE 0 END)) as total_votes
                        FROM votes
                        GROUP BY osm_id
                        HAVING total_votes >= 3
                        ORDER BY success_rate DESC, total_votes DESC
                        LIMIT 5";
        $topUsable = $db->query($queryUsable)->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $error = "Datenbankfehler: " . $e->getMessage();
    }
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loocator Statistik</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-4 md:p-10 font-sans text-gray-800">
    <div class="max-w-2xl mx-auto space-y-6">

        <div class="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
            <h1 class="text-xl font-bold text-gray-400 mb-2 uppercase tracking-widest">Loocator Aufrufe</h1>
            <div class="text-7xl font-black text-blue-600 tracking-tighter mb-4">
                <?= number_format($count, 0, ',', '.') ?>
            </div>
            <p class="text-sm font-medium text-gray-500 bg-gray-50 inline-block px-4 py-2 rounded-xl">
                In <?= $daysNum ?> Tagen (Ø <?= number_format($count / $daysNum, 0, ',', '.') ?> / Tag)
            </p>
        </div>

        <?php if ($error): ?>
            <div class="bg-red-100 text-red-700 p-4 rounded-xl font-bold">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <div class="grid md:grid-cols-2 gap-6">
            <!-- Sauberste WCs -->
            <div class="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
                <h2 class="text-lg font-black text-indigo-700 mb-4 flex items-center gap-2">
                    <span class="text-2xl">✨</span> Top 5 Sauberkeit
                </h2>
                <p class="text-xs text-gray-400 mb-4">(Ab 2 Bewertungen)</p>
                <div class="space-y-3">
                    <?php
                    if (empty($topClean)) {
                        echo "<p class='text-sm text-gray-500 italic'>Noch nicht genug Bewertungen.</p>";
                    } else {
                        foreach ($topClean as $i => $row) {
                            $avg = number_format($row['avg_clean'], 1, ',', '.');
                            $osmNode = "https://www.openstreetmap.org/node/" . urlencode($row['osm_id']);
                            $rank = $i + 1;
                            $osmId = htmlspecialchars($row['osm_id']);
                            $cleanCount = htmlspecialchars($row['cleanliness_count']);
                            echo "
                            <a href='{$osmNode}' target='_blank' rel='noopener' class='flex justify-between items-center bg-gray-50 hover:bg-indigo-50 p-3 rounded-xl transition-colors'>
                                <span class='font-bold text-gray-700'>#{$rank}</span>
                                <span class='text-sm text-gray-500'>ID: {$osmId}</span>
                                <div class='text-right'>
                                    <span class='font-black text-indigo-600'>{$avg} ⭐</span>
                                    <span class='text-[10px] block text-gray-400'>{$cleanCount} Votes</span>
                                </div>
                            </a>";
                        }
                    }
                    ?>
                </div>
            </div>

            <!-- Zuverlässigste WCs -->
            <div class="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
                <h2 class="text-lg font-black text-green-700 mb-4 flex items-center gap-2">
                    <span class="text-2xl">✅</span> Top 5 Zuverlässig
                </h2>
                <p class="text-xs text-gray-400 mb-4">(Ab 3 Bewertungen)</p>
                <div class="space-y-3">
                    <?php
                    if (empty($topUsable)) {
                        echo "<p class='text-sm text-gray-500 italic'>Noch nicht genug Bewertungen.</p>";
                    } else {
                        foreach ($topUsable as $i => $row) {
                            $percent = round($row['success_rate'] * 100);
                            $osmNode = "https://www.openstreetmap.org/node/" . urlencode($row['osm_id']);
                            $rank = $i + 1;
                            $osmId = htmlspecialchars($row['osm_id']);
                            $totalVotes = htmlspecialchars($row['total_votes']);
                            echo "
                            <a href='{$osmNode}' target='_blank' rel='noopener' class='flex justify-between items-center bg-gray-50 hover:bg-green-50 p-3 rounded-xl transition-colors'>
                                <span class='font-bold text-gray-700'>#{$rank}</span>
                                <span class='text-sm text-gray-500'>ID: {$osmId}</span>
                                <div class='text-right'>
                                    <span class='font-black text-green-600'>{$percent}% 👍</span>
                                    <span class='text-[10px] block text-gray-400'>{$totalVotes} Votes</span>
                                </div>
                            </a>";
                        }
                    }
                    ?>
                </div>
            </div>
        </div>

    </div>
</body>
</html>
<?php
    exit;
}
