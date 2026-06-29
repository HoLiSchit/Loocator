<?php
// backend.php - NEU: Mit Datum & Selbstheilung (90 Tage)
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$dbFile = 'loocator.sqlite';

try {
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Wir bauen eine neue, smarte Tabelle, die jeden Vote einzeln mit Datum speichert
    $db->exec("CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        osm_id TEXT,
        usable_vote TEXT, 
        cleanliness_vote INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    $method = $_SERVER['REQUEST_METHOD'];

    // --- GET: App fragt Daten ab ---
    if ($method === 'GET') {
        // MAGIE: Wir holen nur Stimmen aus der Datenbank, die jünger als 90 Tage sind! (Selbstheilung)
        $stmt = $db->query("SELECT osm_id, usable_vote, cleanliness_vote FROM votes WHERE created_at >= datetime('now', '-90 days')");
        $allVotes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Rechnet die Einzel-Votes in fertige Summen um, wie die App es erwartet
        $result = [];
        foreach ($allVotes as $vote) {
            $id = $vote['osm_id'];
            if (!isset($result[$id])) {
                $result[$id] = [
                    'usable_yes' => 0,
                    'usable_no' => 0,
                    'cleanliness_sum' => 0,
                    'cleanliness_count' => 0
                ];
            }

            if ($vote['usable_vote'] === 'yes') $result[$id]['usable_yes'] += 1;
            if ($vote['usable_vote'] === 'no') $result[$id]['usable_no'] += 1;
            
            if ($vote['cleanliness_vote'] !== null) {
                $result[$id]['cleanliness_sum'] += (int)$vote['cleanliness_vote'];
                $result[$id]['cleanliness_count'] += 1;
            }
        }

        // Wenn '?all=1' angefragt wird, senden wir ALLES zurück (für die Karte beim Start)
        if (isset($_GET['all'])) {
            echo json_encode($result);
            exit;
        }

        // Wenn nur ein einzelnes WC angefragt wird
        $id = $_GET['id'] ?? '';
        if ($id && isset($result[$id])) {
            $result[$id]['osm_id'] = $id; // Die App erwartet diese ID manchmal explizit nochmal im Array
            echo json_encode($result[$id]);
        } else {
            echo json_encode(['osm_id' => $id, 'usable_yes' => 0, 'usable_no' => 0, 'cleanliness_sum' => 0, 'cleanliness_count' => 0]);
        }
        exit;
    } 
    
    // --- POST: Jemand stimmt ab ---
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? '';
        $usable = $data['usable'] ?? null;
        $cleanliness = isset($data['cleanliness']) ? (int)$data['cleanliness'] : null;

        if (!$id) die(json_encode(['error' => 'No ID']));

        // Speichert den einzelnen Vote ab
        $stmt = $db->prepare("INSERT INTO votes (osm_id, usable_vote, cleanliness_vote) VALUES (?, ?, ?)");
        $stmt->execute([$id, $usable, $cleanliness]);

        echo json_encode(['status' => 'success']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>