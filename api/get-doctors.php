<?php
require_once 'config.php';

$stmt = $pdo->query("SELECT id, name, start_hour, end_hour FROM doctors ORDER BY id");
$doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($doctors);
?>