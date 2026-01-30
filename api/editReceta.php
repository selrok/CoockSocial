<?php

// 1. Configuración de errores (Igual que formReceta)
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// 2. Iniciar Sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 3. Cabeceras
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es');
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Usamos POST para enviar archivos
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = ['success' => false, 'message' => ''];

// 4. Includes
try {

    require_once __DIR__ . '/../config/db_connection.php';
    require_once __DIR__ . '/recipe_utils.php';

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de dependencias.']);
    exit;
}

// 5. Verificar Login
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if (!$pdo) {
            throw new Exception("Error crítico: Sin conexión a la base de datos.");
        }

        // A. Obtener el ID de la receta a editar
        $recipeId = isset($_POST['id_receta']) ? (int)$_POST['id_receta'] : 0;

        if ($recipeId <= 0) {
            throw new Exception("ID de receta no válido.");
        }

        // B. Verificar PROPIEDAD y existencia (Seguridad)
        // Consultamos quién es el dueño y cuál es la imagen actual
        $stmtCheck = $pdo->prepare("SELECT id_usuario, imagen_url FROM recetas WHERE id = :id");
        $stmtCheck->execute([':id' => $recipeId]);
        $currentRecipe = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$currentRecipe) {
            throw new Exception("La receta no existe.");
        }

        // ¿Es el dueño O es un administrador?
        // Asumiendo roles: 1=SuperAdmin, 2=Admin
        $isOwner = ($currentRecipe['id_usuario'] == $_SESSION['user_id']);
        $isAdmin = (isset($_SESSION['id_rol']) && ($_SESSION['id_rol'] == 1 || $_SESSION['id_rol'] == 2));

        if (!$isOwner && !$isAdmin) {
            http_response_code(403); // Forbidden
            throw new Exception("No tienes permiso para editar esta receta.");
        }

        // C. Procesar datos (Aquí pasamos la imagen vieja para que el helper sepa si borrarla)
        $oldImagePath = $currentRecipe['imagen_url'];
        $data = processRecipeFormData($_POST, $_FILES, $oldImagePath);

        // D. INICIAR TRANSACCIÓN
        $pdo->beginTransaction();

        // E. Actualizar la tabla 'recetas'
        // Nota: actualizamos fecha_publicacion al editar para que suba en "recientes" (opcional)
        $sql = "UPDATE recetas SET 
                    titulo = :tit, 
                    descripcion = :desc, 
                    imagen_url = :img, 
                    id_categoria = :cat,
                    porciones = :porc, 
                    id_tipo_dieta = :diet, 
                    dificultad = :dif, 
                    visibilidad = :vis, 
                    consejos_chef = :cons
                WHERE id = :id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tit' => $data['titulo'],
            ':desc' => $data['descripcion'],
            ':img' => $data['imagen_url'], // Será la nueva url o la vieja si no se cambió
            ':cat' => $data['id_categoria'],
            ':time' => $data['tiempo_preparacion_min'],
            ':porc' => $data['porciones'],
            ':diet' => $data['id_tipo_dieta'],
            ':dif' => $data['dificultad'],
            ':vis' => $data['visibilidad'],
            ':cons' => $data['consejos_chef'],
            ':id' => $recipeId
        ]);

        // F. Actualizar Ingredientes (Estrategia: Borrar todos e insertar los nuevos)
        // Es más limpio que intentar detectar cuáles cambiaron.
        $stmtDelIng = $pdo->prepare("DELETE FROM ingredientes_receta WHERE id_receta = ?");
        $stmtDelIng->execute([$recipeId]);

        if (!empty($data['ingredientes'])) {
            $stmtInsIng = $pdo->prepare("INSERT INTO ingredientes_receta (id_receta, descripcion_ingrediente) VALUES (?, ?)");
            foreach ($data['ingredientes'] as $ing) {
                $stmtInsIng->execute([$recipeId, $ing]);
            }
        }

        // G. Actualizar Pasos (Misma estrategia: Borrar e insertar)
        $stmtDelStep = $pdo->prepare("DELETE FROM pasos_preparacion WHERE id_receta = ?");
        $stmtDelStep->execute([$recipeId]);

        if (!empty($data['pasos'])) {
            $stmtInsStep = $pdo->prepare("INSERT INTO pasos_preparacion (id_receta, numero_paso, descripcion_paso) VALUES (?, ?, ?)");
            foreach ($data['pasos'] as $idx => $paso) {
                $stmtInsStep->execute([$recipeId, ($idx + 1), $paso]);
            }
        }

        // H. CONFIRMAR
        $pdo->commit();

        $response['success'] = true;
        $response['message'] = 'Receta actualizada correctamente.';
        $response['recipe_id'] = $recipeId;

    } catch (PDOException $e) {
        if ($pdo && $pdo->inTransaction()) { $pdo->rollBack(); }
        error_log("API DB Error (editReceta.php): " . $e->getMessage());
        $response['message'] = 'Error de base de datos.';
        http_response_code(500);

    } catch (Exception $e) {
        if ($pdo && $pdo->inTransaction()) { $pdo->rollBack(); }
        error_log("API Error (editReceta.php): " . $e->getMessage());
        $response['message'] = $e->getMessage();
        // Si ya enviamos un 403 arriba, no sobreescribirlo con 400
        if (http_response_code() == 200) {
            http_response_code(400); 
        }
    }
} else {
    $response['message'] = 'Método no permitido.';
    http_response_code(405);
}

echo json_encode($response);
exit;
?>