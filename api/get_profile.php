<?php
// TFG/api/get_profile.php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

error_reporting(0);
ini_set('display_errors', 0);
ob_start(); 

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); 
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php'; 

try {
    $mi_id_real = (isset($_SESSION['user_id']) && $_SESSION['user_id'] != 0) ? $_SESSION['user_id'] : null;

    if (!$pdo) throw new Exception("Error de conexión al servidor de base de datos.");

    $id_url = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $id_perfil = $id_url ?: $mi_id_real;

    if (!$id_perfil) {
        throw new Exception("No se ha podido identificar el perfil.");
    }

    $is_own_profile = ($mi_id_real == $id_perfil);

    // 4. DATOS USUARIO
    $sqlUser = "SELECT id, username, nombre_completo, avatar_url, bio,
                (SELECT COUNT(*) FROM seguidores WHERE id_usuario_seguido = :id_p1) as followers,
                (SELECT COUNT(*) FROM seguidores WHERE id_usuario_seguidor = :id_p2) as following,
                (SELECT COUNT(*) FROM seguidores WHERE id_usuario_seguidor = :id_mio AND id_usuario_seguido = :id_p3) as is_following
                FROM usuarios WHERE id = :id_p4";
    
    $stmtUser = $pdo->prepare($sqlUser);
    $stmtUser->execute([ ':id_p1'=>$id_perfil, ':id_p2'=>$id_perfil, ':id_p3'=>$id_perfil, ':id_p4'=>$id_perfil, ':id_mio'=>$mi_id_real?:0 ]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$user) throw new Exception("El usuario no existe.");

    // 5. RECETAS PUBLICADAS (Modificado con JOINs para Categoria y Dieta)
    $sqlOwn = "
        SELECT 
            r.id, r.titulo, r.descripcion, r.imagen_url, r.visibilidad, r.tiempo_preparacion_min as time, r.dificultad,
            c.nombre_categoria, 
            d.nombre_dieta,
            (SELECT COUNT(*) FROM likes_receta WHERE id_receta = r.id) as likes
        FROM recetas r 
        LEFT JOIN categorias_receta c ON r.id_categoria = c.id
        LEFT JOIN tipos_dieta_receta d ON r.id_tipo_dieta = d.id
        WHERE r.id_usuario = :id_p
    ";
    
    if (!$is_own_profile) {
        $sqlOwn .= " AND r.visibilidad = 'publica'"; // Asegurar 'publica' exacto según tu ENUM
    }
    $sqlOwn .= " ORDER BY r.fecha_publicacion DESC";
    
    $stmtOwn = $pdo->prepare($sqlOwn);
    $stmtOwn->execute([':id_p' => $id_perfil]);
    $ownRecipesRaw = $stmtOwn->fetchAll(PDO::FETCH_ASSOC);
    
    // Mapeo Published
    $ownRecipes = [];
    foreach($ownRecipesRaw as $row) {
        $ownRecipes[] = [
            'id' => $row['id'],
            'titulo' => $row['titulo'],
            'imagen_url' => $row['imagen_url']?: 'resources/default-recipe.svg',
            'visibilidad' => $row['visibilidad'],
            'time' => $row['time'],
            'likes' => $row['likes'],
            // Nuevos campos
            'dificultad' => ucfirst($row['dificultad']),
            'categoria' => $row['nombre_categoria'],
            'dieta' => $row['nombre_dieta']
        ];
    }

    // 6. RECETAS GUARDADAS (Solo si es mi perfil - También modificado con JOINs)
    $savedRecipes = [];
    if ($is_own_profile) {
        $stmtSaved = $pdo->prepare("
            SELECT 
                r.id, r.titulo, r.descripcion, r.imagen_url, r.tiempo_preparacion_min as time, r.dificultad,
                u.username as author, u.id as authorId,
                c.nombre_categoria, 
                d.nombre_dieta,
                (SELECT COUNT(*) FROM likes_receta WHERE id_receta = r.id) as likes
            FROM recetas r
            INNER JOIN recetas_guardadas rg ON r.id = rg.id_receta
            INNER JOIN usuarios u ON r.id_usuario = u.id
            LEFT JOIN categorias_receta c ON r.id_categoria = c.id
            LEFT JOIN tipos_dieta_receta d ON r.id_tipo_dieta = d.id
            WHERE rg.id_usuario = :id_p
            ORDER BY rg.fecha_guardado DESC");
        
        $stmtSaved->execute([':id_p' => $id_perfil]);
        $savedRaw = $stmtSaved->fetchAll(PDO::FETCH_ASSOC);

        // Mapeo Saved
        foreach($savedRaw as $row) {
            $savedRecipes[] = [
                'id' => $row['id'],
                'titulo' => $row['titulo'],
                'imagen_url' => $row['imagen_url']?: 'resources/default-recipe.svg',
                'time' => $row['time'],
                'likes' => $row['likes'],
                'author' => $row['author'],
                'authorId' => $row['authorId'],
                // Nuevos campos
                'dificultad' => ucfirst($row['dificultad']),
                'categoria' => $row['nombre_categoria'],
                'dieta' => $row['nombre_dieta']
            ];
        }
    }

    ob_clean(); 

    echo json_encode([
        'success' => true,
        'is_own_profile' => $is_own_profile,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'fullName' => $user['nombre_completo'],
            'avatarUrl' => $user['avatar_url'] ?: 'resources/default-avatar.svg',
            'bio' => $user['bio'],
            'isFollowing' => (bool)$user['is_following'],
            'stats' => [
                'followers' => (int)$user['followers'], 
                'following' => (int)$user['following']
            ]
        ],
        'publishedRecipes' => $ownRecipes,
        'savedRecipes' => $savedRecipes
    ]);

} catch (Exception $e) {
    ob_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
ob_end_flush();
?>