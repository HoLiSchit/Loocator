<?php
$dbFile = __DIR__ . '/loocator.sqlite';

if (!file_exists($dbFile)) {
    echo "DB nicht gefunden.\n";
    exit;
}

try {
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $db->prepare("DELETE FROM votes WHERE created_at < datetime('now', '-90 days')");
    $stmt->execute();

    $deleted = $stmt->rowCount();
    $db->exec("VACUUM"); // Platz freigeben, den SQLite intern verbraucht hat

    echo date('Y-m-d H:i:s') . " - $deleted alte Votes gelöscht.\n";
} catch (Exception $e) {
    echo "Fehler: " . $e->getMessage() . "\n";
}