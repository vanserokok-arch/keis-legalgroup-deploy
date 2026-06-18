<?php
declare(strict_types=1);

if (isset($_GET['ajax']) && (string) $_GET['ajax'] === '1') {
  header('Content-Type: application/json; charset=utf-8');

  $cacheFile = __DIR__ . '/.cache/news.json';
  $publicFile = __DIR__ . '/news.json';
  $json = null;

  if (is_file($cacheFile)) {
    $json = @file_get_contents($cacheFile);
  }
  if (!$json && is_file($publicFile)) {
    $json = @file_get_contents($publicFile);
  }

  if (!is_string($json) || $json === '') {
    echo json_encode(['items' => []], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }

  $data = json_decode($json, true);
  if (!is_array($data)) {
    echo json_encode(['items' => []], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }

  $items = (isset($data['items']) && is_array($data['items'])) ? $data['items'] : [];
  $sourceStatuses = (isset($data['sourceStatuses']) && is_array($data['sourceStatuses'])) ? $data['sourceStatuses'] : [];
  $q = isset($_GET['q']) ? trim((string) $_GET['q']) : '';
  $source = isset($_GET['source']) ? trim((string) $_GET['source']) : '';

  if ($q !== '' || ($source !== '' && $source !== 'all')) {
    $items = array_values(array_filter($items, function ($item) use ($q, $source) {
      $title = isset($item['title']) ? (string) $item['title'] : '';
      $titleOk = $q === '' || (stripos($title, $q) !== false);
      $itemSource = isset($item['source']) ? trim((string) $item['source']) : '';
      $sourceOk = $source === '' || $source === 'all' || $itemSource === $source;
      return $titleOk && $sourceOk;
    }));
  }

  echo json_encode([
    'items' => $items,
    'sourceStatuses' => $sourceStatuses,
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/index.html');
exit;

