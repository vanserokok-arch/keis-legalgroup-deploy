<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$cacheFile = __DIR__ . '/.cache/news.json';
$publicFile = __DIR__ . '/news.json';
$lockFile = __DIR__ . '/.cache/refresh.lock';
$logFile = __DIR__ . '/.cache/news-refresh.log';
$startedAt = microtime(true);

if (!is_dir(dirname($lockFile))) {
    @mkdir(dirname($lockFile), 0755, true);
}

ob_start();

register_shutdown_function(static function () use ($logFile, $startedAt): void {
    $body = ob_get_contents();
    $decoded = is_string($body) && $body !== '' ? json_decode($body, true) : null;
    $items = is_array($decoded) && isset($decoded['items']) && is_array($decoded['items'])
        ? count($decoded['items'])
        : 0;
    $errors = is_array($decoded) && isset($decoded['errors']) && is_array($decoded['errors'])
        ? count($decoded['errors'])
        : 0;
    $fallback = is_array($decoded) && !empty($decoded['staleFallbackUsed']) ? 'yes' : 'no';
    $statusCode = http_response_code();
    if (!is_int($statusCode) || $statusCode < 100) {
        $statusCode = 200;
    }
    $line = sprintf(
        "[%s] status=%d items=%d errors=%d staleFallback=%s duration=%.2fs\n",
        gmdate('c'),
        $statusCode,
        $items,
        $errors,
        $fallback,
        microtime(true) - $startedAt
    );
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
});

$lockHandle = @fopen($lockFile, 'c');
if (!is_resource($lockHandle)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'lock_open_failed',
        'message' => 'Cannot open refresh lock file.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!@flock($lockHandle, LOCK_EX | LOCK_NB)) {
    $fallback = '';
    if (is_file($cacheFile)) {
        $fallback = (string) @file_get_contents($cacheFile);
    }
    if ($fallback === '' && is_file($publicFile)) {
        $fallback = (string) @file_get_contents($publicFile);
    }
    if ($fallback !== '') {
        echo $fallback;
        exit;
    }
    http_response_code(409);
    echo json_encode([
        'error' => 'refresh_in_progress',
        'message' => 'Another refresh process is running.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

register_shutdown_function(static function () use ($lockHandle): void {
    @flock($lockHandle, LOCK_UN);
    @fclose($lockHandle);
});

if (PHP_SAPI === 'cli') {
    $argv = $_SERVER['argv'] ?? [];
    if (isset($argv[1]) && is_string($argv[1]) && trim($argv[1]) !== '') {
        $_GET['token'] = trim($argv[1]);
    }
}

$_GET['force'] = '1';
require __DIR__ . '/proxy.php';
