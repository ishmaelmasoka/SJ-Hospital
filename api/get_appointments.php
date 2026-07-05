<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['doctor_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$doctor_id = $_SESSION['doctor_id'];
$today = date('Y-m-d');

$stmt = $pdo->prepare("SELECT id, patient_name, patient_contact, appointment_date, appointment_time, status FROM appointments WHERE doctor_id = ? AND appointment_date >= ? AND status = 'booked' ORDER BY appointment_date, appointment_time");
$stmt->execute([$doctor_id, $today]);
$appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($appointments);
?>