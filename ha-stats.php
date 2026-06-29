<?php
// ha-stats.php
header('Content-Type: application/json');

$dbFile = 'toilets.sqlite'; // Pfad zu deiner SQLite Datenbank
if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'DB nicht gefunden']);
    exit;
}

$db = new PDO('sqlite:' . $dbFile);
$stmt = $db->query("SELECT SUM(usable_yes) as yes, SUM(usable_no) as no, SUM(cleanliness_count) as clean_votes FROM ratings");
$row = $stmt->fetch(PDO::FETCH_ASSOC);

// Zahlen aufbereiten
$yes = intval($row['yes'] ?? 0);
$no = intval($row['no'] ?? 0);
$clean_votes = intval($row['clean_votes'] ?? 0);
$total = $yes + $no + $clean_votes;

// Als JSON an Home Assistant schicken
echo json_encode([
    'total_votes' => $total,
    'usable_yes' => $yes,
    'usable_no' => $no
]);
?>