<?php
// ha-stats.php (Angepasst an die neue "Selbstheilungs"-Datenbank)
header('Content-Type: application/json');

$dbFile = 'loocator.sqlite';
if (!file_exists($dbFile)) {
    echo json_encode(['error' => 'DB nicht gefunden']);
    exit;
}

$db = new PDO('sqlite:' . $dbFile);

// Zählt die einzelnen Votes aus der neuen Tabelle zusammen (All-Time Statistik für dein Dashboard)
$stmt = $db->query("
    SELECT 
        SUM(CASE WHEN usable_vote = 'yes' THEN 1 ELSE 0 END) as yes,
        SUM(CASE WHEN usable_vote = 'no' THEN 1 ELSE 0 END) as no,
        SUM(CASE WHEN cleanliness_vote IS NOT NULL THEN 1 ELSE 0 END) as clean_votes,
        SUM(cleanliness_vote) as clean_sum 
    FROM votes
");

$row = $stmt->fetch(PDO::FETCH_ASSOC);

$yes = intval($row['yes'] ?? 0);
$no = intval($row['no'] ?? 0);
$clean_votes = intval($row['clean_votes'] ?? 0);
$clean_sum = intval($row['clean_sum'] ?? 0);

$total = $yes + $no + $clean_votes;
$avg_clean = $clean_votes > 0 ? round($clean_sum / $clean_votes, 2) : 0;

echo json_encode([
    'total_votes' => $total,
    'usable_yes' => $yes,
    'usable_no' => $no,
    'avg_cleanliness' => $avg_clean
]);
?>