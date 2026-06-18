# Timeweb deploy checklist

## Cron для новостей

Новости обновляются через:

`news/refresh-cron.php`

На Timeweb в панели управления нужно добавить cron:

`0 */3 * * * /usr/bin/php /home/USER/www/DOMAIN/news/refresh-cron.php "NEWS_REFRESH_TOKEN"`

Где:
- `USER` заменить на пользователя хостинга;
- `DOMAIN` заменить на папку домена;
- `NEWS_REFRESH_TOKEN` заменить на реальный токен обновления новостей.

Важно:
- токен не хранить в frontend;
- после настройки проверить:
  `curl -s "https://DOMAIN/news/index.php?ajax=1" | head -c 500`
- лог обновлений смотреть в:
  `news/.cache/news-refresh.log`

Если refresh-cron.php требует конкретную env-переменную или token:
- `news/proxy.php` использует `NEWS_REFRESH_TOKEN` (из env) для force-refresh.

## Что НЕ загружать на Timeweb

Не загружать:
- `node_modules/`
- `.git/`
- `.DS_Store`
- `dist/`
- `build/`
- `coverage/`
- `test-results/`
- `playwright-report/`
- `kxchat-server/`
- `*.log`
- `*.map`, если source maps не нужны
- `.env`
- `.env.*`
- backup-файлы: `*.bak`, `*.backup`, `*.old`
- временные PNG/JPEG, если они не используются в коде
- тестовые/diagnostic файлы, если они не нужны на проде

Команда сборки папки деплоя:

`mkdir -p ../keis-legalgroup-deploy`

`rsync -av --exclude 'node_modules' --exclude '.git' --exclude '.DS_Store' --exclude 'dist' --exclude 'build' --exclude 'coverage' --exclude 'test-results' --exclude 'playwright-report' --exclude 'kxchat-server' --exclude '*.log' --exclude '*.map' --exclude '.env' --exclude '.env.*' --exclude '*.bak' --exclude '*.backup' --exclude '*.old' ./ ../keis-legalgroup-deploy/`

Команда проверки секретов в deploy-папке:

`rg -n "BOT_TOKEN|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|[0-9]{8,}:[A-Za-z0-9_-]{20,}|OPENAI|SECRET|PASSWORD|TOKEN" ../keis-legalgroup-deploy`

Проверка, что служебные папки не попали в deploy-папку:

`find ../keis-legalgroup-deploy -maxdepth 3 -type d \( -name "test-results" -o -name "playwright-report" -o -name "kxchat-server" \)`
