<?php
// TFG/api/recipes.php

// 1. Iniciar sesión y configuración
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); // POST se usa para delete también
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// 2. Includes
require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/image_helper.php'; // Necesario para borrar la imagen del servidor

/** @var PDO $pdo */

// Pre-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => '', 'data' => null];

try {
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos.");
    }

    // ==================================================================
    // 3. GET: OBTENER DETALLES DE UNA RECETA
    // ==================================================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        if (!isset($_GET['id']) || empty($_GET['id'])) {
            $response['message'] = 'Falta el parámetro ID en la URL.';
            http_response_code(400); 
            echo json_encode($response);
            exit;
        }

        $recipeId = (int)$_GET['id'];

        $sql = "
            SELECT 
                r.*,
                u.username as autor_username,
                u.avatar_url as autor_avatar,
                c.nombre_categoria,
                d.nombre_dieta,
                (SELECT COUNT(*) FROM likes_receta l WHERE l.id_receta = r.id) as total_likes
            FROM recetas r
            JOIN usuarios u ON r.id_usuario = u.id
            LEFT JOIN categorias_receta c ON r.id_categoria = c.id
            LEFT JOIN tipos_dieta_receta d ON r.id_tipo_dieta = d.id
            WHERE r.id = :id
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $recipeId]);
        $recipe = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($recipe) {
            // --- INICIALIZAR ESTADOS POR DEFECTO ---
            $userHasLiked = false;
            $userHasSaved = false;
            $isFollowingAuthor = false; // <--- IMPORTANTE: Variable inicializada

            // --- VERIFICAR ESTADOS SI HAY LOGIN ---
            if (isset($_SESSION['user_id'])) {
                $currentUserId = $_SESSION['user_id'];

                // 1. Check Like
                $stmtLike = $pdo->prepare("SELECT 1 FROM likes_receta WHERE id_usuario = ? AND id_receta = ?");
                $stmtLike->execute([$currentUserId, $recipeId]);
                if ($stmtLike->fetch()) $userHasLiked = true;

                // 2. Check Guardado
                $stmtSave = $pdo->prepare("SELECT 1 FROM recetas_guardadas WHERE id_usuario = ? AND id_receta = ?");
                $stmtSave->execute([$currentUserId, $recipeId]);
                if ($stmtSave->fetch()) $userHasSaved = true;

                // 3. Check SEGUIR (Follow) <--- IMPORTANTE: Lógica añadida
                // Solo verificamos si el usuario logueado NO es el autor de la receta
                if ($currentUserId != $recipe['id_usuario']) {
                    $stmtFollow = $pdo->prepare("SELECT 1 FROM seguidores WHERE id_usuario_seguidor = ? AND id_usuario_seguido = ?");
                    // seguidor = yo, seguido = autor de la receta
                    $stmtFollow->execute([$currentUserId, $recipe['id_usuario']]); 
                    if ($stmtFollow->fetch()) {
                        $isFollowingAuthor = true;
                    }
                }
            }

            // Obtener Ingredientes
            $stmtIng = $pdo->prepare("SELECT descripcion_ingrediente FROM ingredientes_receta WHERE id_receta = ? ORDER BY id ASC");
            $stmtIng->execute([$recipeId]);
            $ingredientes = $stmtIng->fetchAll(PDO::FETCH_COLUMN);

            // Obtener Pasos
            $stmtPasos = $pdo->prepare("SELECT descripcion_paso FROM pasos_preparacion WHERE id_receta = ? ORDER BY numero_paso ASC");
            $stmtPasos->execute([$recipeId]);
            $pasos = $stmtPasos->fetchAll(PDO::FETCH_COLUMN);

            // --- RESPUESTA JSON ---
            $response['success'] = true;
            $response['data'] = [
                'id' => $recipe['id'],
                'id_usuario' => $recipe['id_usuario'],
                'autor_username' => $recipe['autor_username'],
                'autor_avatar' => $recipe['autor_avatar'] ? $recipe['autor_avatar'] : 'resources/default-avatar.svg',
                'titulo' => $recipe['titulo'],
                'descripcion' => $recipe['descripcion'],
                'imagen_url' => $recipe['imagen_url'] ? $recipe['imagen_url'] : 'resources/default-recipe.svg',
                'tiempo_preparacion_min' => $recipe['tiempo_preparacion_min'],
                'porciones' => $recipe['porciones'],
                'dificultad' => ucfirst($recipe['dificultad']),
                'fecha_publicacion' => $recipe['fecha_publicacion'],
                'consejos_chef' => $recipe['consejos_chef'],
                'visibilidad' => $recipe['visibilidad'],
                'categoria' => $recipe['nombre_categoria'], 
                'dieta' => $recipe['nombre_dieta'],
                'ingredientes' => $ingredientes,
                'pasos' => $pasos,
                'likesCount' => (int)$recipe['total_likes'],
                
                // --- ESTADOS DE USUARIO ---
                'userHasLiked' => $userHasLiked,
                'userHasSaved' => $userHasSaved,
                'isFollowingAuthor' => $isFollowingAuthor, // <--- IMPORTANTE: Enviarlo al JS
                
                'isOwner' => (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $recipe['id_usuario']),
                'isAdmin' => (isset($_SESSION['id_rol']) && ($_SESSION['id_rol'] == 1 || $_SESSION['id_rol'] == 2))
            ];
        } else {
            $response['message'] = 'Receta no encontrada.';
            http_response_code(404);
        }
    }

    // ==================================================================
    // 4. POST: ELIMINAR RECETA (Action: delete)
    // ==================================================================
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Verificar Login
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado.']);
            exit;
        }

        $inputJSON = file_get_contents('php://input');
        $data = json_decode($inputJSON, true);

        // Verificar Acción Borrar
        if (isset($data['action']) && $data['action'] === 'delete') {
            
            $recipeId = isset($data['id']) ? (int)$data['id'] : 0;
            if ($recipeId <= 0) {
                throw new Exception("ID de receta inválido.");
            }

            // A. Verificar Propiedad y Obtener Imagen para borrarla
            $stmtCheck = $pdo->prepare("SELECT id_usuario, imagen_url FROM recetas WHERE id = ?");
            $stmtCheck->execute([$recipeId]);
            $recipeInfo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$recipeInfo) {
                throw new Exception("La receta no existe.");
            }

            // Permisos: Dueño o Admin (Rol 1 o 2)
            $isOwner = ($recipeInfo['id_usuario'] == $_SESSION['user_id']);
            $isAdmin = (isset($_SESSION['id_rol']) && ($_SESSION['id_rol'] == 1 || $_SESSION['id_rol'] == 2));

            if (!$isOwner && !$isAdmin) {
                http_response_code(403); // Forbidden
                throw new Exception("No tienes permiso para eliminar esta receta.");
            }

            // B. Transacción de Borrado
            $pdo->beginTransaction();

            try {
                // 1. Borrar dependencias explícitamente
                
                // Comentarios
                $pdo->prepare("DELETE FROM comentarios_receta WHERE id_receta = ?")->execute([$recipeId]);
                
                // Likes
                $pdo->prepare("DELETE FROM likes_receta WHERE id_receta = ?")->execute([$recipeId]);
                
                // Guardados (Favoritos)
                $pdo->prepare("DELETE FROM recetas_guardadas WHERE id_receta = ?")->execute([$recipeId]);
                
                // Ingredientes
                $pdo->prepare("DELETE FROM ingredientes_receta WHERE id_receta = ?")->execute([$recipeId]);
                
                // Pasos
                $pdo->prepare("DELETE FROM pasos_preparacion WHERE id_receta = ?")->execute([$recipeId]);
                
                // Reportes de Receta (si existen)
                $pdo->prepare("DELETE FROM reportes_receta WHERE id_receta = ?")->execute([$recipeId]);

                // NOTA: Si los reportes de comentarios también tienen FK a la receta (id_receta_asociada), bórralos también
                // $pdo->prepare("DELETE FROM reportes_comentario WHERE id_receta_asociada = ?")->execute([$recipeId]);

                // 2. Borrar la Receta
                $stmtDel = $pdo->prepare("DELETE FROM recetas WHERE id = ?");
                $stmtDel->execute([$recipeId]);

                // 3. Confirmar Transacción
                $pdo->commit();

                // 4. Borrar archivo de imagen del servidor
                if (!empty($recipeInfo['imagen_url'])) {
                    // Usamos la función helper. Asegúrate de que image_helper.php esté incluido arriba
                    deleteImage($recipeInfo['imagen_url']); 
                }

                $response['success'] = true;
                $response['message'] = 'Receta y todos sus datos asociados eliminados correctamente.';

            } catch (Exception $ex) {
                $pdo->rollBack();
                throw $ex; // Relanzar para el catch general
            }

        } else {
            $response['message'] = 'Acción no válida o formato incorrecto.';
            http_response_code(400);
        }
    }
    else {
        $response['message'] = 'Método HTTP no soportado.';
        http_response_code(405);
    }

} catch (Exception $e) {
    error_log("API Recipe Error: " . $e->getMessage());
    $response['message'] = 'Error del servidor: ' . $e->getMessage();
    if (http_response_code() == 200) http_response_code(500);
}

echo json_encode($response);
exit;
?>