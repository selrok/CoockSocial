<?php
// TFG/api/comments.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => '', 'data' => null];

try {
    if (!$pdo) throw new Exception("Error de conexión a la base de datos.");

    // --- GET: OBTENER COMENTARIOS ---
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        $recipeId = isset($_GET['recipe_id']) ? (int)$_GET['recipe_id'] : 0;
        
        if ($recipeId <= 0) {
            $response['success'] = true;
            $response['data'] = []; 
            echo json_encode($response);
            exit;
        }

        // OPTIMIZADO: Solo traemos id_usuario y username. Nada de imágenes.
        $sql = "SELECT 
                    c.id, 
                    c.id_receta, 
                    c.id_usuario, 
                    c.contenido, 
                    c.fecha_comentario, 
                    u.username
                FROM comentarios_receta c
                JOIN usuarios u ON c.id_usuario = u.id
                WHERE c.id_receta = :id AND c.es_visible = 1
                ORDER BY c.fecha_comentario DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $recipeId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response['success'] = true;
        $response['data'] = $comments;
    }

    // --- POST: CREAR O BORRAR COMENTARIO ---
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $inputJSON = file_get_contents('php://input');
        $data = json_decode($inputJSON, true);

        // 1. Verificar Login
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión.']);
            exit;
        }

        // CASO BORRAR
        if (isset($data['action']) && $data['action'] === 'delete') {
            $commentId = isset($data['comment_id']) ? (int)$data['comment_id'] : 0;
            
            // Verificar dueño
            $stmtCheck = $pdo->prepare("SELECT id_usuario FROM comentarios_receta WHERE id = ?");
            $stmtCheck->execute([$commentId]);
            $comment = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            // Permitir borrar si es el dueño O si es admin (rol 1 o 2)
            $isAdmin = (isset($_SESSION['id_rol']) && ($_SESSION['id_rol'] == 1 || $_SESSION['id_rol'] == 2));
            
            if ($comment && ($comment['id_usuario'] == $_SESSION['user_id'] || $isAdmin)) {
                $stmtDel = $pdo->prepare("DELETE FROM comentarios_receta WHERE id = ?");
                if ($stmtDel->execute([$commentId])) {
                    $response['success'] = true;
                    $response['message'] = 'Comentario eliminado.';
                } else {
                    $response['message'] = 'Error al eliminar.';
                }
            } else {
                $response['message'] = 'No tienes permiso o el comentario no existe.';
            }
            echo json_encode($response);
            exit;
        }

        // CASO CREAR (INSERT)
        $recipeId = isset($data['recipe_id']) ? (int)$data['recipe_id'] : 0;
        $content = isset($data['content']) ? trim($data['content']) : '';
        $userId = $_SESSION['user_id']; 

        if ($recipeId > 0 && !empty($content)) {
            $sql = "INSERT INTO comentarios_receta (id_receta, id_usuario, contenido, es_visible, fecha_comentario) 
                    VALUES (:rid, :uid, :content, 1, NOW())";
            
            $stmt = $pdo->prepare($sql);
            if($stmt->execute([':rid' => $recipeId, ':uid' => $userId, ':content' => $content])) {
                $newId = $pdo->lastInsertId();
                
                $response['success'] = true;
                $response['message'] = 'Comentario publicado.';
                // Devolvemos datos para pintar sin recargar (sin avatar)
                $response['data'] = [
                    'id' => $newId,
                    'id_usuario' => $userId,
                    'username' => $_SESSION['username'], // Cogemos el nombre de la sesión actual
                    'contenido' => $content,
                    'fecha_comentario' => date('Y-m-d H:i:s')
                ];
                http_response_code(201);
            } else {
                $response['message'] = 'Error al guardar en BD.';
            }
        } else {
            $response['message'] = 'Datos inválidos.';
        }
    }

} catch (Exception $e) {
    error_log("API Comments Error: " . $e->getMessage());
    $response['message'] = 'Error del servidor.';
    http_response_code(500);
}

echo json_encode($response);
exit;
?>