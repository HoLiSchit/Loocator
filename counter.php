<?php
// Einfacher Besucherzähler für Loocator
$file = 'visits.txt';

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
    echo "<div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>";
    echo "<h1>🚽 Loocator Statistik</h1>";
    echo "<p style='font-size: 24px;'>Die App wurde bisher <b>$count</b> mal aufgerufen.</p>";
    echo "</div>";
    exit;
}
?>