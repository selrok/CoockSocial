<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
// --- Configuración CORS ---
// AJUSTA $frontend_origin a tu dominio/puerto exacto. Ejemplo:
$frontend_origin = 'https://sergisaiz.com.es'; // O 'http://localhost:TU_PUERTO_DEV'
// $frontend_origin = 'http://localhost'; // Si no usas puerto específico en dev

$http_origin = $_SERVER['HTTP_ORIGIN'] ?? null;
// Lista de orígenes permitidos (incluye desarrollo y producción)
$allowed_origins = [$frontend_origin, 'http://localhost', 'http://127.0.0.1' /*, 'http://localhost:OTRO_PUERTO_SI_USAS' */]; 

if ($http_origin && in_array($http_origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $http_origin);
} else if (!$http_origin && isset($_SERVER['SERVER_NAME']) && in_array('http://'.$_SERVER['SERVER_NAME'], $allowed_origins)) {
    // Para cuando no se envía HTTP_ORIGIN pero se accede desde un dominio permitido (raro con AJAX)
    header('Access-Control-Allow-Origin: ' . 'http://'.$_SERVER['SERVER_NAME']);
} else if ($http_origin) { // Log si el origen no está permitido
     error_log("Origen no permitido en auth.php: " . $http_origin . ". Orígenes permitidos: " . implode(', ', $allowed_origins));
     // Podrías no enviar la cabecera si no quieres permitirlo explícitamente.
     // Por ahora, si no está en la lista, el navegador debería bloquearlo por CORS si es cross-origin.
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

require_once __DIR__ . '/../config/db_connection.php'; 

// Asegurar que la función de sesión está disponible
if (!function_exists('establishUserSessionFunction')) {
    // Definirla aquí como fallback si no está en db_connection.php (aunque debería estarlo)
    function establishUserSessionFunction(array $user) {
        if (session_status() !== PHP_SESSION_ACTIVE) { session_start(); }
        session_regenerate_id(true); 
        $_SESSION['user_id'] = (int)$user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['id_rol'] = (int)$user['id_rol'];
        $_SESSION['email'] = $user['email'] ?? null;
        $_SESSION['nombre_completo'] = $user['nombre_completo'] ?? null;
        $_SESSION['avatar_url'] = $user['avatar_url'] ?? null;
    }
}

$response = ['success' => false, 'message' => '', 'data' => null];
$action = $_GET['action'] ?? ''; 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    switch ($action) {
        case 'login':
            $inputJSON = file_get_contents('php://input');
            $data = json_decode($inputJSON, true);

            if (json_last_error() !== JSON_ERROR_NONE || !$data) {
                $response['message'] = 'JSON inválido.'; http_response_code(400); break;
            }
            $loginIdentifier = trim($data['loginIdentifier'] ?? '');
            $password = $data['password'] ?? '';
            if (empty($loginIdentifier) || empty($password)) {
                $response['message'] = 'Identificador y contraseña requeridos.'; http_response_code(400); break;
            }

            try {
                if (!$pdo) { throw new Exception("Conexión DB no disponible."); }

                // *** CORRECCIÓN AQUÍ: Usar marcadores de posición anónimos '?' ***
                $sql = "SELECT id, username, email, password_hash, nombre_completo, id_rol, avatar_url 
                        FROM usuarios 
                        WHERE username = ? OR email = ?"; // Usamos '?'
                $stmt = $pdo->prepare($sql);

                if (!$stmt) {
                    $errorInfo = $pdo->errorInfo();
                    error_log("API Auth (login): Fallo PREPARE. PDO Err: " . ($errorInfo[2] ?? 'ND') . ". SQL: " . $sql);
                    throw new PDOException("Error interno (prepare)."); 
                }
                
                // Pasamos los valores en un array a execute()
                // Como ambos '?' usan el mismo valor $loginIdentifier, lo pasamos dos veces.
                $stmt->execute([$loginIdentifier, $loginIdentifier]); 
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user && password_verify($password, $user['password_hash'])) {
                    establishUserSessionFunction($user);
                    $response['success'] = true;
                    $response['message'] = 'Inicio de sesión exitoso.';
                    $response['data'] = [ /* ... datos del usuario como antes ... */
                        'id'=>(int)$user['id'], 'username'=>$user['username'], 'email'=>$user['email'],
                        'nombre_completo'=>$user['nombre_completo'], 'id_rol'=>(int)$user['id_rol'], 'avatar_url'=>$user['avatar_url']
                    ];
                    http_response_code(200);
                } else { /* ... credenciales incorrectas, log y respuesta 401 como antes ... */ 
                    error_log("API Auth (login): Credenciales incorrectas para '{$loginIdentifier}'. User: " . ($user ? 'Sí':'No') . ". PwdVerify: " . ($user ? (password_verify($password, $user['password_hash'])?'OK':'FALLO'):'N/A'));
                    $response['message'] = 'Credenciales incorrectas.'; http_response_code(401);
                }
            } catch (PDOException $e) { /* ... tu catch PDOException como antes ... */ 
                error_log("API DB PDOException (login): " . $e->getMessage() . " - SQL: " . (isset($sql)?$sql:'N/A') . " Input: " . $inputJSON);
                $response['message'] = 'Error de DB (login).'; http_response_code(500);
            } catch (Exception $e) { /* ... tu catch Exception como antes ... */ 
                error_log("API General Exception (login): " . $e->getMessage() . " Input: " . $inputJSON);
                $response['message'] = 'Error general (login).'; http_response_code(500);
            }
            break;

        case 'logout':
            // ... (código de logout como te lo pasé en la respuesta anterior, asegurando que devuelva success:true)
            error_log("Intentando logout. Session ID ANTES: " . session_id() . " - User ID: " . ($_SESSION['user_id'] ?? 'Ninguno'));
            $_SESSION = array(); 
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
            }
            $destroy_result = session_destroy(); 
            error_log("Resultado session_destroy(): " . ($destroy_result ? 'true':'false') . ". Session status DESPUÉS: " . session_status());
            if ($destroy_result) { $response['success'] = true; $response['message'] = 'Sesión cerrada.'; }
            else { $response['success'] = false; $response['message'] = 'Error destruyendo sesión.'; error_log("Fallo en session_destroy() logout."); }
            http_response_code(200);
            break;

        default: /* ... acción POST no reconocida, respuesta 400 como antes ... */ 
            $response['message'] = "Acción POST '{$action}' no reconocida."; http_response_code(400);
            break;
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($action) {
        case 'check_session':
            // ... (código de check_session como antes)
            if (isset($_SESSION['user_id'])) {
                $response['success']=true; $response['is_logged_in']=true; $response['message']='Sesión activa.';
                $response['data'] = [ /* ... datos de $_SESSION para el frontend ... */
                    'user_id'=>$_SESSION['user_id'], 'username'=>$_SESSION['username']??null, 'id_rol'=>$_SESSION['id_rol']??null,
                    'email'=>$_SESSION['email']??null, 'nombre_completo'=>$_SESSION['nombre_completo']??null, 'avatar_url'=>$_SESSION['avatar_url']??null
                ];
                http_response_code(200);
            } else {
                $response['success']=true; $response['is_logged_in']=false; $response['message']='No hay sesión activa.'; http_response_code(200);
            }
            break;
        default: /* ... acción GET no reconocida, respuesta 400 como antes ... */
            $response['message'] = "Acción GET '{$action}' no reconocida."; http_response_code(400);
            break;
    }
} else { /* ... método HTTP no soportado, respuesta 405 como antes ... */
    $response['message'] = "Método HTTP '" . $_SERVER['REQUEST_METHOD'] . "' no soportado."; http_response_code(405);
}

echo json_encode($response);
exit;
?>