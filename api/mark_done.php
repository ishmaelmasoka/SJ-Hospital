<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['doctor_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$appointment_id = $data['appointment_id'];

$stmt = $pdo->prepare("UPDATE appointments SET status = 'done' WHERE id = ?");
$result = $stmt->execute([$appointment_id]);

echo json_encode(['success' => $result]);
?>