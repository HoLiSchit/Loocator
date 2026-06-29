<?php
// ha-stats.php
header('Content-Type: application/json');

$dbFile = 'loocator.sqlite';
if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'DB nicht gefunden']);
    exit;
}

$db = new PDO('sqlite:' . $dbFile);
// Holt die zusammengezählten Werte aus deiner bestehenden Loocator-Tabelle
$stmt = $db->query("SELECT SUM(usable_yes) as yes, SUM(usable_no) as no, SUM(cleanliness_count) as clean_votes, SUM(cleanliness_sum) as clean_sum FROM ratings");
$row = $stmt->fetch(PDO::FETCH_ASSOC);

// Zahlen aufbereiten
$yes = intval($row['yes'] ?? 0);
$no = intval($row['no'] ?? 0);
$clean_votes = intval($row['clean_votes'] ?? 0);
$clean_sum = intval($row['clean_sum'] ?? 0);

$total = $yes + $no + $clean_votes;
// Rechnet den Durchschnitt der Sauberkeit aus (z.B. 4.2), fängt ab falls noch keiner bewertet hat
$avg_clean = $clean_votes > 0 ? round($clean_sum / $clean_votes, 2) : 0;

// Als JSON an Home Assistant schicken
echo json_encode([
    'total_votes' => $total,
    'usable_yes' => $yes,
    'usable_no' => $no,
    'avg_cleanliness' => $avg_clean
]);
?>