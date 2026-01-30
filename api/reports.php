<?php
// TFG/api/reports.php

if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401); echo json_encode(['success' => false, 'message' => 'No autorizado.']); exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? ''; // 'recipe' o 'comment'
    $targetId = (int)($input['target_id'] ?? 0);
    $userId = $_SESSION['user_id'];

    if ($targetId <= 0) { http_response_code(400); exit; }

    try {
        if(! $pdo) {
            throw new Exception("Error de conexión a la base de datos.(reports.php)");
        }   
        if ($type === 'recipe') {
            // Verificar si ya reportó esta receta para no duplicar
            $stmt = $pdo->prepare("SELECT id FROM reportes_receta WHERE id_receta = ? AND id_usuario_reportador = ?");
            $stmt->execute([$targetId, $userId]);
            if ($stmt->fetch()) {
                $response['success'] = true; $response['message'] = 'Ya has reportado esta receta anteriormente.';
            } else {
                $sql = "INSERT INTO reportes_receta (id_receta, id_usuario_reportador, fecha_reporte) VALUES (?, ?, NOW())";
                $pdo->prepare($sql)->execute([$targetId, $userId]);
                $response['success'] = true; $response['message'] = 'Receta reportada. Gracias.';
            }

        } elseif ($type === 'comment') {
            // Para reportes de comentario necesitamos el id_receta también según tu SQL anterior (opcional, pero buena práctica si la tabla lo pide)
            // Asumiremos que la tabla reportes_comentario tiene: id_comentario, id_usuario_reportador, fecha_reporte
            // Si tu tabla pide id_receta_asociada, deberíamos recibirlo del front. Asumiré que sí.
            $recipeIdAssociated = (int)($input['recipe_id'] ?? 0);

            $stmt = $pdo->prepare("SELECT id FROM reportes_comentario WHERE id_comentario = ? AND id_usuario_reportador = ?");
            $stmt->execute([$targetId, $userId]);
            
            if ($stmt->fetch()) {
                $response['success'] = true; $response['message'] = 'Ya has reportado este comentario.';
            } else {
                $sql = "INSERT INTO reportes_comentario (id_comentario, id_receta_asociada, id_usuario_reportador, fecha_reporte, estado) VALUES (?, ?, ?, NOW(), 'Pendiente')";
                $pdo->prepare($sql)->execute([$targetId, $recipeIdAssociated, $userId]);
                $response['success'] = true; $response['message'] = 'Comentario reportado.';
            }
        }
    } catch (Exception $e) {
        http_response_code(500); $response['message'] = 'Error servidor';
    }
}
echo json_encode($response);
?>