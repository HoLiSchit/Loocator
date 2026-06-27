<?php
// backend.php
header('Content-Type: application/json');

try {
    $db = new PDO('sqlite:' . __DIR__ . '/loocator.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $db->exec("CREATE TABLE IF NOT EXISTS ratings (
        osm_id TEXT PRIMARY KEY,
        usable_yes INTEGER DEFAULT 0,
        usable_no INTEGER DEFAULT 0,
        cleanliness_sum INTEGER DEFAULT 0,
        cleanliness_count INTEGER DEFAULT 0
    )");

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // NEU: Wenn 'all=1' angefragt wird, sende alle Bewertungen zurück (für den Filter)
        if (isset($_GET['all'])) {
            $stmt = $db->query("SELECT * FROM ratings");
            $allRatings = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $allRatings[$row['osm_id']] = [
                    'usable_yes' => (int)$row['usable_yes'],
                    'usable_no' => (int)$row['usable_no'],
                    'cleanliness_sum' => (int)$row['cleanliness_sum'],
                    'cleanliness_count' => (int)$row['cleanliness_count']
                ];
            }
            echo json_encode($allRatings);
            exit;
        }

        // Standard: Nur ein einzelnes WC abfragen
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT * FROM ratings WHERE osm_id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            echo json_encode([
                'osm_id' => $row['osm_id'],
                'usable_yes' => (int)$row['usable_yes'],
                'usable_no' => (int)$row['usable_no'],
                'cleanliness_sum' => (int)$row['cleanliness_sum'],
                'cleanliness_count' => (int)$row['cleanliness_count']
            ]);
        } else {
            echo json_encode(['osm_id' => $id, 'usable_yes' => 0, 'usable_no' => 0, 'cleanliness_sum' => 0, 'cleanliness_count' => 0]);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? '';
        $usable = $data['usable'] ?? null;
        $cleanliness = $data['cleanliness'] ?? null;

        if (!$id) die(json_encode(['error' => 'No ID']));

        $stmt = $db->prepare("INSERT INTO ratings (osm_id) VALUES (?) ON CONFLICT(osm_id) DO NOTHING");
        $stmt->execute([$id]);

        if ($usable === 'yes') {
            $db->exec("UPDATE ratings SET usable_yes = usable_yes + 1 WHERE osm_id = '$id'");
        } elseif ($usable === 'no') {
            $db->exec("UPDATE ratings SET usable_no = usable_no + 1 WHERE osm_id = '$id'");
        }

        if ($cleanliness !== null && $cleanliness >= 1 && $cleanliness <= 5) {
            $db->exec("UPDATE ratings SET cleanliness_sum = cleanliness_sum + $cleanliness, cleanliness_count = cleanliness_count + 1 WHERE osm_id = '$id'");
        }
        
        echo json_encode(['status' => 'success']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>