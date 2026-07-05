<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$patient_name = $data['patient_name'];
$patient_contact = $data['patient_contact'];
$doctor_id = $data['doctor_id'];
$appointment_date = $data['appointment_date'];
$appointment_time = $data['appointment_time'];

// Check if slot is already booked
$stmt = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status = 'booked'");
$stmt->execute([$doctor_id, $appointment_date, $appointment_time]);

if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Time slot already taken']);
    exit;
}

// Book the appointment
$stmt = $pdo->prepare("INSERT INTO appointments (patient_name, patient_contact, doctor_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?)");
$result = $stmt->execute([$patient_name, $patient_contact, $doctor_id, $appointment_date, $appointment_time]);

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Appointment booked successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Booking failed']);
}
?>