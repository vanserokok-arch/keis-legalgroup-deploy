<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
// Allow same-origin XHR/fetch; adjust if you need a stricter policy.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight (in case some clients use fetch)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function respond(int $code, array $payload): void {
  http_response_code($code);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function pick_post_value(array $keys, int $maxLength = 1000): string {
  foreach ($keys as $key) {
    if (!isset($_POST[$key])) {
      continue;
    }

    $value = trim((string)$_POST[$key]);
    if ($value === '') {
      continue;
    }

    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = preg_replace('/[ \t]{2,}/u', ' ', $value) ?? $value;
    $value = preg_replace("/\n{3,}/u", "\n\n", $value) ?? $value;
    $value = trim($value);

    if ($value === '') {
      continue;
    }

    if (function_exists('mb_substr')) {
      return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
  }

  return '';
}

function safe_url(string $value): string {
  if ($value === '') {
    return '';
  }

  $parts = parse_url($value);
  if (!is_array($parts) || empty($parts['scheme']) || empty($parts['host'])) {
    return '';
  }

  if (!in_array(strtolower((string)$parts['scheme']), ['http', 'https'], true)) {
    return '';
  }

  return $value;
}

function load_telegram_config(): array {
  $path = __DIR__ . '/telegram.config.php';
  if (!is_readable($path)) {
    return [];
  }

  $config = require $path;
  return is_array($config) ? $config : [];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

// Honeypot (optional)
$honeypot = (string)($_POST['website'] ?? '');
if ($honeypot !== '') {
  respond(200, ['ok' => true]);
}

// Fields (support multiple names from different forms)
$name  = pick_post_value(['name', 'fullname', 'your_name', 'username'], 120);
$phone = pick_post_value(['phone', 'tel', 'phone_number'], 80);
$text  = pick_post_value(['message', 'question', 'text', 'comment', 'situation'], 1800);
$page  = pick_post_value(['page', 'page_title'], 180);
$pageUrl = safe_url(pick_post_value(['page_url', 'url'], 500));

if ($pageUrl === '' && !empty($_SERVER['HTTP_REFERER'])) {
  $pageUrl = safe_url((string)$_SERVER['HTTP_REFERER']);
}

if ($name === '' && $phone === '' && $text === '') {
  respond(400, ['ok' => false, 'error' => 'empty_payload']);
}

$telegramConfig = load_telegram_config();
$BOT_TOKEN = (string)(getenv('TELEGRAM_BOT_TOKEN') ?: ($_SERVER['TELEGRAM_BOT_TOKEN'] ?? ($telegramConfig['bot_token'] ?? '')));
$CHAT_ID   = (string)(getenv('TELEGRAM_CHAT_ID') ?: ($_SERVER['TELEGRAM_CHAT_ID'] ?? ($telegramConfig['chat_id'] ?? '')));

if ($BOT_TOKEN === '' || $CHAT_ID === '') {
  respond(500, ['ok' => false, 'error' => 'Telegram is not configured']);
}

if (!function_exists('curl_init')) {
  respond(500, ['ok' => false, 'error' => 'curl_not_available']);
}

$parts = [];
$parts[] = "🧾 Новая заявка с сайта";
if ($page !== '') $parts[] = "📄 Страница: {$page}";
if ($pageUrl !== '') $parts[] = "🌐 URL: {$pageUrl}";
if ($name  !== '') $parts[] = "👤 Имя: {$name}";
if ($phone !== '') $parts[] = "📞 Телефон: {$phone}";
if ($text  !== '') $parts[] = "📝 Сообщение: {$text}";
$parts[] = '⏱ ' . date('Y-m-d H:i:s');

$msg = implode("\n", $parts);

// SendMessage
$url = 'https://api.telegram.org/bot' . $BOT_TOKEN . '/sendMessage';
$post = http_build_query([
  'chat_id' => $CHAT_ID,
  'text' => $msg,
  'disable_web_page_preview' => true,
]);

$ch = curl_init($url);
if ($ch === false) {
  respond(500, ['ok' => false, 'error' => 'curl_init_failed']);
}

curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => $post,
  CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
  CURLOPT_CONNECTTIMEOUT => 5,
  CURLOPT_TIMEOUT => 10,
]);

$raw = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = $raw === false ? curl_error($ch) : '';
if (PHP_VERSION_ID < 80000) {
  curl_close($ch);
}

if ($raw === false) {
  if ($curlError !== '') {
    error_log('Telegram cURL error: ' . $curlError);
  }

  respond(502, ['ok' => false, 'error' => 'curl_error']);
}

$json = json_decode($raw, true);
if (!is_array($json)) {
  respond(502, ['ok' => false, 'error' => 'bad_json', 'http_code' => $code]);
}

if (($json['ok'] ?? false) !== true) {
  respond(502, ['ok' => false, 'error' => 'tg_send_failed', 'http_code' => $code]);
}

respond(200, ['ok' => true]);
