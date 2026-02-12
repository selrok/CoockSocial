// TFG/api/contactUs.php

<?php
ob_start(); // Evita que warnings previos rompan el JSON
header('Content-Type: application/json');

try {
    require_once '../config/db_connection.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido");
    }

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data || empty($data['nombre']) || empty($data['email']) || empty($data['mensaje'])) {
        throw new Exception("Faltan datos obligatorios.");
    }

    // 1. Obtener conexión (Pasando array vacío como requiere tu función)
    $pdo = establishUserSessionFunction([]); 

    if (!$pdo) {
        throw new Exception("No se pudo conectar con la base de datos.");
    }

    // 2. Comprobar ID de usuario si existe sesión
    $id_usuario = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

    // 3. Insertar Ticket
    $query = "INSERT INTO tickets_soporte (id_usuario, nombre, email, mensaje, fecha_creacion, estado) 
              VALUES (:id_u, :nom, :em, :msg, NOW(), 'abierto')";
    
    $stmt = $pdo->prepare($query);
    $result = $stmt->execute([
        ':id_u'  => $id_usuario,
        ':nom'   => $data['nombre'],
        ':em'    => $data['email'],
        ':msg'   => $data['mensaje']
    ]);

    if (!$result) {
        throw new Exception("Error al insertar en la base de datos.");
    }

    ob_clean(); // Limpiamos cualquier warning basura
    echo json_encode(['success' => true, 'message' => '¡Ticket enviado correctamente!']);

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
}
ob_end_flush();