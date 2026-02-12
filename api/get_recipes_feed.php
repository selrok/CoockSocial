<?php
// TFG/api/get_recipes_feed.php

// 1. Modelo de Éxito: Gestión de sesión y limpieza de búfer
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); // O tu localhost
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php';

$response = ['success' => false, 'data' => [], 'message' => ''];

try {
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos.");
    }

    // Capturamos el ID del usuario de la sesión para saber a quién sigue
    $current_user_id = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
    
    $sql = "
        SELECT 
            r.id, 
            r.titulo, 
            r.imagen_url, 
            r.tiempo_preparacion_min, 
            r.fecha_publicacion,
            r.dificultad,
            r.id_usuario as authorId,
            u.username as author_name,
            u.avatar_url as author_avatar,
            c.id as cat_id,
            c.nombre_categoria,
            d.id as diet_id,
            d.nombre_dieta,
            (SELECT COUNT(*) FROM likes_receta l WHERE l.id_receta = r.id) as total_likes,
            -- SUBQUERY: ¿El usuario actual sigue al autor de esta receta?
            (SELECT COUNT(*) FROM seguidores s WHERE s.id_usuario_seguidor = ? AND s.id_usuario_seguido = r.id_usuario) as is_followed,
            -- SUBQUERY: Total de seguidores de este autor (para chefs destacados)
            (SELECT COUNT(*) FROM seguidores s2 WHERE s2.id_usuario_seguido = r.id_usuario) as author_followers
        FROM recetas r
        JOIN usuarios u ON r.id_usuario = u.id
        LEFT JOIN categorias_receta c ON r.id_categoria = c.id
        LEFT JOIN tipos_dieta_receta d ON r.id_tipo_dieta = d.id
        WHERE r.visibilidad = 'publica'
        ORDER BY r.fecha_publicacion DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$current_user_id]);
    $rawRecipes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mappedRecipes = [];
    foreach ($rawRecipes as $row) {
        $mappedRecipes[] = [
            'id' => $row['id'],
            'title' => $row['titulo'],
            'author' => $row['author_name'],
            'authorId' => $row['authorId'],
            'authorAvatar' => $row['author_avatar'] ? $row['author_avatar'] : 'resources/default-avatar.svg',
            'image' => $row['imagen_url'] ? $row['imagen_url'] : 'resources/default-recipe.svg',
            'likes' => (int)$row['total_likes'],
            'time' => $row['tiempo_preparacion_min'] . " min",
            'timeInMinutes' => (int)$row['tiempo_preparacion_min'],
            'publishDate' => $row['fecha_publicacion'],
            
            // Datos para filtros y visualización
            'category_id' => (string)$row['cat_id'],
            'category_name' => $row['nombre_categoria'],
            
            'diet_id' => (string)$row['diet_id'],
            'diet_name' => $row['nombre_dieta'],
            
            'difficulty' => strtolower($row['dificultad']),

            // Campos clave para Seguidores y Chefs
            'isAuthorFollowed' => (int)$row['is_followed'] > 0,
            'authorFollowersCount' => (int)$row['author_followers']
        ];
    }

    $response['success'] = true;
    $response['data'] = $mappedRecipes;

    // Limpiamos cualquier warning que haya podido soltar db_connection.php
    ob_clean();

} catch (Exception $e) {
    error_log("API Error (get_recipes_feed.php): " . $e->getMessage());
    $response['message'] = 'Error al cargar las recetas.';
    http_response_code(500);
}

echo json_encode($response);
ob_end_flush();
exit;