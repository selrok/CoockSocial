<?php
// TFG/api/admin_actions.php

ob_start();
if (session_status() === PHP_SESSION_NONE) { session_start(); }

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

require_once __DIR__ . '/../config/db_connection.php';

try {
    if (!isset($_SESSION['id_rol']) || (int)$_SESSION['id_rol'] > 2) {
        throw new Exception("No autorizado.", 403);
    }
    if (!$pdo) throw new Exception("Error de conexión BBDD.");

    $method = $_SERVER['REQUEST_METHOD'];

    // --- GET ---
    if ($method === 'GET' && ($_GET['action'] ?? '') === 'get_all') {
        $data = [
            'users' => $pdo->query("SELECT id, username, email, id_rol, fecha_registro as joindate FROM usuarios")->fetchAll(PDO::FETCH_ASSOC),
            // Contar reportes pendientes
            'recipes' => $pdo->query("SELECT r.id, r.titulo, u.username as author, r.id_usuario as authorId, r.visibilidad as status, r.fecha_publicacion as date, (SELECT COUNT(*) FROM reportes_receta WHERE id_receta = r.id) as reports FROM recetas r JOIN usuarios u ON r.id_usuario = u.id")->fetchAll(PDO::FETCH_ASSOC),
            'diets' => $pdo->query("SELECT id, nombre_dieta FROM tipos_dieta_receta")->fetchAll(PDO::FETCH_ASSOC),
            'supportTickets' => $pdo->query("SELECT id, nombre_remitente as name, email_remitente as email, mensaje as message, fecha_envio as submissionDate, estado as status FROM tickets_soporte ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC),
            'commentReports' => $pdo->query("SELECT rc.id, r.id as recipeId, r.titulo as recipeTitle, u.id as userId, u.username, c.contenido as commentContent, rc.fecha_reporte as reportDate, rc.estado as status, c.id as commentId FROM reportes_comentario rc JOIN comentarios_receta c ON rc.id_comentario = c.id JOIN recetas r ON c.id_receta = r.id JOIN usuarios u ON c.id_usuario = u.id")->fetchAll(PDO::FETCH_ASSOC)
        ];
        ob_clean();
        echo json_encode(['success' => true, 'data' => $data]);
        exit;
    }

    // --- POST ---
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    $id = $input['id'] ?? null;

    if ($method === 'POST') {
        if ($action === 'delete_user') {
            $pdo->prepare("DELETE FROM usuarios WHERE id = ? AND id_rol > 1")->execute([$id]);
        } 
        elseif ($action === 'delete_recipe') {
            // Borrado en cascada debería manejar dependencias, pero si no, borrarlas aquí
            $pdo->prepare("DELETE FROM recetas WHERE id = ?")->execute([$id]);
        }
        elseif ($action === 'delete_diet') {
            $pdo->prepare("DELETE FROM tipos_dieta_receta WHERE id = ?")->execute([$id]);
        }
        elseif ($action === 'add_diet') {
            $nombre = trim($input['nombre'] ?? '');
            if($nombre) $pdo->prepare("INSERT INTO tipos_dieta_receta (nombre_dieta) VALUES (?)")->execute([$nombre]);
        }
        elseif ($action === 'change_role') {
            $newRole = (int)$input['role_id'];
            if(in_array($newRole, [2, 3])) { // Solo permitir cambiar a Admin o Usuario
                $pdo->prepare("UPDATE usuarios SET id_rol = ? WHERE id = ? AND id_rol > 1")->execute([$newRole, $id]);
            }
        }
        // SOPORTE
        elseif ($action === 'solve_ticket') {
            $pdo->prepare("UPDATE tickets_soporte SET estado = 'Solucionado' WHERE id = ?")->execute([$id]);
        }
        // REPORTES COMENTARIOS
        elseif ($action === 'review_report') {
            $pdo->prepare("UPDATE reportes_comentario SET estado = 'Revisado' WHERE id = ?")->execute([$id]);
        }
        elseif ($action === 'hide_comment') {
            // Obtener ID comentario original desde el reporte
            $stmt = $pdo->prepare("SELECT id_comentario FROM reportes_comentario WHERE id = ?");
            $stmt->execute([$id]);
            $cid = $stmt->fetchColumn();
            if ($cid) {
                // Ocultar comentario
                $pdo->prepare("UPDATE comentarios_receta SET es_visible = 0 WHERE id = ?")->execute([$cid]);
                // Actualizar reporte
                $pdo->prepare("UPDATE reportes_comentario SET estado = 'Comentario Ocultado' WHERE id = ?")->execute([$id]);
            }
        }
        // NUEVO: LIMPIAR REPORTES RECETA
        elseif ($action === 'clear_reports') {
            // Borrar los registros de la tabla reportes_receta para esta receta
            $pdo->prepare("DELETE FROM reportes_receta WHERE id_receta = ?")->execute([$id]);
        }
        else {
            throw new Exception("Acción '$action' no reconocida.");
        }

        ob_clean();
        echo json_encode(['success' => true, 'message' => 'Operación realizada.']);
    }

} catch (Exception $e) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
ob_end_flush();
exit;
?>