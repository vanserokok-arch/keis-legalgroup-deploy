<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
set_time_limit(90);

const NEWS_LIMIT = 40;
const NEWS_MIN_ITEMS_PER_SOURCE = 3;
const HTML_LIST_LIMIT = 20;
const CACHE_LIFETIME = 10800; // 3 hours
const DEFAULT_IMAGE = '../assets/def.png';
const USER_AGENT = 'KEIS-NewsAggregator/2.0 (+https://keis.example)';
const DISPLAY_TIMEZONE = 'Europe/Moscow';

$cacheDir = __DIR__ . '/.cache';
$cacheFile = $cacheDir . '/news.json';
$publicNewsFile = __DIR__ . '/news.json';
$notesFile = __DIR__ . '/keis_notes.json';
$forceRefresh = isset($_GET['force']) && (string) $_GET['force'] === '1';
$isCli = PHP_SAPI === 'cli';
$forceToken = isset($_GET['token']) ? trim((string) $_GET['token']) : '';

if ($forceRefresh && !$isCli) {
    $expectedToken = getenv('NEWS_REFRESH_TOKEN');
    if (!is_string($expectedToken) || trim($expectedToken) === '') {
        http_response_code(403);
        echo json_encode([
            'error' => 'force_refresh_forbidden',
            'message' => 'Force refresh requires NEWS_REFRESH_TOKEN on server.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    if (!hash_equals(trim($expectedToken), $forceToken)) {
        http_response_code(403);
        echo json_encode([
            'error' => 'invalid_force_token',
            'message' => 'Invalid token for force refresh.',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$lastGoodPayload = loadExistingPayload($cacheFile, $publicNewsFile);

if (!$forceRefresh && is_file($cacheFile)) {
    $age = time() - (int) filemtime($cacheFile);
    if ($age >= 0 && $age < CACHE_LIFETIME) {
        $cached = file_get_contents($cacheFile);
        if (is_string($cached) && $cached !== '') {
            echo $cached;
            exit;
        }
    }
}

$sources = [
    [
        'id' => 'consultant',
        'name' => 'КонсультантПлюс',
        'type' => 'rss',
        'url' => 'https://www.consultant.ru/rss/nw.xml',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://www.consultant.ru/rss/nw.xml',
        ],
        'enabled' => true,
    ],
    [
        'id' => 'pravo',
        'name' => 'Право.ru',
        'type' => 'rss',
        'url' => 'https://pravo.ru/rss/',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://pravo.ru/rss/',
        ],
        'enabled' => true,
    ],
    [
        'id' => 'duma',
        'name' => 'Госдума',
        'type' => 'official_rss_or_json',
        'url' => 'https://duma.gov.ru/rss/news.xml',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://duma.gov.ru/news/',
            'https://r.jina.ai/http://https://duma.gov.ru/news/duma/',
        ],
        'enabled' => true,
    ],
    [
        'id' => 'cbr_news',
        'name' => 'ЦБ',
        'type' => 'rss',
        'url' => 'https://www.cbr.ru/rss/RssNews',
        'enabled' => true,
    ],
    [
        'id' => 'cbr_press',
        'name' => 'ЦБ',
        'type' => 'rss',
        'url' => 'https://www.cbr.ru/rss/RssPress',
        'enabled' => true,
    ],
    [
        'id' => 'rkn',
        'name' => 'Роскомнадзор',
        'type' => 'auto_rss_or_html_list',
        'url' => 'https://rkn.gov.ru/',
        'htmlUrl' => 'https://rkn.gov.ru/news/',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://t.me/s/rkn_tg',
        ],
        'enabled' => true,
    ],
    [
        'id' => 'vsrf',
        'name' => 'Верховный Суд РФ',
        'type' => 'auto_rss_or_html_list',
        'url' => 'https://vsrf.ru/',
        'htmlUrl' => 'https://vsrf.ru/press_center/news/',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://vsrf.ru/press_center/news/',
            'https://r.jina.ai/http://https://vsrf.ru/press_center/mass_media/',
        ],
        'enabled' => true,
    ],
    [
        'id' => 'ksrf',
        'name' => 'Конституционный Суд РФ',
        'type' => 'auto_rss_or_html_list',
        'url' => 'https://ksrf.ru/',
        'htmlUrl' => 'https://ksrf.ru/ru/News/Pages/default.aspx',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://www.ksrf.ru/news/',
        ],
        'enabled' => true,
    ],
    [
        'id' => 'genproc',
        'name' => 'Генпрокуратура',
        'type' => 'auto_rss_or_html_list',
        'url' => 'https://epp.genproc.gov.ru/',
        'htmlUrl' => 'https://epp.genproc.gov.ru/web/gprf/mass-media/news',
        'fallbackUrls' => [
            'https://r.jina.ai/http://https://epp.genproc.gov.ru/web/gprf/mass-media/news',
        ],
        'enabled' => true,
    ],
];
$sources = resolveAutoSources($sources);

$notesState = loadKeisNotes($notesFile);
$sourceStatuses = [];
$collected = [];
$responses = fetchSourcesParallel($sources);

foreach ($sources as $source) {
    $sourceId = (string) $source['id'];
    $sourceName = (string) $source['name'];

    if (empty($source['enabled'])) {
        $sourceStatuses[$sourceId] = [
            'name' => $sourceName,
            'status' => 'disabled',
            'reason' => 'source_disabled',
            'items' => 0,
            'url' => (string) $source['url'],
        ];
        continue;
    }

    $response = $responses[$sourceId] ?? null;
    if (!is_array($response) || !($response['ok'] ?? false)) {
        $fallbackResponse = fetchSourceFallbackResponse($source, $response);
        if (is_array($fallbackResponse) && ($fallbackResponse['ok'] ?? false)) {
            $response = $fallbackResponse;
        }
    }

    if (!is_array($response) || !($response['ok'] ?? false)) {
        $status = 'error';
        $reason = (string) ($response['reason'] ?? 'request_failed');
        if ($sourceId === 'duma') {
            $status = 'disabled';
            $reason = 'official_feed_unavailable';
        }
        $sourceStatuses[$sourceId] = [
            'name' => $sourceName,
            'status' => $status,
            'reason' => $reason,
            'items' => 0,
            'url' => (string) $source['url'],
            'httpCode' => (int) ($response['httpCode'] ?? 0),
            'effectiveUrl' => (string) ($response['effectiveUrl'] ?? ''),
            'bytes' => (int) ($response['bytes'] ?? 0),
            'curlErrNo' => (int) ($response['curlErrNo'] ?? 0),
            'curlErr' => (string) ($response['curlErr'] ?? ''),
        ];
        continue;
    }

    $body = (string) ($response['body'] ?? '');
    $htmlIssue = '';
    if ((string) ($source['type'] ?? '') === 'html_list') {
        $htmlIssue = detectHtmlResponseIssue($body, $sourceId);
        if ($htmlIssue === 'blocked_or_empty_html') {
            $sourceStatuses[$sourceId] = [
                'name' => $sourceName,
                'status' => 'error',
                'reason' => 'blocked',
                'items' => 0,
                'url' => (string) $source['url'],
                'httpCode' => (int) ($response['httpCode'] ?? 0),
                'effectiveUrl' => (string) ($response['effectiveUrl'] ?? ''),
                'bytes' => (int) ($response['bytes'] ?? 0),
                'contentType' => (string) ($response['contentType'] ?? ''),
            ];
            continue;
        }
    }

    try {
        $parseSource = $source;
        if (isset($response['parseType']) && is_string($response['parseType']) && $response['parseType'] !== '') {
            $parseSource['type'] = $response['parseType'];
        }
        if (isset($response['effectiveUrl']) && is_string($response['effectiveUrl']) && $response['effectiveUrl'] !== '') {
            $parseSource['url'] = $response['effectiveUrl'];
        }
        $items = parseSourceItems($parseSource, $body);
        if (empty($items)) {
            $fallbackResponse = fetchSourceFallbackResponse($source, $response);
            if (is_array($fallbackResponse) && ($fallbackResponse['ok'] ?? false)) {
                $fallbackParseSource = $source;
                if (isset($fallbackResponse['parseType']) && is_string($fallbackResponse['parseType']) && $fallbackResponse['parseType'] !== '') {
                    $fallbackParseSource['type'] = $fallbackResponse['parseType'];
                }
                if (isset($fallbackResponse['effectiveUrl']) && is_string($fallbackResponse['effectiveUrl']) && $fallbackResponse['effectiveUrl'] !== '') {
                    $fallbackParseSource['url'] = $fallbackResponse['effectiveUrl'];
                }
                $fallbackItems = parseSourceItems($fallbackParseSource, (string) ($fallbackResponse['body'] ?? ''));
                if (!empty($fallbackItems)) {
                    $items = $fallbackItems;
                    $response = $fallbackResponse;
                    $body = (string) ($fallbackResponse['body'] ?? '');
                }
            }
        }
        if (empty($items)) {
            $emptyReason = $htmlIssue !== '' ? $htmlIssue : 'empty';
            if ($emptyReason === 'blocked_or_empty_html') {
                $emptyReason = 'blocked';
            } elseif ($emptyReason !== 'empty_html') {
                $emptyReason = 'empty';
            }
            $sourceStatuses[$sourceId] = [
                'name' => $sourceName,
                'status' => 'empty',
                'reason' => $emptyReason,
                'items' => 0,
                'url' => (string) $source['url'],
                'httpCode' => (int) ($response['httpCode'] ?? 0),
                'effectiveUrl' => (string) ($response['effectiveUrl'] ?? ''),
                'bytes' => (int) ($response['bytes'] ?? 0),
            ];
            continue;
        }

        foreach ($items as $item) {
            $keisNoteAuto = generateKeisNoteAuto($item['title'], $item['summary']);
            $override = resolveKeisOverride($item, $notesState['byId'], $notesState['byUrl']);
            $item['keisNoteAuto'] = $keisNoteAuto;
            $item['keisNote'] = $override !== '' ? $override : $keisNoteAuto;
            $collected[] = $item;
        }

        $sourceStatuses[$sourceId] = [
            'name' => $sourceName,
            'status' => 'ok',
            'reason' => '',
            'items' => count($items),
            'url' => (string) $source['url'],
            'httpCode' => (int) ($response['httpCode'] ?? 0),
            'effectiveUrl' => (string) ($response['effectiveUrl'] ?? ''),
            'bytes' => (int) ($response['bytes'] ?? 0),
            'contentType' => (string) ($response['contentType'] ?? ''),
        ];
    } catch (Throwable $e) {
        $reason = $e->getMessage() !== '' ? $e->getMessage() : 'parse_failed';
        if (!in_array($reason, ['parse_failed', 'invalid_feed', 'unsupported_format', 'empty_html'], true)) {
            $reason = 'parse_failed';
        }
        $status = 'error';
        if ($sourceId === 'duma' && ($reason === 'invalid_feed' || $reason === 'unsupported_format')) {
            $reason = 'official_feed_unavailable';
            $status = 'disabled';
        }
        $sourceStatuses[$sourceId] = [
            'name' => $sourceName,
            'status' => $status,
            'reason' => $reason,
            'items' => 0,
            'url' => (string) $source['url'],
            'httpCode' => (int) ($response['httpCode'] ?? 0),
            'effectiveUrl' => (string) ($response['effectiveUrl'] ?? ''),
            'bytes' => (int) ($response['bytes'] ?? 0),
        ];
    }
}

$deduped = keepSourceFloorBeforeGlobalLimit(deduplicateByCanonicalUrl($collected), NEWS_MIN_ITEMS_PER_SOURCE, NEWS_LIMIT);
usort($deduped, static function (array $a, array $b): int {
    return ((int) ($b['dateTs'] ?? $b['_timestamp'] ?? 0)) <=> ((int) ($a['dateTs'] ?? $a['_timestamp'] ?? 0));
});
$deduped = array_slice($deduped, 0, NEWS_LIMIT);

$items = [];
foreach ($deduped as $item) {
    $item['dateTs'] = (int) ($item['_timestamp'] ?? 0);
    unset($item['_timestamp'], $item['_canonicalUrl']);
    $items[] = $item;
}

$staleFallbackUsed = false;
$lastGoodItems = [];
if (is_array($lastGoodPayload) && isset($lastGoodPayload['items']) && is_array($lastGoodPayload['items'])) {
    $lastGoodItems = $lastGoodPayload['items'];
}
if (count($items) === 0 && count($lastGoodItems) > 0) {
    $items = array_slice($lastGoodItems, 0, NEWS_LIMIT);
    $staleFallbackUsed = true;
}

$errors = [];
foreach ($sourceStatuses as $sid => $st) {
    $s = $st['status'] ?? '';
    if ($s === 'error' || $s === 'warning') {
        $name = $st['name'] ?? $sid;
        $reason = (string) ($st['reason'] ?? $st['message'] ?? 'unknown');
        $errors[] = $name . ': ' . $reason;
    }
}

$payload = [
    'items' => $items,
    'sourceStatuses' => $sourceStatuses,
    'sourcesStatus' => $sourceStatuses,
    'generatedAtISO' => gmdate('c'),
    'generatedAt' => gmdate('Y-m-d H:i:s'),
    'errors' => $errors,
    'staleFallbackUsed' => $staleFallbackUsed,
];

if ($staleFallbackUsed) {
    $payload['sourceStatuses']['systemStaleFallback'] = [
        'name' => 'fallback',
        'status' => 'warning',
        'reason' => 'last_good_cache_used',
        'items' => count($items),
        'url' => 'local',
    ];
    $payload['sourcesStatus']['systemStaleFallback'] = $payload['sourceStatuses']['systemStaleFallback'];
}

if (!$notesState['valid']) {
    $payload['sourceStatuses']['keisNotes'] = [
        'name' => 'keis_notes.json',
        'status' => 'error',
        'reason' => 'invalid_json',
        'items' => 0,
        'url' => 'local',
    ];
    $payload['sourcesStatus']['keisNotes'] = [
        'name' => 'keis_notes.json',
        'status' => 'error',
        'reason' => 'invalid_json',
        'items' => 0,
        'url' => 'local',
    ];
}

$json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'encode_failed',
        'message' => 'Не удалось сформировать JSON ответ.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

@file_put_contents($cacheFile, $json, LOCK_EX);

$publicWriteError = '';
if (!writeJsonAtomically($publicNewsFile, $json, $publicWriteError)) {
    $warningMessage = 'Не удалось обновить /news/news.json: ' . ($publicWriteError !== '' ? $publicWriteError : 'write_failed');
    $payload['sourceStatuses']['systemNewsJsonWrite'] = [
        'name' => 'news.json',
        'status' => 'warning',
        'reason' => 'write_failed',
        'items' => 0,
        'url' => 'local',
        'message' => $warningMessage,
    ];
    $payload['sourcesStatus']['systemNewsJsonWrite'] = $payload['sourceStatuses']['systemNewsJsonWrite'];
    $payload['systemStatus'] = [
        'status' => 'warning',
        'warnings' => [$warningMessage],
    ];

    $warningJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($warningJson !== false) {
        $json = $warningJson;
        @file_put_contents($cacheFile, $json, LOCK_EX);
    }
}

echo $json;
exit;

function loadExistingPayload(string $cacheFile, string $publicFile): ?array
{
    $candidates = [$cacheFile, $publicFile];
    foreach ($candidates as $file) {
        if (!is_file($file)) {
            continue;
        }
        $raw = @file_get_contents($file);
        if (!is_string($raw) || $raw === '') {
            continue;
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            continue;
        }
        if (!isset($decoded['items']) || !is_array($decoded['items'])) {
            continue;
        }
        return $decoded;
    }
    return null;
}

function writeJsonAtomically(string $targetFile, string $json, string &$error = ''): bool
{
    $error = '';
    $dir = dirname($targetFile);
    if (!is_dir($dir)) {
        $error = 'target_dir_missing';
        return false;
    }

    $tmpFile = tempnam($dir, 'news-json-');
    if (!is_string($tmpFile) || $tmpFile === '') {
        $error = 'tempnam_failed';
        return false;
    }

    $bytes = @file_put_contents($tmpFile, $json, LOCK_EX);
    if ($bytes === false) {
        @unlink($tmpFile);
        $error = 'write_temp_failed';
        return false;
    }

    @chmod($tmpFile, 0644);

    if (!@rename($tmpFile, $targetFile)) {
        $last = error_get_last();
        $error = is_array($last) && isset($last['message']) ? (string) $last['message'] : 'rename_failed';
        @unlink($tmpFile);
        return false;
    }

    return true;
}

function fetchSourcesParallel(array $sources): array
{
    $multi = curl_multi_init();
    $handles = [];
    $sourceById = [];
    $responses = [];
    $startedAt = microtime(true);
    $overallDeadlineSec = 20.0;
    $deadlineReached = false;

    foreach ($sources as $source) {
        if (empty($source['enabled'])) {
            continue;
        }
        $url = (string) ($source['url'] ?? '');
        if ($url === '') {
            continue;
        }

        $connectTimeout = (int) ($source['connectTimeout'] ?? 6);
        $timeout = (int) ($source['timeout'] ?? 13);
        if ($connectTimeout <= 0) {
            $connectTimeout = 6;
        }
        if ($timeout <= 0) {
            $timeout = 13;
        }
        if ($connectTimeout < 5) {
            $connectTimeout = 5;
        } elseif ($connectTimeout > 7) {
            $connectTimeout = 7;
        }
        if ($timeout < 12) {
            $timeout = 12;
        } elseif ($timeout > 15) {
            $timeout = 15;
        }

        $acceptHeader = resolveAcceptHeaderBySourceType((string) ($source['type'] ?? ''));
        $baseUrl = (string) ($source['url'] ?? '');
        $baseHost = parse_url($baseUrl, PHP_URL_HOST);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 8,
            CURLOPT_CONNECTTIMEOUT => $connectTimeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => USER_AGENT,
            CURLOPT_HTTPHEADER => [
                'Accept: ' . $acceptHeader,
                'Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.7,en;q=0.5',
                'Connection: close',
            ],
            CURLOPT_ENCODING => '',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        ]);
        if (is_string($baseHost) && $baseHost !== '') {
            curl_setopt($ch, CURLOPT_REFERER, 'https://' . $baseHost . '/');
        }

        $id = (string) $source['id'];
        $handles[$id] = $ch;
        $sourceById[$id] = $source;
        curl_multi_add_handle($multi, $ch);
    }

    do {
        $status = curl_multi_exec($multi, $running);
        if ($status > CURLM_OK) {
            break;
        }
        if ($running > 0) {
            $selected = curl_multi_select($multi, 1.0);
            if ($selected === -1) {
                usleep(100000);
            }
        }
        if ((microtime(true) - $startedAt) > $overallDeadlineSec) {
            $deadlineReached = true;
            break;
        }
    } while ($running > 0);

    foreach ($handles as $sourceId => $ch) {
        $body = curl_multi_getcontent($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErrNo = curl_errno($ch);
        $curlErr = curl_error($ch);
        $effectiveUrl = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        $contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $bytes = is_string($body) ? strlen($body) : 0;

        $ok = $curlErrNo === 0 && $httpCode >= 200 && $httpCode < 400 && is_string($body) && trim($body) !== '';
        $reason = classifyFetchFailureReason(
            $ok,
            $curlErrNo,
            $curlErr,
            $httpCode,
            (string) $body,
            $contentType,
            $deadlineReached,
            (string) ($sourceById[$sourceId]['type'] ?? '')
        );

        $responses[$sourceId] = [
            'ok' => $ok,
            'body' => $ok ? (string) $body : '',
            'reason' => $reason,
            'httpCode' => $httpCode,
            'curlErrNo' => $curlErrNo,
            'curlErr' => $curlErr,
            'effectiveUrl' => $effectiveUrl,
            'contentType' => $contentType,
            'bytes' => $bytes,
        ];

        curl_multi_remove_handle($multi, $ch);
    }

    curl_multi_close($multi);
    return $responses;
}

function parseSourceItems(array $source, string $body): array
{
    $type = (string) ($source['type'] ?? '');
    $sourceName = (string) ($source['name'] ?? 'Источник');
    $sourceId = (string) ($source['id'] ?? 'source');
    $sourceUrl = (string) ($source['url'] ?? '');

    if ($type === 'rss') {
        return parseRssItems($body, $sourceName, $sourceId, $sourceUrl);
    }

    if ($type === 'official_rss_or_json') {
        $trimmed = ltrim($body);
        if ($trimmed === '') {
            throw new RuntimeException('invalid_feed');
        }
        if ($trimmed[0] === '{' || $trimmed[0] === '[') {
            return parseOfficialJsonItems($body, $sourceName, $sourceId);
        }
        if (isLikelyXml($trimmed)) {
            return parseRssItems($body, $sourceName, $sourceId, $sourceUrl);
        }
        throw new RuntimeException('unsupported_format');
    }

    if ($type === 'html_list') {
        if (trim($body) === '') {
            throw new RuntimeException('empty_html');
        }
        if (in_array($sourceId, ['rkn', 'vsrf', 'ksrf', 'genproc'], true)) {
            return parseOfficialHtmlListBySource($sourceId, $body, $sourceUrl, $sourceName);
        }
        return parseHtmlListItems($source, $body);
    }

    if ($type === 'markdown') {
        return parseMarkdownItems($source, $body);
    }

    throw new RuntimeException('unsupported_source');
}

function fetchSourceFallbackResponse(array $source, ?array $previousResponse = null): ?array
{
    $fallbackUrls = $source['fallbackUrls'] ?? [];
    if (!is_array($fallbackUrls) || empty($fallbackUrls)) {
        return null;
    }

    foreach ($fallbackUrls as $fallbackUrl) {
        $fallbackUrl = trim((string) $fallbackUrl);
        if ($fallbackUrl === '') {
            continue;
        }

        $response = fetchUrl($fallbackUrl, [
            'Accept: text/plain,text/markdown,text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.7,en;q=0.5',
            'Connection: close',
        ], 4, 8);

        $body = (string) ($response['body'] ?? '');
        if (!($response['ok'] ?? false) || isBlockedMarkdownSnapshot($body)) {
            continue;
        }

        $response['parseType'] = str_contains($fallbackUrl, 'r.jina.ai/') ? 'markdown' : (string) ($source['type'] ?? '');
        $response['fallbackFor'] = (string) ($source['url'] ?? '');
        $response['fallbackReason'] = is_array($previousResponse) ? (string) ($previousResponse['reason'] ?? '') : '';
        return $response;
    }

    return null;
}

function isBlockedMarkdownSnapshot(string $body): bool
{
    $lower = mb_strtolower($body);
    return str_contains($lower, 'your request has been blocked')
        || str_contains($lower, 'ваш запрос заблокирован')
        || str_contains($lower, 'forbidden')
        || str_contains($lower, 'navigation timeout')
        || str_contains($lower, 'assertionfailureerror');
}

function parseMarkdownItems(array $source, string $markdown): array
{
    $sourceId = (string) ($source['id'] ?? 'source');
    if ($sourceId === 'genproc') {
        return parseGenprocMarkdownItems($source, $markdown);
    }
    if ($sourceId === 'rkn') {
        return parseTelegramMarkdownItems($source, $markdown);
    }
    if ($sourceId === 'vsrf') {
        return parseVsrfMarkdownItems($source, $markdown);
    }
    return parseGenericMarkdownItems($source, $markdown);
}

function parseGenericMarkdownItems(array $source, string $markdown): array
{
    $sourceName = (string) ($source['name'] ?? 'Источник');
    $sourceId = (string) ($source['id'] ?? 'source');
    $sourceTimezone = getSourceTimezone($sourceId);
    $lines = preg_split('/\R/u', $markdown) ?: [];
    $items = [];
    $seen = [];
    $limit = HTML_LIST_LIMIT;
    $articleTitleLookups = 0;

    $count = count($lines);
    for ($i = 0; $i < $count; $i++) {
        $line = trim($lines[$i]);
        if (!preg_match('/^#{1,4}\s+\[(.*?)\]\((https?:\/\/[^)]+)\)/u', $line, $m)) {
            continue;
        }

        $title = cleanText(stripMarkdownInline($m[1]));
        $url = cleanText($m[2]);
        if ($title === '') {
            if ($sourceId === 'pravo' && $articleTitleLookups < NEWS_MIN_ITEMS_PER_SOURCE) {
                $articleTitleLookups++;
                $title = fetchMarkdownArticleTitle($url, $sourceId);
            }
        }
        if ($title === '') {
            $title = fallbackTitleFromUrl($url, $sourceName);
        }
        if ($title === '' || !isAbsoluteHttpUrl($url)) {
            continue;
        }

        $dateRaw = '';
        $summaryParts = [];
        for ($j = $i + 1; $j < min($count, $i + 8); $j++) {
            $candidate = trim($lines[$j]);
            if ($candidate === '') {
                continue;
            }
            if (preg_match('/^#{1,4}\s+\[/u', $candidate)) {
                break;
            }
            if ($dateRaw === '' && looksLikeDateText($candidate)) {
                $dateRaw = $candidate;
                continue;
            }
            if (!str_starts_with($candidate, '[') && !str_starts_with($candidate, 'URL Source:') && !str_starts_with($candidate, 'Markdown Content:')) {
                $summaryParts[] = stripMarkdownInline($candidate);
            }
        }

        $timestamp = $dateRaw !== '' ? parseDateToTimestamp($dateRaw, $sourceTimezone) : 0;
        [$dateISO, $dateHuman] = formatDateForDisplay($timestamp, true);
        $canonical = canonicalizeUrl($url);
        if (isset($seen[$canonical])) {
            continue;
        }
        $seen[$canonical] = true;

        $items[] = buildNewsItem($sourceId, $sourceName, $title, $url, $timestamp, $dateISO, $dateHuman, trimSummary(implode(' ', $summaryParts), 380));
        if (count($items) >= $limit) {
            break;
        }
    }

    return $items;
}

function parseGenprocMarkdownItems(array $source, string $markdown): array
{
    $sourceName = (string) ($source['name'] ?? 'Генпрокуратура');
    $sourceId = (string) ($source['id'] ?? 'genproc');
    $lines = preg_split('/\R/u', $markdown) ?: [];
    $items = [];
    $seen = [];
    $currentDate = '';
    $currentTime = '';

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        if (preg_match('/^#{1,6}\s*(.+)$/u', $line, $m)) {
            $heading = cleanText($m[1]);
            if (looksLikeDateText($heading) || in_array(mb_strtolower($heading), ['сегодня', 'вчера'], true)) {
                $currentDate = $heading;
                $currentTime = '';
            }
            continue;
        }
        if (preg_match('/^\d{1,2}:\d{2}$/u', $line)) {
            $currentTime = $line;
            continue;
        }
        if (!preg_match('/^\[(.+)\]\((https?:\/\/[^)]+)\)/u', $line, $m)) {
            continue;
        }

        $title = cleanText(stripMarkdownInline($m[1]));
        $url = cleanText($m[2]);
        if ($title === '' || !isAcceptedOfficialSourceUrl('genproc', $url)) {
            continue;
        }
        $dateRaw = trim($currentDate . ' ' . $currentTime);
        $timestamp = parseDateToTimestamp($dateRaw, getSourceTimezone($sourceId));
        [$dateISO, $dateHuman] = formatDateForDisplay($timestamp, $currentTime !== '');
        $canonical = canonicalizeUrl($url);
        if (isset($seen[$canonical])) {
            continue;
        }
        $seen[$canonical] = true;
        $items[] = buildNewsItem($sourceId, $sourceName, $title, $url, $timestamp, $dateISO, $dateHuman, '');
        if (count($items) >= HTML_LIST_LIMIT) {
            break;
        }
    }

    return $items;
}

function parseTelegramMarkdownItems(array $source, string $markdown): array
{
    $sourceName = (string) ($source['name'] ?? 'Источник');
    $sourceId = (string) ($source['id'] ?? 'source');
    $items = [];
    $seen = [];

    preg_match_all('/https:\/\/t\.me\/rkn_tg\/\d+/u', $markdown, $matches, PREG_OFFSET_CAPTURE);
    $links = $matches[0] ?? [];

    foreach ($links as $index => $match) {
        $rawUrl = (string) ($match[0] ?? '');
        $start = (int) ($match[1] ?? 0);
        if (!preg_match('/https:\/\/t\.me\/rkn_tg\/(\d+)/u', $rawUrl, $m)) {
            continue;
        }
        $url = 'https://t.me/rkn_tg/' . $m[1];
        $canonical = canonicalizeUrl($url);
        if (isset($seen[$canonical])) {
            continue;
        }

        $nextStart = isset($links[$index + 1][1]) ? (int) $links[$index + 1][1] : strlen($markdown);
        $block = substr($markdown, $start, max(0, $nextStart - $start));
        $text = stripMarkdownInline($block);
        $text = preg_replace('/https?:\/\/\S+/u', ' ', $text) ?? $text;
        $text = preg_replace('/\btg\/\d+\)?/u', ' ', $text) ?? $text;
        $text = preg_replace('/\b(Image|Video)\s+\d+\b/ui', ' ', $text) ?? $text;
        $text = preg_replace('/\bThis media is not supported in your browser\b/ui', ' ', $text) ?? $text;
        $text = preg_replace('/\bVIEW IN TELEGRAM\b/ui', ' ', $text) ?? $text;
        $text = preg_replace('/\bПодписывайтесь\b.*$/uiu', ' ', $text) ?? $text;
        $text = preg_replace('/[❤👍🔥👏😁🤔🤯😱]+\s*\d+/u', ' ', $text) ?? $text;
        $text = preg_replace('/[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}]+/u', ' ', $text) ?? $text;
        $text = preg_replace('/[\x{FE0E}\x{FE0F}]+/u', ' ', $text) ?? $text;
        $text = cleanText($text);
        $sentences = preg_split('/(?<=[.!?])\s+/u', $text) ?: [];
        $title = '';
        foreach ($sentences as $sentence) {
            $sentence = cleanText($sentence);
            if (mb_strlen($sentence) < 28 || !preg_match('/[а-яё]/iu', $sentence) || isRejectedSummaryText($sentence)) {
                continue;
            }
            $title = trimSummary($sentence, 140);
            break;
        }
        if ($title === '') {
            continue;
        }
        $summary = trimSummary($text, 380);
        $seen[$canonical] = true;
        $items[] = buildNewsItem($sourceId, $sourceName, $title, $url, 0, '', 'Дата не указана', $summary);
        if (count($items) >= 8) {
            break;
        }
    }

    return $items;
}

function parseVsrfMarkdownItems(array $source, string $markdown): array
{
    $sourceName = (string) ($source['name'] ?? 'Верховный Суд РФ');
    $sourceId = (string) ($source['id'] ?? 'vsrf');
    $items = [];
    $seen = [];

    preg_match_all('/\[(.*?)\]\((https:\/\/vsrf\.ru\/press_center\/(?:news|mass_media)\/\d+\/)\)/u', $markdown, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $title = cleanText(stripMarkdownInline((string) ($match[1] ?? '')));
        $url = cleanText((string) ($match[2] ?? ''));
        if ($title === '' || str_starts_with($title, 'Image ') || !isAcceptedOfficialSourceUrl($sourceId, $url)) {
            continue;
        }
        $canonical = canonicalizeUrl($url);
        if (isset($seen[$canonical])) {
            continue;
        }

        $seen[$canonical] = true;
        $items[] = buildNewsItem($sourceId, $sourceName, $title, $url, 0, '', 'Дата не указана', '');
        if (count($items) >= HTML_LIST_LIMIT) {
            break;
        }
    }

    return $items;
}

function buildNewsItem(string $sourceId, string $sourceName, string $title, string $url, int $timestamp, string $dateISO, string $dateHuman, string $summary): array
{
    $canonical = canonicalizeUrl($url);
    return [
        'id' => makeNewsId($sourceId, $canonical),
        'title' => $title,
        'url' => $url,
        'dateISO' => $dateISO,
        'dateHuman' => $dateHuman !== '' ? $dateHuman : 'Дата не указана',
        'dateTs' => $timestamp,
        'source' => $sourceName,
        'summary' => trimSummary($summary, 380),
        'image' => DEFAULT_IMAGE,
        'keisNote' => '',
        'keisNoteAuto' => '',
        '_timestamp' => $timestamp,
        '_canonicalUrl' => $canonical,
    ];
}

function parseRssItems(string $xmlString, string $sourceName, string $sourceId, string $baseUrl = ''): array
{
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlString);
    if ($xml === false) {
        throw new RuntimeException('invalid_feed');
    }

    $nodes = [];
    if (isset($xml->channel->item)) {
        $nodes = $xml->channel->item;
    } elseif (isset($xml->entry)) {
        $nodes = $xml->entry;
    }

    $items = [];
    foreach ($nodes as $node) {
        $title = cleanText((string) ($node->title ?? ''));
        if ($title === '') {
            continue;
        }

        $url = absolutizeUrl(extractRssLink($node), $baseUrl);
        if ($url === '') {
            continue;
        }

        $timestamp = extractRssTimestamp($node, getSourceTimezone($sourceId));
        if ($timestamp <= 0) {
            continue;
        }

        $summary = extractRssSummary($node);
        if ($summary === '' && in_array($sourceId, ['cbr_news', 'cbr_press', 'rkn', 'vsrf', 'ksrf'], true)) {
            $summary = fetchRssPageSummaryWithCache($url, $sourceId);
            if ($summary === '' && in_array($sourceId, ['cbr_news', 'cbr_press'], true) && mb_strlen($title) >= 40) {
                $summary = trimSummary($title, 380);
            }
        }

        $image = extractRssImage($node);
        if ($image === '') {
            $image = DEFAULT_IMAGE;
        }

        $canonical = canonicalizeUrl($url);
        $id = makeNewsId($sourceId, $canonical);
        [$dateISO, $dateHuman] = formatDateForDisplay($timestamp, true);

        $items[] = [
            'id' => $id,
            'title' => $title,
            'url' => $url,
            'dateISO' => $dateISO,
            'dateHuman' => $dateHuman,
            'dateTs' => $timestamp,
            'source' => $sourceName,
            'summary' => trimSummary($summary, 380),
            'image' => $image,
            'keisNote' => '',
            'keisNoteAuto' => '',
            '_timestamp' => $timestamp,
            '_canonicalUrl' => $canonical,
        ];
    }

    return $items;
}

function parseHtmlListItems(array $source, string $html): array
{
    if (trim($html) === '') {
        return [];
    }

    $sourceName = (string) ($source['name'] ?? 'Источник');
    $sourceId = (string) ($source['id'] ?? 'source');
    $baseUrl = (string) ($source['url'] ?? '');
    $sourceTimezone = getSourceTimezone($sourceId);

    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html);
    if (!$loaded) {
        return [];
    }

    $xpath = new DOMXPath($dom);
    $links = $xpath->query('//a[@href]');
    if (!$links instanceof DOMNodeList) {
        return [];
    }

    $items = [];
    $seenUrls = [];
    $limit = (int) ($source['limit'] ?? HTML_LIST_LIMIT);
    if ($limit <= 0) {
        $limit = HTML_LIST_LIMIT;
    }

    foreach ($links as $linkNode) {
        if (!$linkNode instanceof DOMElement) {
            continue;
        }

        $href = cleanText((string) $linkNode->getAttribute('href'));
        $url = absolutizeUrl($href, $baseUrl);
        if (!isAbsoluteHttpUrl($url)) {
            continue;
        }

        $canonical = canonicalizeUrl($url);
        if (isset($seenUrls[$canonical])) {
            continue;
        }

        $title = cleanText($linkNode->textContent);
        if ($title === '') {
            $title = cleanText((string) $linkNode->getAttribute('title'));
        }
        if ($title === '') {
            continue;
        }

        $dateHuman = '';
        $timestamp = 0;
        foreach (extractNearbyDateCandidates($linkNode) as $dateCandidate) {
            $dateCandidate = cleanText($dateCandidate);
            if ($dateCandidate === '') {
                continue;
            }
            $parsedTs = parseDateToTimestamp($dateCandidate, $sourceTimezone);
            if ($parsedTs > 0) {
                $timestamp = $parsedTs;
                [, $dateHuman] = formatDateForDisplay($timestamp, true);
                break;
            }
            if ($dateHuman === '' && looksLikeDateText($dateCandidate)) {
                $dateHuman = $dateCandidate;
            }
        }
        [$dateISO, $dateHumanByTs] = formatDateForDisplay($timestamp, true);
        if ($timestamp > 0) {
            $dateHuman = $dateHumanByTs;
        }

        $seenUrls[$canonical] = true;
        $items[] = [
            'id' => makeNewsId($sourceId, $canonical),
            'title' => $title,
            'url' => $url,
            'dateISO' => $dateISO,
            'dateHuman' => $dateHuman !== '' ? $dateHuman : 'Дата не указана',
            'dateTs' => $timestamp,
            'source' => $sourceName,
            'summary' => '',
            'image' => DEFAULT_IMAGE,
            'keisNote' => '',
            'keisNoteAuto' => '',
            '_timestamp' => $timestamp,
            '_canonicalUrl' => $canonical,
        ];

        if (count($items) >= $limit) {
            break;
        }
    }

    return $items;
}

function parseOfficialHtmlListBySource(string $sourceId, string $html, string $baseUrl, string $sourceName): array
{
    if (trim($html) === '') {
        return [];
    }

    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html);
    if (!$loaded) {
        return [];
    }

    $xpath = new DOMXPath($dom);
    $limit = HTML_LIST_LIMIT;

    $linkQueries = getOfficialSourceLinkQueries($sourceId);
    $dateQueries = getOfficialSourceDateQueries($sourceId);
    $linkNodes = [];
    foreach ($linkQueries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            if ($node instanceof DOMElement) {
                $linkNodes[] = $node;
            }
        }
    }

    $items = [];
    $seenUrls = [];

    foreach ($linkNodes as $linkNode) {
        $href = cleanText((string) $linkNode->getAttribute('href'));
        $url = absolutizeUrl($href, $baseUrl);
        if (!isAbsoluteHttpUrl($url)) {
            continue;
        }
        if (!isAcceptedOfficialSourceUrl($sourceId, $url)) {
            continue;
        }

        $canonical = canonicalizeUrl($url);
        if (isset($seenUrls[$canonical])) {
            continue;
        }

        $title = cleanText($linkNode->textContent);
        if ($title === '') {
            $title = cleanText((string) $linkNode->getAttribute('title'));
        }
        if ($title === '') {
            continue;
        }

        [$timestamp, $dateHuman, $dateISO] = extractDateForOfficialLink($xpath, $linkNode, $dateQueries, $sourceId);
        $summary = extractOfficialSummaryForLink($xpath, $linkNode, $title, $sourceId);

        $seenUrls[$canonical] = true;
        $items[] = [
            'id' => makeNewsId($sourceId, $canonical),
            'title' => $title,
            'url' => $url,
            'dateISO' => $dateISO,
            'dateHuman' => $dateHuman,
            'dateTs' => $timestamp,
            'source' => $sourceName,
            'summary' => $summary,
            'image' => DEFAULT_IMAGE,
            'keisNote' => '',
            'keisNoteAuto' => '',
            '_timestamp' => $timestamp,
            '_canonicalUrl' => $canonical,
        ];

        if (count($items) >= $limit) {
            break;
        }
    }

    if (in_array($sourceId, ['rkn', 'vsrf', 'ksrf', 'genproc'], true) && !empty($items)) {
        $items = enrichOfficialSummariesFromArticlePages($items, $sourceId);
    }

    return $items;
}

function parseOfficialJsonItems(string $json, string $sourceName, string $sourceId): array
{
    $decoded = json_decode($json, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('invalid_feed');
    }

    $candidateLists = [];
    if (array_is_list($decoded)) {
        $candidateLists[] = $decoded;
    } else {
        foreach (['items', 'results', 'news', 'data'] as $key) {
            if (isset($decoded[$key]) && is_array($decoded[$key])) {
                $candidateLists[] = $decoded[$key];
            }
        }
    }

    if (empty($candidateLists)) {
        throw new RuntimeException('unsupported_format');
    }

    $items = [];
    foreach ($candidateLists as $list) {
        foreach ($list as $row) {
            if (!is_array($row)) {
                continue;
            }
            $title = cleanText((string) ($row['title'] ?? $row['name'] ?? ''));
            $url = cleanText((string) ($row['url'] ?? $row['link'] ?? ''));
            $dateRaw = cleanText((string) ($row['date'] ?? $row['published_at'] ?? $row['pubDate'] ?? ''));
            if ($title === '' || $url === '' || $dateRaw === '') {
                continue;
            }

            $timestamp = parseDateToTimestamp($dateRaw, getSourceTimezone($sourceId));
            if ($timestamp <= 0) {
                continue;
            }

            $summary = cleanText((string) ($row['summary'] ?? $row['description'] ?? ''));

            $image = cleanText((string) ($row['image'] ?? $row['image_url'] ?? ''));
            if ($image === '') {
                $image = DEFAULT_IMAGE;
            }

            $canonical = canonicalizeUrl($url);
            $id = makeNewsId($sourceId, $canonical);
            [$dateISO, $dateHuman] = formatDateForDisplay($timestamp, true);
            $items[] = [
                'id' => $id,
                'title' => $title,
                'url' => $url,
                'dateISO' => $dateISO,
                'dateHuman' => $dateHuman,
                'dateTs' => $timestamp,
                'source' => $sourceName,
                'summary' => trimSummary($summary, 380),
                'image' => $image,
                'keisNote' => '',
                'keisNoteAuto' => '',
                '_timestamp' => $timestamp,
                '_canonicalUrl' => $canonical,
            ];
        }
    }

    return $items;
}

function extractRssLink(SimpleXMLElement $node): string
{
    if (isset($node->link)) {
        $linkNode = $node->link;
        $attrs = $linkNode->attributes();
        if ($attrs && isset($attrs['href'])) {
            return cleanText((string) $attrs['href']);
        }
        $textLink = cleanText((string) $linkNode);
        if ($textLink !== '') {
            return $textLink;
        }
    }

    $atomNs = $node->getNamespaces(true);
    if (isset($atomNs['atom'])) {
        $atom = $node->children($atomNs['atom']);
        if (isset($atom->link)) {
            foreach ($atom->link as $link) {
                $attrs = $link->attributes();
                if ($attrs && isset($attrs['href'])) {
                    $value = cleanText((string) $attrs['href']);
                    if ($value !== '') {
                        return $value;
                    }
                }
            }
        }
    }

    return '';
}

function extractRssSummary(SimpleXMLElement $node): string
{
    $namespaces = $node->getNamespaces(true);
    $rawCandidates = [];

    // 1) RSS description
    $rawCandidates[] = (string) ($node->description ?? '');

    // 2) content:encoded
    if (isset($namespaces['content'])) {
        $content = $node->children($namespaces['content']);
        if (isset($content->encoded)) {
            $rawCandidates[] = (string) $content->encoded;
        }
    }
    if (isset($node->{'content:encoded'})) {
        $rawCandidates[] = (string) $node->{'content:encoded'};
    }

    // 3) yandex:full-text
    if (isset($namespaces['yandex'])) {
        $yandex = $node->children($namespaces['yandex']);
        if (isset($yandex->{'full-text'})) {
            $rawCandidates[] = (string) $yandex->{'full-text'};
        }
    }

    // 4) Atom summary
    $rawCandidates[] = (string) ($node->summary ?? '');

    // 5) media:description
    if (isset($namespaces['media'])) {
        $media = $node->children($namespaces['media']);
        if (isset($media->description)) {
            $rawCandidates[] = (string) $media->description;
        }
    }

    foreach ($rawCandidates as $candidate) {
        $summary = normalizeSummaryCandidate($candidate);
        if ($summary !== '' && mb_strlen($summary) >= 40 && !isRejectedSummaryText($summary)) {
            return $summary;
        }
    }

    return '';
}

function extractRssImage(SimpleXMLElement $node): string
{
    if (isset($node->enclosure)) {
        foreach ($node->enclosure as $enclosure) {
            $attrs = $enclosure->attributes();
            if ($attrs && isset($attrs['url'])) {
                $url = cleanText((string) $attrs['url']);
                if ($url !== '') {
                    return $url;
                }
            }
        }
    }

    $namespaces = $node->getNamespaces(true);
    if (isset($namespaces['media'])) {
        $media = $node->children($namespaces['media']);
        if (isset($media->content)) {
            foreach ($media->content as $content) {
                $attrs = $content->attributes();
                if ($attrs && isset($attrs['url'])) {
                    $url = cleanText((string) $attrs['url']);
                    if ($url !== '') {
                        return $url;
                    }
                }
            }
        }
        if (isset($media->thumbnail)) {
            foreach ($media->thumbnail as $thumb) {
                $attrs = $thumb->attributes();
                if ($attrs && isset($attrs['url'])) {
                    $url = cleanText((string) $attrs['url']);
                    if ($url !== '') {
                        return $url;
                    }
                }
            }
        }
    }

    return '';
}

function extractRssTimestamp(SimpleXMLElement $node, ?string $sourceTimezone = null): int
{
    $candidates = [
        (string) ($node->pubDate ?? ''),
        (string) ($node->published ?? ''),
        (string) ($node->updated ?? ''),
        (string) ($node->date ?? ''),
    ];

    $namespaces = $node->getNamespaces(true);
    if (isset($namespaces['dc'])) {
        $dc = $node->children($namespaces['dc']);
        $candidates[] = (string) ($dc->date ?? '');
    }

    foreach ($candidates as $raw) {
        $ts = parseDateToTimestamp(cleanText($raw), $sourceTimezone);
        if ($ts > 0) {
            return $ts;
        }
    }

    return 0;
}

function deduplicateByCanonicalUrl(array $items): array
{
    $byUrl = [];
    foreach ($items as $item) {
        $key = (string) ($item['_canonicalUrl'] ?? canonicalizeUrl((string) ($item['url'] ?? '')));
        if (!isset($byUrl[$key])) {
            $byUrl[$key] = $item;
            continue;
        }

        $current = $byUrl[$key];
        $currentTs = (int) ($current['_timestamp'] ?? 0);
        $incomingTs = (int) ($item['_timestamp'] ?? 0);
        $currentSummaryLen = mb_strlen((string) ($current['summary'] ?? ''));
        $incomingSummaryLen = mb_strlen((string) ($item['summary'] ?? ''));

        if ($incomingTs > $currentTs || ($incomingTs === $currentTs && $incomingSummaryLen > $currentSummaryLen)) {
            $byUrl[$key] = $item;
        }
    }

    return array_values($byUrl);
}

function canonicalizeUrl(string $url): string
{
    $parts = parse_url(trim($url));
    if ($parts === false) {
        return trim($url);
    }

    $scheme = isset($parts['scheme']) ? strtolower((string) $parts['scheme']) : 'https';
    $host = isset($parts['host']) ? strtolower((string) $parts['host']) : '';
    if ($host === '') {
        return trim($url);
    }

    $port = isset($parts['port']) ? (int) $parts['port'] : null;
    $portSuffix = '';
    if ($port !== null && !(($scheme === 'http' && $port === 80) || ($scheme === 'https' && $port === 443))) {
        $portSuffix = ':' . $port;
    }

    $path = isset($parts['path']) ? (string) $parts['path'] : '/';
    $path = preg_replace('~/+~', '/', $path);
    if ($path === null || $path === '') {
        $path = '/';
    }
    if ($path !== '/') {
        $path = rtrim($path, '/');
    }

    $query = '';
    if (isset($parts['query']) && $parts['query'] !== '') {
        parse_str((string) $parts['query'], $params);
        $filtered = [];
        foreach ($params as $key => $value) {
            $k = (string) $key;
            if (str_starts_with(strtolower($k), 'utm_')) {
                continue;
            }
            $filtered[$k] = $value;
        }
        if (!empty($filtered)) {
            ksort($filtered);
            $query = '?' . http_build_query($filtered);
        }
    }

    return "{$scheme}://{$host}{$portSuffix}{$path}{$query}";
}

function absolutizeUrl(string $url, string $baseUrl): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }

    if (preg_match('~^https?://~i', $url)) {
        return $url;
    }

    $base = parse_url($baseUrl);
    if ($base === false || empty($base['host'])) {
        return '';
    }

    $scheme = isset($base['scheme']) ? strtolower((string) $base['scheme']) : 'https';
    $host = strtolower((string) $base['host']);
    $port = isset($base['port']) ? ':' . (int) $base['port'] : '';

    if (str_starts_with($url, '//')) {
        return "{$scheme}:{$url}";
    }

    $basePath = isset($base['path']) ? (string) $base['path'] : '/';
    if ($basePath === '') {
        $basePath = '/';
    }
    if (!str_ends_with($basePath, '/')) {
        $basePath = dirname($basePath) . '/';
    }
    if ($basePath === DIRECTORY_SEPARATOR) {
        $basePath = '/';
    }

    $path = str_starts_with($url, '/')
        ? $url
        : ltrim($basePath, '/') . $url;
    $path = '/' . ltrim($path, '/');
    $path = preg_replace('~/+~', '/', $path) ?? $path;

    return "{$scheme}://{$host}{$port}{$path}";
}

function isAbsoluteHttpUrl(string $url): bool
{
    return (bool) preg_match('~^https?://~i', $url);
}

function makeNewsId(string $sourceId, string $canonicalUrl): string
{
    return $sourceId . '-' . substr(sha1($canonicalUrl), 0, 16);
}

function getSourceTimezone(string $sourceId): ?string
{
    if (in_array($sourceId, ['duma', 'cbr_news', 'cbr_press', 'rkn', 'vsrf', 'ksrf', 'genproc'], true)) {
        return DISPLAY_TIMEZONE;
    }
    return null;
}

function formatDateForDisplay(int $timestamp, bool $withTime = true): array
{
    if ($timestamp <= 0) {
        return ['', 'Дата не указана'];
    }
    $tz = new DateTimeZone(DISPLAY_TIMEZONE);
    $dt = (new DateTimeImmutable('@' . $timestamp))->setTimezone($tz);
    return [
        $dt->format('Y-m-d\TH:i:sP'),
        $dt->format($withTime ? 'd.m.Y H:i' : 'd.m.Y'),
    ];
}

function parseDateToTimestamp(string $raw, ?string $sourceTimezone = null): int
{
    if ($raw === '') {
        return 0;
    }

    $raw = cleanText($raw);
    if ($raw === '') {
        return 0;
    }

    $normalized = str_replace([' г.', ' года'], '', mb_strtolower($raw));
    $sourceTz = null;
    if ($sourceTimezone !== null && $sourceTimezone !== '') {
        try {
            $sourceTz = new DateTimeZone($sourceTimezone);
        } catch (Throwable $e) {
            $sourceTz = null;
        }
    }

    if (preg_match('/\b(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?\b/u', $normalized, $m)) {
        $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $month = str_pad($m[2], 2, '0', STR_PAD_LEFT);
        $year = $m[3];
        $hour = isset($m[4]) ? str_pad($m[4], 2, '0', STR_PAD_LEFT) : '00';
        $minute = isset($m[5]) ? str_pad($m[5], 2, '0', STR_PAD_LEFT) : '00';
        if ($sourceTz instanceof DateTimeZone) {
            $dt = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', "{$year}-{$month}-{$day} {$hour}:{$minute}:00", $sourceTz);
            if ($dt instanceof DateTimeImmutable) {
                return $dt->getTimestamp();
            }
        }
        $parsed = strtotime("{$year}-{$month}-{$day} {$hour}:{$minute}:00");
        if ($parsed !== false) {
            return $parsed;
        }
    }

    if (preg_match('/\b(сегодня|вчера)\b(?:\s+(\d{1,2}):(\d{2}))?/u', $normalized, $m)) {
        $baseDate = $m[1] === 'вчера' ? date('Y-m-d', strtotime('-1 day')) : date('Y-m-d');
        if ($sourceTz instanceof DateTimeZone) {
            $base = new DateTimeImmutable('now', $sourceTz);
            if ($m[1] === 'вчера') {
                $base = $base->modify('-1 day');
            }
            $baseDate = $base->format('Y-m-d');
        }
        $hour = isset($m[2]) ? str_pad($m[2], 2, '0', STR_PAD_LEFT) : '00';
        $minute = isset($m[3]) ? str_pad($m[3], 2, '0', STR_PAD_LEFT) : '00';
        if ($sourceTz instanceof DateTimeZone) {
            $dt = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', "{$baseDate} {$hour}:{$minute}:00", $sourceTz);
            if ($dt instanceof DateTimeImmutable) {
                return $dt->getTimestamp();
            }
        }
        $parsed = strtotime("{$baseDate} {$hour}:{$minute}:00");
        if ($parsed !== false) {
            return $parsed;
        }
    }

    if ($sourceTz instanceof DateTimeZone) {
        try {
            $dt = new DateTimeImmutable($raw, $sourceTz);
            return $dt->getTimestamp();
        } catch (Throwable $e) {
        }
    }

    $ts = strtotime($raw);
    if ($ts !== false) {
        return $ts;
    }

    $months = [
        'января' => '01',
        'февраля' => '02',
        'марта' => '03',
        'апреля' => '04',
        'мая' => '05',
        'июня' => '06',
        'июля' => '07',
        'августа' => '08',
        'сентября' => '09',
        'октября' => '10',
        'ноября' => '11',
        'декабря' => '12',
    ];

    $lower = mb_strtolower($raw);
    if (preg_match('/(\d{1,2})\s+([а-я]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/u', $lower, $m)) {
        $day = str_pad($m[1], 2, '0', STR_PAD_LEFT);
        $month = $months[$m[2]] ?? null;
        $year = $m[3];
        if ($month !== null) {
            $hour = isset($m[4]) ? str_pad($m[4], 2, '0', STR_PAD_LEFT) : '00';
            $minute = $m[5] ?? '00';
            $candidate = "{$year}-{$month}-{$day} {$hour}:{$minute}:00";
            if ($sourceTz instanceof DateTimeZone) {
                $dt = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $candidate, $sourceTz);
                if ($dt instanceof DateTimeImmutable) {
                    return $dt->getTimestamp();
                }
            }
            $parsed = strtotime($candidate);
            if ($parsed !== false) {
                return $parsed;
            }
        }
    }

    return 0;
}

function trimSummary(string $text, int $limit): string
{
    $text = cleanText($text);
    if ($text === '') {
        return '';
    }
    if (mb_strlen($text) <= $limit) {
        return $text;
    }

    $chunk = mb_substr($text, 0, $limit);
    $spacePos = mb_strrpos($chunk, ' ');
    if ($spacePos !== false) {
        $chunk = mb_substr($chunk, 0, $spacePos);
    }
    return rtrim($chunk, " \t\n\r\0\x0B,.") . '…';
}

function cleanText(string $text): string
{
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text);
    return trim((string) $text);
}

function isLikelyXml(string $raw): bool
{
    return str_starts_with($raw, '<?xml') || str_starts_with($raw, '<rss') || str_starts_with($raw, '<feed');
}

function resolveAutoSources(array $sources): array
{
    $resolved = [];
    foreach ($sources as $source) {
        $type = (string) ($source['type'] ?? '');
        if ($type !== 'auto_rss_or_html_list') {
            $resolved[] = $source;
            continue;
        }

        $pages = [];
        $pages[] = (string) ($source['url'] ?? '');
        $htmlUrl = (string) ($source['htmlUrl'] ?? '');
        if ($htmlUrl !== '') {
            $pages[] = $htmlUrl;
        }
        $pages = array_values(array_unique(array_filter($pages)));

        $discovered = '';
        foreach ($pages as $pageUrl) {
            $discovered = discoverRssUrl($pageUrl);
            if ($discovered !== '') {
                break;
            }
        }

        if ($discovered !== '') {
            $source['type'] = 'rss';
            $source['url'] = $discovered;
            $source['enabled'] = true;
            $source['discoveredFrom'] = $pages;
            $resolved[] = $source;
            continue;
        }

        $source['type'] = 'html_list';
        $source['url'] = $htmlUrl !== '' ? $htmlUrl : (string) ($source['url'] ?? '');
        $source['enabled'] = true;
        if (!isset($source['limit'])) {
            $source['limit'] = HTML_LIST_LIMIT;
        }
        $resolved[] = $source;
    }

    return $resolved;
}

function discoverRssUrl(string $homepageUrl): string
{
    $homepageUrl = trim($homepageUrl);
    if ($homepageUrl === '') {
        return '';
    }

    $result = fetchUrl($homepageUrl, [
        'Accept: text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Connection: close',
    ], 2, 3);
    if (!($result['ok'] ?? false)) {
        return '';
    }

    $html = (string) ($result['body'] ?? '');
    if ($html === '') {
        return '';
    }

    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html);
    if (!$loaded) {
        return '';
    }

    $xpath = new DOMXPath($dom);

    $linkNodes = $xpath->query('//link[@href]');
    if ($linkNodes instanceof DOMNodeList) {
        foreach ($linkNodes as $linkNode) {
            if (!$linkNode instanceof DOMElement) {
                continue;
            }
            $rel = mb_strtolower(cleanText((string) $linkNode->getAttribute('rel')));
            $type = mb_strtolower(cleanText((string) $linkNode->getAttribute('type')));
            $href = cleanText((string) $linkNode->getAttribute('href'));
            if ($href === '') {
                continue;
            }
            if (str_contains($rel, 'alternate') && ($type === 'application/rss+xml' || $type === 'application/atom+xml')) {
                $absolute = absolutizeUrl($href, $homepageUrl);
                if (isAbsoluteHttpUrl($absolute)) {
                    return $absolute;
                }
            }
            if (looksLikeFeedHref($href)) {
                $absolute = absolutizeUrl($href, $homepageUrl);
                if (isAbsoluteHttpUrl($absolute)) {
                    return $absolute;
                }
            }
        }
    }

    $anchorNodes = $xpath->query('//a[@href]');
    if (!$anchorNodes instanceof DOMNodeList) {
        return '';
    }
    foreach ($anchorNodes as $anchorNode) {
        if (!$anchorNode instanceof DOMElement) {
            continue;
        }
        $href = cleanText((string) $anchorNode->getAttribute('href'));
        if ($href === '' || !looksLikeFeedHref($href)) {
            continue;
        }
        $absolute = absolutizeUrl($href, $homepageUrl);
        if (isAbsoluteHttpUrl($absolute)) {
            return $absolute;
        }
    }

    return '';
}

function getOfficialSourceLinkQueries(string $sourceId): array
{
    if ($sourceId === 'rkn') {
        return [
            "//main//a[contains(@href,'/news/') and normalize-space(string(.))!='']",
            "//section[contains(@class,'news')]//a[contains(@href,'/news/')]",
            "//div[contains(@class,'news')]//a[contains(@href,'/news/')]",
            "//article//a[contains(@href,'/news/')]",
        ];
    }

    if ($sourceId === 'vsrf') {
        return [
            "//main//a[contains(@href,'/press_center/news/') and normalize-space(string(.))!='']",
            "//section[contains(@class,'news')]//a[contains(@href,'/press_center/news/')]",
            "//div[contains(@class,'news')]//a[contains(@href,'/press_center/news/')]",
            "//article//a[contains(@href,'/press_center/news/')]",
            "//main//a[contains(@href,'/press_center/mass_media/') and normalize-space(string(.))!='']",
            "//section[contains(@class,'news')]//a[contains(@href,'/press_center/mass_media/')]",
            "//div[contains(@class,'news')]//a[contains(@href,'/press_center/mass_media/')]",
            "//article//a[contains(@href,'/press_center/mass_media/')]",
        ];
    }

    if ($sourceId === 'ksrf') {
        return [
            "//main//a[contains(@href,'/ru/News/Pages/') and normalize-space(string(.))!='']",
            "//div[contains(@class,'news')]//a[contains(@href,'/ru/News/Pages/')]",
            "//ul[contains(@class,'news')]//a[contains(@href,'/ru/News/Pages/')]",
            "//article//a[contains(@href,'/ru/News/Pages/')]",
        ];
    }

    if ($sourceId === 'genproc') {
        return [
            "//div[contains(@class,'feeds-list')]//a[contains(@class,'feeds-list__list_link') and contains(@href,'/mass-media/news/')]",
            "//section[contains(@class,'portlet')]//a[contains(@href,'/mass-media/news/main/')]",
            "//main//a[contains(@href,'/mass-media/news/main/') and normalize-space(string(.))!='']",
            "//a[contains(@href,'/mass-media/news/') and normalize-space(string(.))!='']",
        ];
    }

    return ["//a[@href]"];
}

function getOfficialSourceDateQueries(string $sourceId): array
{
    if ($sourceId === 'genproc') {
        return [
            "./ancestor::div[contains(@class,'feeds-list__list_item')][1]//h4[contains(@class,'feeds-list__list_date')]",
            "./ancestor::div[contains(@class,'feeds-list__list_item')][1]//span[contains(@class,'feeds-list__list_time_span-time')]",
            "./ancestor::div[contains(@class,'feeds-list__list_item')][1]//span[contains(@class,'feeds-list__list_time')]",
            "./ancestor::div[contains(@class,'feeds-list__list_item')][1]//*[contains(@class,'date') or contains(@class,'time')]",
        ];
    }

    return [
        "./ancestor::article[1]//time/@datetime",
        "./ancestor::article[1]//time",
        "./ancestor::*[contains(@class,'item') or contains(@class,'news')][1]//*[contains(@class,'date') or contains(@class,'time') or contains(@class,'published')]",
        "./ancestor::li[1]//*[contains(@class,'date') or contains(@class,'time')]",
        "./ancestor::div[1]//*[contains(@class,'date') or contains(@class,'time')]",
    ];
}

function isAcceptedOfficialSourceUrl(string $sourceId, string $url): bool
{
    $parts = parse_url($url);
    if ($parts === false) {
        return false;
    }
    $host = mb_strtolower((string) ($parts['host'] ?? ''));
    $path = mb_strtolower((string) ($parts['path'] ?? '/'));

    if ($sourceId === 'rkn') {
        return str_contains($host, 'rkn.gov.ru') && (bool) preg_match('~^/news/.+~', $path) && !preg_match('~^/news/?$~', $path);
    }

    if ($sourceId === 'vsrf') {
        return str_contains($host, 'vsrf.ru')
            && (
                (str_starts_with($path, '/press_center/news/') && !preg_match('~^/press_center/news/?$~', $path))
                || (str_starts_with($path, '/press_center/mass_media/') && !preg_match('~^/press_center/mass_media/?$~', $path))
            );
    }

    if ($sourceId === 'ksrf') {
        return str_contains($host, 'ksrf.ru')
            && str_starts_with($path, '/ru/news/pages/')
            && !str_ends_with($path, '/default.aspx');
    }

    if ($sourceId === 'genproc') {
        return str_contains($host, 'genproc.gov.ru')
            && str_contains($path, '/mass-media/news/')
            && (bool) preg_match('~/(main|regional|archive)/[a-z0-9_-]+/?$~i', $path);
    }

    return true;
}

function extractDateForOfficialLink(DOMXPath $xpath, DOMElement $linkNode, array $dateQueries, string $sourceId = ''): array
{
    $dateCandidates = [];
    $timeCandidates = [];
    foreach ($dateQueries as $query) {
        $nodes = $xpath->query($query, $linkNode);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            if ($node instanceof DOMAttr || $node instanceof DOMText || $node instanceof DOMElement) {
                $candidate = cleanText((string) $node->textContent);
                if ($candidate !== '') {
                    $dateCandidates[] = $candidate;
                    if ((bool) preg_match('/\b\d{1,2}:\d{2}\b/u', $candidate)) {
                        $timeCandidates[] = $candidate;
                    }
                }
            }
        }
    }

    if ($sourceId === 'genproc') {
        $dateOnly = '';
        $timeOnly = '';
        foreach ($dateCandidates as $candidate) {
            if ($dateOnly === '' && !preg_match('/\b\d{1,2}:\d{2}\b/u', $candidate) && looksLikeDateText($candidate)) {
                $dateOnly = $candidate;
            }
            if ($timeOnly === '' && preg_match('/\b\d{1,2}:\d{2}\b/u', $candidate, $m)) {
                $timeOnly = $m[0];
            }
        }
        if ($dateOnly !== '' && $timeOnly !== '') {
            array_unshift($dateCandidates, $dateOnly . ' ' . $timeOnly);
        }
    }

    foreach (extractNearbyDateCandidates($linkNode) as $candidate) {
        $dateCandidates[] = $candidate;
    }

    $dateCandidates = array_values(array_unique(array_filter(array_map('cleanText', $dateCandidates))));
    foreach ($dateCandidates as $candidate) {
        $timestamp = parseDateToTimestamp($candidate, getSourceTimezone($sourceId));
        if ($timestamp <= 0) {
            continue;
        }
        $hasTime = (bool) preg_match('/\b\d{1,2}:\d{2}\b/u', $candidate);
        [$dateISO, $dateHuman] = formatDateForDisplay($timestamp, $hasTime);
        return [
            $timestamp,
            $dateHuman,
            $dateISO,
        ];
    }

    return [0, 'Дата не указана', ''];
}

function extractOfficialSummaryForLink(DOMXPath $xpath, DOMElement $linkNode, string $title, string $sourceId = ''): string
{
    if ($sourceId === 'genproc') {
        $fromList = extractGenprocSummaryFromList($xpath, $linkNode, $title);
        if ($fromList !== '') {
            return $fromList;
        }
    }

    $queries = array_merge(getOfficialSourceSummaryQueries($sourceId), [
        "./ancestor::div[contains(@class,'feeds-list__list_item')][1]//p[contains(@class,'feeds-list__list_text')]",
        "./ancestor::article[1]//p",
        "./ancestor::*[contains(@class,'item') or contains(@class,'news')][1]//p",
        "./ancestor::li[1]//p",
        "./following-sibling::p[1]",
    ]);

    foreach ($queries as $query) {
        $nodes = $xpath->query($query, $linkNode);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            if (!$node instanceof DOMElement) {
                continue;
            }
            $text = normalizeSummaryCandidate($node->textContent);
            if (
                $text === ''
                || $text === $title
                || mb_strlen($text) < 40
                || looksLikeDateText($text)
                || isRejectedSummaryText($text)
            ) {
                continue;
            }
            return trimSummary($text, 240);
        }
    }

    return '';
}

function normalizeSummaryCandidate(string $raw): string
{
    $text = strip_tags($raw);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text);
    return trim((string) $text);
}

function extractGenprocSummaryFromList(DOMXPath $xpath, DOMElement $linkNode, string $title): string
{
    $queries = [
        "./ancestor::div[contains(@class,'feeds-list__list_item')][1]//*[self::p or self::div or self::span]",
        "./ancestor::article[1]//*[self::p or self::div or self::span]",
        "./ancestor::*[contains(@class,'item') or contains(@class,'news')][1]//*[self::p or self::div or self::span]",
        "./following-sibling::*[self::p or self::div or self::span][1]",
    ];

    $titleLower = mb_strtolower(cleanText($title));
    foreach ($queries as $query) {
        $nodes = $xpath->query($query, $linkNode);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            if (!$node instanceof DOMElement) {
                continue;
            }

            $text = cleanText($node->textContent);
            if ($text === '') {
                continue;
            }

            $textLower = mb_strtolower($text);
            if ($textLower === $titleLower) {
                continue;
            }
            if (looksLikeDateText($text) || preg_match('/^\d{1,2}:\d{2}$/u', $text) === 1) {
                continue;
            }
            if (mb_strlen($text) < 40) {
                continue;
            }

            return trimSummary($text, 240);
        }
    }

    return '';
}

function enrichGenprocSummariesFromArticlePages(array $items): array
{
    return enrichOfficialSummariesFromArticlePages($items, 'genproc');
}

function enrichOfficialSummariesFromArticlePages(array $items, string $sourceId): array
{
    $budgets = [
        'genproc' => 5,
        'rkn' => 5,
        'vsrf' => 5,
        'ksrf' => 5,
    ];
    $fetchBudget = (int) ($budgets[$sourceId] ?? 0);
    $toFetch = [];

    foreach ($items as $idx => $item) {
        $summary = (string) ($item['summary'] ?? '');
        if ($summary !== '') {
            continue;
        }

        $url = (string) ($item['url'] ?? '');
        if ($url === '') {
            continue;
        }

        $cached = readSummaryCache($url);
        if ($cached['hit']) {
            $items[$idx]['summary'] = $cached['summary'];
            continue;
        }

        $toFetch[] = [
            'idx' => $idx,
            'url' => $url,
            'ts' => (int) ($item['_timestamp'] ?? 0),
        ];
    }

    if (empty($toFetch) || $fetchBudget <= 0) {
        return $items;
    }

    usort($toFetch, static function (array $a, array $b): int {
        return ((int) ($b['ts'] ?? 0)) <=> ((int) ($a['ts'] ?? 0));
    });

    foreach ($toFetch as $row) {
        if ($fetchBudget <= 0) {
            break;
        }

        $idx = (int) $row['idx'];
        $url = (string) ($row['url'] ?? '');
        if ($url === '') {
            continue;
        }

        $fetched = fetchOfficialSummaryFromArticle($url, $sourceId);
        writeSummaryCache($url, $fetched);
        $items[$idx]['summary'] = $fetched;
        $fetchBudget--;
    }

    return $items;
}

function fetchOfficialSummaryFromArticle(string $url, string $sourceId): string
{
    if ($sourceId === 'genproc') {
        return fetchGenprocSummaryFromArticle($url);
    }
    return fetchSummaryFromHtmlPage($url, 240, $sourceId);
}

function fetchGenprocSummaryFromArticle(string $url): string
{
    $summary = fetchSummaryFromHtmlPage($url, 240, 'genproc');
    if ($summary !== '') {
        return $summary;
    }

    $result = fetchUrl($url, [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.7,en;q=0.5',
        'Connection: close',
    ], 3, 6);
    if (!($result['ok'] ?? false)) {
        return '';
    }

    $html = (string) ($result['body'] ?? '');
    if ($html === '') {
        return '';
    }

    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    if (!$dom->loadHTML('<?xml encoding="utf-8" ?>' . $html)) {
        return '';
    }

    $xpath = new DOMXPath($dom);
    $queries = [
        "//div[contains(@class,'feeds-page__article_text')]//p[normalize-space()]",
        "//article//p[normalize-space()]",
        "//main//article//p[normalize-space()]",
        "//main//p[normalize-space()]",
    ];

    foreach ($queries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            if (!$node instanceof DOMElement) {
                continue;
            }
            $text = normalizeSummaryCandidate($node->textContent);
            if ($text === '' || mb_strlen($text) < 25 || looksLikeDateText($text) || isRejectedSummaryText($text)) {
                continue;
            }
            return trimSummary($text, 240);
        }
    }

    return '';
}

function readSummaryCache(string $url): array
{
    $cacheFile = buildSummaryCacheFile($url);
    if (!is_file($cacheFile)) {
        return ['hit' => false, 'summary' => ''];
    }

    $age = time() - (int) filemtime($cacheFile);
    if ($age < 0 || $age >= CACHE_LIFETIME) {
        return ['hit' => false, 'summary' => ''];
    }

    $raw = @file_get_contents($cacheFile);
    if (!is_string($raw) || $raw === '') {
        return ['hit' => false, 'summary' => ''];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ['hit' => false, 'summary' => ''];
    }

    $summary = '';
    if (isset($decoded['summary']) && is_string($decoded['summary'])) {
        $summary = trimSummary($decoded['summary'], 240);
    }

    return ['hit' => true, 'summary' => $summary];
}

function writeSummaryCache(string $url, string $summary): void
{
    $cacheFile = buildSummaryCacheFile($url);
    @file_put_contents($cacheFile, json_encode([
        'summary' => trimSummary($summary, 240),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function buildSummaryCacheFile(string $url): string
{
    return __DIR__ . '/.cache/summary_' . md5(canonicalizeUrl($url)) . '.json';
}

function fetchRssPageSummaryWithCache(string $url, string $sourceId): string
{
    static $fetchBudget = [
        'cbr_news' => 12,
        'cbr_press' => 6,
        'rkn' => 5,
        'vsrf' => 5,
        'ksrf' => 5,
    ];

    $cached = readSummaryCache($url);
    if ($cached['hit']) {
        return $cached['summary'];
    }

    $budget = $fetchBudget[$sourceId] ?? 0;
    if ($budget <= 0) {
        return '';
    }

    $fetchBudget[$sourceId] = $budget - 1;
    $summary = fetchSummaryFromHtmlPage($url, 380, $sourceId);
    writeSummaryCache($url, $summary);
    return $summary;
}

function fetchSummaryFromHtmlPage(string $url, int $limit = 380, string $sourceId = ''): string
{
    $result = fetchUrl($url, [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.7,en;q=0.5',
        'Connection: close',
    ], 3, 6);
    if (!($result['ok'] ?? false)) {
        return '';
    }

    $html = (string) ($result['body'] ?? '');
    if ($html === '') {
        return '';
    }

    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    if (!$dom->loadHTML('<?xml encoding="utf-8" ?>' . $html)) {
        return '';
    }

    $xpath = new DOMXPath($dom);
    $metaQueries = [
        "//meta[translate(@name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='description']/@content",
        "//meta[translate(@property,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='og:description']/@content",
    ];
    foreach ($metaQueries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            $text = normalizeSummaryCandidate((string) $node->nodeValue);
            if ($text !== '' && mb_strlen($text) >= 40 && !isRejectedSummaryText($text)) {
                return trimSummary($text, $limit);
            }
        }
    }

    $paragraphQueries = array_merge(getOfficialSourceArticleParagraphQueries($sourceId), [
        "//div[contains(@class,'article') or contains(@class,'content')]//p[normalize-space()]",
        "//article//p[normalize-space()]",
        "//main//article//p[normalize-space()]",
        "//main//p[normalize-space()]",
    ]);
    foreach ($paragraphQueries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }
        foreach ($nodes as $node) {
            if (!$node instanceof DOMElement) {
                continue;
            }
            $text = normalizeSummaryCandidate($node->textContent);
            if ($text === '' || mb_strlen($text) < 40 || looksLikeDateText($text) || isRejectedSummaryText($text)) {
                continue;
            }
            return trimSummary($text, $limit);
        }
    }

    return '';
}

function getOfficialSourceSummaryQueries(string $sourceId): array
{
    if ($sourceId === 'rkn') {
        return [
            "./ancestor::*[contains(@class,'news')][1]//*[self::p or self::div][contains(@class,'lead') or contains(@class,'announce') or contains(@class,'preview')]",
            "./ancestor::article[1]//*[self::p or self::div][contains(@class,'lead') or contains(@class,'announce') or contains(@class,'preview')]",
        ];
    }
    if ($sourceId === 'vsrf') {
        return [
            "./ancestor::*[contains(@class,'news') or contains(@class,'item')][1]//*[self::p or self::div][contains(@class,'anons') or contains(@class,'announce') or contains(@class,'preview')]",
        ];
    }
    if ($sourceId === 'ksrf') {
        return [
            "./ancestor::*[contains(@class,'news') or contains(@class,'item')][1]//*[self::p or self::div][contains(@class,'announce') or contains(@class,'preview') or contains(@class,'summary')]",
        ];
    }
    return [];
}

function getOfficialSourceArticleParagraphQueries(string $sourceId): array
{
    if ($sourceId === 'rkn') {
        return [
            "//main//*[contains(@class,'news') and (contains(@class,'detail') or contains(@class,'article'))]//p[normalize-space()]",
            "//div[contains(@class,'news-detail') or contains(@class,'news_text')]//p[normalize-space()]",
        ];
    }
    if ($sourceId === 'vsrf') {
        return [
            "//main//*[contains(@class,'content') or contains(@class,'news') or contains(@class,'article')]//p[normalize-space()]",
            "//div[contains(@class,'press') or contains(@class,'mass-media')]//p[normalize-space()]",
        ];
    }
    if ($sourceId === 'ksrf') {
        return [
            "//main//*[contains(@class,'news') or contains(@class,'article') or contains(@class,'content')]//p[normalize-space()]",
            "//div[contains(@id,'ctl00') or contains(@class,'ms-rte')]//p[normalize-space()]",
        ];
    }
    if ($sourceId === 'genproc') {
        return [
            "//div[contains(@class,'feeds-page__article_text')]//p[normalize-space()]",
        ];
    }
    return [];
}

function isRejectedSummaryText(string $text): bool
{
    $lower = mb_strtolower(cleanText($text));
    if ($lower === '') {
        return true;
    }

    $blocked = [
        'по вашему запросу ничего не найдено',
        'оформить подписку',
        'прямая ссылка на материал',
        'поделиться',
        'распечатать',
        'архив новостей',
    ];

    foreach ($blocked as $needle) {
        if (str_contains($lower, $needle)) {
            return true;
        }
    }

    return false;
}

function resolveAcceptHeaderBySourceType(string $type): string
{
    if ($type === 'html_list') {
        return 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
    }
    if ($type === 'official_rss_or_json') {
        return 'application/json,application/rss+xml,application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8';
    }
    return 'application/rss+xml,application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8';
}

function classifyFetchFailureReason(
    bool $ok,
    int $curlErrNo,
    string $curlErr,
    int $httpCode,
    string $body,
    string $contentType,
    bool $deadlineReached,
    string $sourceType
): string {
    if ($ok) {
        if ($sourceType === 'html_list' && detectHtmlResponseIssue($body, '') === 'blocked_or_empty_html') {
            return 'blocked';
        }
        return '';
    }

    if ($curlErrNo === CURLE_OPERATION_TIMEDOUT || ($deadlineReached && $curlErrNo === 0 && $httpCode === 0)) {
        return 'timeout';
    }

    if ($httpCode >= 400) {
        if (in_array($httpCode, [401, 403, 429], true)) {
            return 'blocked';
        }
        return 'http_code';
    }

    if ($httpCode >= 300 && $httpCode < 400 && trim($body) === '') {
        return 'blocked';
    }

    if ($curlErrNo !== 0) {
        $curlLower = mb_strtolower($curlErr);
        if (
            str_contains($curlLower, 'ssl')
            || str_contains($curlLower, 'handshake')
            || str_contains($curlLower, 'empty reply')
            || str_contains($curlLower, 'connection reset')
        ) {
            return 'blocked';
        }
        return 'curl_error';
    }

    if (trim($body) === '') {
        if ($httpCode === 0) {
            return 'blocked';
        }
        return 'empty_html';
    }

    if ($sourceType === 'html_list' && detectHtmlResponseIssue($body, '') === 'blocked_or_empty_html') {
        return 'blocked';
    }

    if ($contentType !== '' && !str_contains(mb_strtolower($contentType), 'html') && $sourceType === 'html_list') {
        return 'parse_failed';
    }

    return 'parse_failed';
}

function detectHtmlResponseIssue(string $html, string $sourceId): string
{
    $trimmed = trim($html);
    if ($trimmed === '') {
        return 'empty_html';
    }
    $lower = mb_strtolower($trimmed);
    $isHtml = str_contains($lower, '<html') || str_contains($lower, '<body') || str_contains($lower, '<a ');
    if (!$isHtml) {
        return 'empty_html';
    }

    $blockedPatterns = [
        'access denied',
        'forbidden',
        'captcha',
        'cloudflare',
        'attention required',
        'verify you are human',
        'bot protection',
        'service unavailable',
        'temporarily unavailable',
    ];
    foreach ($blockedPatterns as $pattern) {
        if (str_contains($lower, $pattern)) {
            return 'blocked_or_empty_html';
        }
    }

    if ($sourceId === 'genproc' && !str_contains($lower, '/mass-media/news/')) {
        return 'blocked_or_empty_html';
    }

    return '';
}

function looksLikeFeedHref(string $href): bool
{
    $lower = mb_strtolower($href);
    return str_contains($lower, 'rss')
        || str_contains($lower, 'feed')
        || str_contains($lower, '.xml');
}

function fetchUrl(string $url, array $headers = [], int $connectTimeout = 3, int $timeout = 6): array
{
    $ch = curl_init($url);
    if ($ch === false) {
        return ['ok' => false, 'body' => '', 'reason' => 'curl_init_failed'];
    }

    if (empty($headers)) {
        $headers = [
            'Accept: */*',
            'Connection: close',
        ];
    }

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 8,
        CURLOPT_CONNECTTIMEOUT => $connectTimeout,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_USERAGENT => USER_AGENT,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_ENCODING => '',
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    ]);

    $host = parse_url($url, PHP_URL_HOST);
    if (is_string($host) && $host !== '') {
        curl_setopt($ch, CURLOPT_REFERER, 'https://' . $host . '/');
    }

    $body = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErrNo = curl_errno($ch);
    $curlErr = curl_error($ch);
    $contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $effectiveUrl = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $bytes = is_string($body) ? strlen($body) : 0;
    $reason = '';

    $ok = $curlErrNo === 0 && $httpCode >= 200 && $httpCode < 400 && is_string($body) && trim($body) !== '';
    if (!$ok) {
        $reason = classifyFetchFailureReason($ok, $curlErrNo, $curlErr, $httpCode, (string) $body, $contentType, false, '');
    }
    return [
        'ok' => $ok,
        'body' => $ok ? (string) $body : '',
        'reason' => $reason,
        'httpCode' => $httpCode,
        'curlErrNo' => $curlErrNo,
        'curlErr' => $curlErr,
        'effectiveUrl' => $effectiveUrl,
        'contentType' => $contentType,
        'bytes' => $bytes,
    ];
}

function extractNearbyDateCandidates(DOMElement $linkNode): array
{
    $candidates = [];
    $candidates[] = (string) $linkNode->getAttribute('datetime');
    $candidates[] = (string) $linkNode->getAttribute('data-date');
    $candidates[] = (string) $linkNode->getAttribute('title');

    $parent = $linkNode->parentNode;
    if ($parent instanceof DOMNode) {
        $candidates[] = $parent->textContent;
    }

    $prev = $linkNode->previousSibling;
    if ($prev instanceof DOMNode) {
        $candidates[] = $prev->textContent;
    }

    $next = $linkNode->nextSibling;
    if ($next instanceof DOMNode) {
        $candidates[] = $next->textContent;
    }

    $out = [];
    foreach ($candidates as $candidate) {
        $cleaned = cleanText((string) $candidate);
        if ($cleaned !== '') {
            $out[] = $cleaned;
        }
    }

    return array_values(array_unique($out));
}

function looksLikeDateText(string $text): bool
{
    return (bool) preg_match(
        '/\b\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{2,4}\b/u',
        $text
    ) || (bool) preg_match(
        '/\b\d{1,2}\s+[а-я]+(?:\s+\d{4})?(?:\s+\d{1,2}:\d{2})?\b/ui',
        mb_strtolower($text)
    ) || (bool) preg_match(
        '/\b(mon|tue|wed|thu|fri|sat|sun),?\s+\d{1,2}\s+[a-z]{3,9}\s+\d{4}\b/i',
        $text
    );
}

function stripMarkdownInline(string $text): string
{
    $text = preg_replace('/!\[[^\]]*\]\([^)]+\)/u', ' ', $text) ?? $text;
    $text = preg_replace('/\[([^\]]*)\]\([^)]+\)/u', '$1', $text) ?? $text;
    $text = str_replace(['**', '__', '_', '`', '###', '##', '#', '>'], ' ', $text);
    return cleanText($text);
}

function fetchMarkdownArticleTitle(string $url, string $sourceId): string
{
    static $cache = [];
    $url = trim($url);
    if ($url === '' || !isAbsoluteHttpUrl($url)) {
        return '';
    }
    $key = $sourceId . '|' . canonicalizeUrl($url);
    if (isset($cache[$key])) {
        return $cache[$key];
    }

    $response = fetchUrl('https://r.jina.ai/http://' . $url, [
        'Accept: text/plain,text/markdown,*/*;q=0.8',
        'Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.7,en;q=0.5',
        'Connection: close',
    ], 5, 10);

    $title = '';
    $body = (string) ($response['body'] ?? '');
    if (($response['ok'] ?? false) && !isBlockedMarkdownSnapshot($body)) {
        if (preg_match('/^Title:\s*(.+)$/miu', $body, $m)) {
            $title = cleanText(stripMarkdownInline($m[1]));
        }
        if ($title === '' && preg_match('/^#\s+(.+)$/miu', $body, $m)) {
            $title = cleanText(stripMarkdownInline($m[1]));
        }
    }

    $cache[$key] = $title;
    return $title;
}

function fallbackTitleFromUrl(string $url, string $sourceName): string
{
    $path = (string) (parse_url($url, PHP_URL_PATH) ?? '');
    if ($path === '') {
        return '';
    }
    if (preg_match('~/([0-9]{4,})/?$~', $path, $m)) {
        return $sourceName . ': материал ' . $m[1];
    }
    $slug = trim(basename($path), '/');
    $slug = preg_replace('/[-_]+/u', ' ', $slug) ?? $slug;
    $slug = cleanText($slug);
    return $slug !== '' ? ($sourceName . ': ' . $slug) : '';
}

function keepSourceFloorBeforeGlobalLimit(array $items, int $minPerSource, int $limit): array
{
    if ($minPerSource <= 0 || $limit <= 0 || count($items) <= $limit) {
        return $items;
    }

    usort($items, static function (array $a, array $b): int {
        return ((int) ($b['_timestamp'] ?? $b['dateTs'] ?? 0)) <=> ((int) ($a['_timestamp'] ?? $a['dateTs'] ?? 0));
    });

    $selected = [];
    $selectedKeys = [];
    $bySource = [];
    foreach ($items as $item) {
        $source = (string) ($item['source'] ?? 'Источник');
        $bySource[$source][] = $item;
    }

    foreach ($bySource as $sourceItems) {
        foreach (array_slice($sourceItems, 0, $minPerSource) as $item) {
            $key = (string) ($item['_canonicalUrl'] ?? canonicalizeUrl((string) ($item['url'] ?? '')));
            if ($key === '' || isset($selectedKeys[$key])) {
                continue;
            }
            $selected[] = $item;
            $selectedKeys[$key] = true;
        }
    }

    foreach ($items as $item) {
        if (count($selected) >= $limit) {
            break;
        }
        $key = (string) ($item['_canonicalUrl'] ?? canonicalizeUrl((string) ($item['url'] ?? '')));
        if ($key === '' || isset($selectedKeys[$key])) {
            continue;
        }
        $selected[] = $item;
        $selectedKeys[$key] = true;
    }

    return $selected;
}

function loadKeisNotes(string $notesFile): array
{
    if (!is_file($notesFile)) {
        @file_put_contents($notesFile, "{}\n");
    }

    $raw = @file_get_contents($notesFile);
    if (!is_string($raw) || trim($raw) === '') {
        return ['valid' => true, 'byId' => [], 'byUrl' => []];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ['valid' => false, 'byId' => [], 'byUrl' => []];
    }

    $byId = [];
    $byUrl = [];

    foreach ($decoded as $key => $value) {
        if (!is_string($value)) {
            continue;
        }
        $note = cleanText($value);
        if ($note === '') {
            continue;
        }

        if (is_string($key)) {
            $trimmedKey = trim($key);
            if (preg_match('~^https?://~i', $trimmedKey)) {
                $byUrl[canonicalizeUrl($trimmedKey)] = $note;
            } else {
                $byId[$trimmedKey] = $note;
            }
        }
    }

    return ['valid' => true, 'byId' => $byId, 'byUrl' => $byUrl];
}

function resolveKeisOverride(array $item, array $byId, array $byUrl): string
{
    $id = (string) ($item['id'] ?? '');
    if ($id !== '' && isset($byId[$id])) {
        return (string) $byId[$id];
    }

    $url = (string) ($item['url'] ?? '');
    if ($url !== '') {
        $canonical = canonicalizeUrl($url);
        if (isset($byUrl[$canonical])) {
            return (string) $byUrl[$canonical];
        }
    }

    return '';
}

function generateKeisNoteAuto(string $title, string $summary): string
{
    $titleText = trimSummary(cleanText($title), 160);
    $summaryText = trimSummary(cleanText($summary), 180);
    if ($summaryText === '') {
        $summaryText = 'Появилось обновление в правовой повестке.';
    }

    $audience = 'тем, кто ведет договоры, претензионную работу и клиентские процессы';
    $lower = mb_strtolower($titleText . ' ' . $summaryText);
    if (mb_strpos($lower, 'суд') !== false || mb_strpos($lower, 'взыск') !== false) {
        $audience = 'юристам и тем, кто готовит или сопровождает судебные споры';
    } elseif (mb_strpos($lower, 'штраф') !== false || mb_strpos($lower, 'проверк') !== false) {
        $audience = 'руководителям, комплаенс-командам и операционным подразделениям';
    } elseif (mb_strpos($lower, 'кредит') !== false || mb_strpos($lower, 'страхов') !== false) {
        $audience = 'заемщикам, страхователям и сервисным командам поддержки';
    }

    return "Что произошло: {$titleText}.\n"
        . "Кому важно: {$audience}.\n"
        . "Практический шаг: проверьте действующие документы и обновите шаблоны/регламенты под новый риск-контур.";
}
