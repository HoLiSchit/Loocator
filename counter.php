<?php
// counter.php - Besucherzähler & Loocator Statistiken
$file = 'visits.txt';
$dbFile = __DIR__ . '/loocator.sqlite';

// 1. Wenn die App geladen wird (hit=1) -> Zähler +1
if (isset($_GET['hit'])) {
    $count = file_exists($file) ? (int)file_get_contents($file) : 0;
    $count++;
    file_put_contents($file, $count);
    echo json_encode(['status' => 'ok']);
    exit;
}

// 2. Wenn DU dir die Zahlen ansehen willst (show=1)
if (isset($_GET['show'])) {
    $count = file_exists($file) ? (int)file_get_contents($file) : 0;
    
    // SQLite Datenbank öffnen für die Toplisten
    $topClean = [];
    $topUsable = [];
    
    if (file_exists($dbFile)) {
        try {
            $db = new PDO('sqlite:' . $dbFile);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Sauberste WCs (Mindestens 2 Stimmen)
            // Berechnung: cleanliness_sum / cleanliness_count
            $queryClean = "SELECT osm_id, cleanliness_sum, cleanliness_count, 
                           CAST(cleanliness_sum AS FLOAT) / cleanliness_count as avg_clean 
                           FROM ratings 
                           WHERE cleanliness_count >= 2 
                           ORDER BY avg_clean DESC, cleanliness_count DESC 
                           LIMIT 5";
            $stmt = $db->query($queryClean);
            $topClean = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Zuverlässigste WCs (Mindestens 3 Stimmen)
            // Berechnung: usable_yes / (usable_yes + usable_no)
            $queryUsable = "SELECT osm_id, usable_yes, usable_no, 
                            CAST(usable_yes AS FLOAT) / (usable_yes + usable_no) as success_rate,
                            (usable_yes + usable_no) as total_votes
                            FROM ratings 
                            WHERE (usable_yes + usable_no) >= 3 
                            ORDER BY success_rate DESC, total_votes DESC 
                            LIMIT 5";
            $stmt = $db->query($queryUsable);
            $topUsable = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            $error = "Datenbankfehler: " . $e->getMessage();
        }
    }

    // HTML Ausgabe
    echo "<!DOCTYPE html>
    <html lang='de'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Loocator Statistik</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; padding: 20px; line-height: 1.5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { text-align: center; color: #2563eb; font-size: 2.5em; margin-bottom: 5px; }
            .visits { text-align: center; font-size: 1.2em; color: #6b7280; margin-bottom: 40px; }
            .visits b { color: #1f2937; font-size: 1.5em; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
            h2 { font-size: 1.5em; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px; }
            h2.clean { color: #8b5cf6; border-color: #ddd6fe; }
            h2.usable { color: #10b981; border-color: #d1fae5; }
            .list-item { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e5e7eb; }
            .list-item:hover { background: #f3f4f6; }
            .osm-link { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 4px 10px; border-radius: 6px; font-size: 0.85em; font-weight: bold; margin-top: 8px; }
            .osm-link:hover { background: #1d4ed8; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 0.8em; font-weight: bold; margin-bottom: 5px; }
            .badge-clean { background: #ede9fe; color: #6d28d9; }
            .badge-usable { background: #d1fae5; color: #047857; }
            .empty { color: #9ca3af; font-style: italic; }
        </style>
    </head>
    <body>
        <div class='container'>
            <h1>🚽 Loocator Stats</h1>
            <div class='visits'>Die App wurde bisher <b>$count</b> mal aufgerufen.</div>";

    if (isset($error)) {
        echo "<p style='color: red;'>$error</p>";
    } else {
        echo "<div class='grid'>";
        
        // Spalte 1: Sauberkeit
        echo "<div><h2 class='clean'>✨ Top Sauberkeit</h2>";
        if (empty($topClean)) {
            echo "<p class='empty'>Noch nicht genug Bewertungen (Mind. 2 Stimmen benötigt).</p>";
        } else {
            foreach ($topClean as $i => $row) {
                $avg = number_format($row['avg_clean'], 1, ',', '.');
                $place = $i + 1;
                // Extrahiere Node/Way ID. (In OSM IDs speichern wir meist zB 'node/1234' oder 'way/1234')
                $osmUrl = "https://www.openstreetmap.org/" . $row['osm_id'];
                
                echo "<div class='list-item'>
                        <span class='badge badge-clean'>Platz $place</span><br>
                        <b>$avg Sterne</b> (aus {$row['cleanliness_count']} Stimmen)<br>
                        <a href='$osmUrl' target='_blank' class='osm-link'>Auf Karte ansehen 🗺️</a>
                      </div>";
            }
        }
        echo "</div>";

        // Spalte 2: Zuverlässigkeit
        echo "<div><h2 class='usable'>✅ Top Zuverlässigkeit</h2>";
        if (empty($topUsable)) {
            echo "<p class='empty'>Noch nicht genug Bewertungen (Mind. 3 Stimmen benötigt).</p>";
        } else {
            foreach ($topUsable as $i => $row) {
                $percent = round($row['success_rate'] * 100);
                $place = $i + 1;
                $osmUrl = "https://www.openstreetmap.org/" . $row['osm_id'];
                
                echo "<div class='list-item'>
                        <span class='badge badge-usable'>Platz $place</span><br>
                        <b>$percent% Erfolg</b> ({$row['usable_yes']}x Ja, {$row['usable_no']}x Nein)<br>
                        <a href='$osmUrl' target='_blank' class='osm-link'>Auf Karte ansehen 🗺️</a>
                      </div>";
            }
        }
        echo "</div>";
        
        echo "</div>"; // End Grid
    }

    echo "</div></body></html>";
    exit;
}
?>