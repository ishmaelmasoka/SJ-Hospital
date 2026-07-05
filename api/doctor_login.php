<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$doctor_id = $data['doctor_id'];
$password = $data['password'];

$stmt = $pdo->prepare("SELECT id, name, username FROM doctors WHERE id = ? AND password = ?");
$stmt->execute([$doctor_id, $password]);
$doctor = $stmt->fetch(PDO::FETCH_ASSOC);

if ($doctor) {
    session_start();
    $_SESSION['doctor_id'] = $doctor['id'];
    $_SESSION['doctor_name'] = $doctor['name'];
    echo json_encode(['success' => true, 'doctor' => $doctor]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
}
?>