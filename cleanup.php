<?php
// cleanup.php - Cronjob: löscht Votes älter als 90 Tage und alte Rate-Limit-Einträge
require_once __DIR__ . '/db.php';

try {
    $db = loocator_db();

    $stmt = $db->prepare("DELETE FROM votes WHERE created_at < datetime('now', '-90 days')");
    $stmt->execute();
    $deletedVotes = $stmt->rowCount();

    $stmt = $db->prepare("DELETE FROM rate_limits WHERE created_at < datetime('now', '-1 day')");
    $stmt->execute();
    $deletedRateLimits = $stmt->rowCount();

    $db->exec("VACUUM"); // Platz freigeben, den SQLite intern verbraucht hat

    echo date('Y-m-d H:i:s') . " - $deletedVotes alte Votes, $deletedRateLimits alte Rate-Limit-Einträge gelöscht.\n";
} catch (Exception $e) {
    echo "Fehler: " . $e->getMessage() . "\n";
}
