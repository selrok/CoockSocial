<?php

// 1. Configuración de errores para depuración (QUITA ESTO EN PRODUCCIÓN)
ini_set('display_errors', 0); // No mostrar errores en el output (rompe el JSON)
ini_set('log_errors', 1);     // Guardar errores en el log del servidor
error_reporting(E_ALL);

// 2. Iniciar Sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 3. Cabeceras CORS y JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://sergisaiz.com.es'); // O tu localhost
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Credentials: true');

// 4. Manejo de OPTIONS (Pre-flight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 5. Includes necesarios
try {
    // Ajusta estas rutas si tus carpetas son diferentes
    require_once __DIR__ . '/../config/db_connection.php'; // Aquí se crea $pdo
    require_once __DIR__ . '/recipe_utils.php'; // Aquí está la función processRecipeFormData
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al cargar dependencias del servidor.']);
    exit;
}

$response = ['success' => false, 'message' => ''];

// 6. Verificar Autenticación
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado. Debes iniciar sesión.']);
    exit;
}

// 7. Procesar POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Verificar que $pdo existe antes de usarlo
        if (!$pdo) {
            throw new Exception("Error crítico: No hay conexión a la base de datos.");
        }

        // A. Procesar y Validar datos (usando la función de recipe_utils.php)
        // Esto maneja la subida de imagen también.
        $data = processRecipeFormData($_POST, $_FILES, null);

        // B. INICIAR TRANSACCIÓN (Aquí empieza el bloque seguro)
        $pdo->beginTransaction();

        // C. Insertar la Receta Principal
        $sql = "INSERT INTO recetas (
                    id_usuario, titulo, descripcion, imagen_url, 
                    id_categoria, tiempo_preparacion_min, porciones, 
                    id_tipo_dieta, dificultad, visibilidad, consejos_chef
                ) VALUES (
                    :uid, :tit, :desc, :img, 
                    :cat, :time, :porc, 
                    :diet, :dif, :vis, :cons
                )";
        
        $stmt = $pdo->prepare($sql);
        
        // Ejecutar la inserción
        $stmt->execute([
            ':uid' => $_SESSION['user_id'],
            ':tit' => $data['titulo'],
            ':desc' => $data['descripcion'],
            ':img' => $data['imagen_url'],
            ':cat' => $data['id_categoria'],
            ':time' => $data['tiempo_preparacion_min'],
            ':porc' => $data['porciones'],
            ':diet' => $data['id_tipo_dieta'],
            ':dif' => $data['dificultad'],
            ':vis' => $data['visibilidad'],
            ':cons' => $data['consejos_chef']
        ]);
        
        // Obtener el ID de la receta recién creada
        $recipeId = $pdo->lastInsertId();

        // D. Insertar Ingredientes
        if (!empty($data['ingredientes'])) {
            $sqlIng = "INSERT INTO ingredientes_receta (id_receta, descripcion_ingrediente) VALUES (?, ?)";
            $stmtIng = $pdo->prepare($sqlIng);
            foreach ($data['ingredientes'] as $ing) {
                $stmtIng->execute([$recipeId, $ing]);
            }
        }

        // E. Insertar Pasos
        if (!empty($data['pasos'])) {
            $sqlStep = "INSERT INTO pasos_preparacion (id_receta, numero_paso, descripcion_paso) VALUES (?, ?, ?)";
            $stmtStep = $pdo->prepare($sqlStep);
            foreach ($data['pasos'] as $idx => $paso) {
                // $idx + 1 para que el paso empiece en 1, no en 0
                $stmtStep->execute([$recipeId, ($idx + 1), $paso]);
            }
        }

        // F. CONFIRMAR TRANSACCIÓN (Guardar todo)
        $pdo->commit();
        
        // Respuesta de éxito
        $response['success'] = true;
        $response['message'] = 'Receta creada con éxito.';
        $response['recipe_id'] = $recipeId;
        http_response_code(201); // Created

    } catch (PDOException $e) {
        // Error de Base de Datos
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack(); // Deshacer cambios si falló la BD
        }
        error_log("API DB Error (formReceta.php): " . $e->getMessage()); // Ver log del servidor
        $response['message'] = 'Error de base de datos: ' . $e->getMessage();
        http_response_code(500);

    } catch (Exception $e) {
        // Error General (validación, subida de imagen, lógica)
        if ($pdo && $pdo->inTransaction()) {
            $pdo->rollBack(); // Deshacer cambios
        }
        error_log("API Error (formReceta.php): " . $e->getMessage()); // Ver log del servidor
        $response['message'] = 'Error al procesar la solicitud: ' . $e->getMessage();
        http_response_code(400); // Bad Request (usualmente son errores de validación)
    }

} else {
    $response['message'] = 'Método no permitido. Usa POST.';
    http_response_code(405);
}

echo json_encode($response);
exit;
?>