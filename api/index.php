<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/common.php';

$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH);
$path = rtrim($path, '/');
$parts = explode('/', $path);
$endpoint = end($parts);

switch ($endpoint) {
    case 'login':
        handle_login();
        break;
    case 'logout':
        handle_logout();
        break;
    case 'content':
        handle_content();
        break;
    case 'upload':
        handle_upload();
        break;
    default:
        http_response_code(404);
        echo json_encode(['detail' => 'API endpoint not found: ' . $endpoint], JSON_UNESCAPED_UNICODE);
        break;
}
