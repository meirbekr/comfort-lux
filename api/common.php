<?php
// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.gc_maxlifetime', '86400');
    session_set_cookie_params([
        'lifetime' => 86400,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

function get_env_var($key, $default = '') {
    static $env = null;
    if ($env === null) {
        $env = [];
        $envFile = dirname(__DIR__) . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line !== '' && strpos($line, '#') !== 0 && strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line, 2);
                    $env[trim($k)] = trim($v);
                }
            }
        }
    }
    if (isset($env[$key])) {
        return $env[$key];
    }
    $val = getenv($key);
    return ($val !== false && $val !== '') ? $val : $default;
}

function get_admin_user() {
    return get_env_var('ADMIN_USER', 'admin');
}

function get_admin_pass() {
    return get_env_var('ADMIN_PASS', 'admin123');
}

function is_authenticated() {
    return !empty($_SESSION['admin_user']);
}

function require_auth() {
    if (!is_authenticated()) {
        http_response_code(401);
        echo json_encode(['detail' => 'Необходима авторизация'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

function handle_login() {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    $login = isset($input['login']) ? trim($input['login']) : '';
    $pass = isset($input['password']) ? trim($input['password']) : '';

    if ($login !== '' && $login === get_admin_user() && $pass === get_admin_pass()) {
        $_SESSION['admin_user'] = $login;
        echo json_encode(['status' => 'ok', 'message' => 'Авторизация успешна'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(401);
    echo json_encode(['detail' => 'Неверный логин или пароль'], JSON_UNESCAPED_UNICODE);
    exit;
}

function handle_logout() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode(['status' => 'ok', 'message' => 'Сессия завершена'], JSON_UNESCAPED_UNICODE);
    exit;
}

function handle_content() {
    require_auth();
    $contentFile = dirname(__DIR__) . '/content.json';

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!file_exists($contentFile)) {
            http_response_code(404);
            echo json_encode(['detail' => 'Файл content.json не найден'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        readfile($contentFile);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        if ($decoded === null) {
            http_response_code(400);
            echo json_encode(['detail' => 'Некорректный JSON'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $pretty = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $saved = file_put_contents($contentFile, $pretty);
        if ($saved === false) {
            http_response_code(500);
            echo json_encode(['detail' => 'Не удалось сохранить файл content.json. Проверьте права на запись.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(['status' => 'ok', 'message' => 'Контент успешно сохранен'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(405);
    echo json_encode(['detail' => 'Метод не поддерживается'], JSON_UNESCAPED_UNICODE);
    exit;
}

function handle_upload() {
    require_auth();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['detail' => 'Файл не передан'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(500);
        echo json_encode(['detail' => 'Ошибка при загрузке файла: код ' . $file['error']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov', 'svg'];
    $origName = $file['name'];
    $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

    if (!in_array($ext, $allowedExts, true)) {
        http_response_code(400);
        echo json_encode(['detail' => 'Неподдерживаемый формат файла. Разрешены: ' . implode(', ', $allowedExts)], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $uploadDir = dirname(__DIR__) . '/assets/uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $origName);
    $prefix = substr(bin2hex(random_bytes(5)), 0, 10);
    $newFilename = $prefix . '_' . $safeName;
    $targetPath = $uploadDir . '/' . $newFilename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        http_response_code(500);
        echo json_encode(['detail' => 'Не удалось сохранить загруженный файл. Проверьте права на папку assets/uploads.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['status' => 'ok', 'url' => './assets/uploads/' . $newFilename], JSON_UNESCAPED_UNICODE);
    exit;
}
