# Устранение неполадок

Справочник типичных проблем и их решений. Формат: **симптом → причина → действие**.

---

## Сборка и зависимости

### `pnpm install` падает на `better-sqlite3`

**Причина:** нет компилятора для native-модуля.

**Решение (Linux):**

```bash
sudo apt install build-essential python3
pnpm install
```

**Решение (Windows):** установите Visual Studio Build Tools с компонентом «Desktop development with C++».

---

## API не отвечает

### `/api/` возвращает 502 Bad Gateway

**Причина:** Node API не запущен или слушает другой порт.

**Действия:**

```bash
sudo systemctl status grafic-api
sudo systemctl start grafic-api
curl -s http://127.0.0.1:3001/api/health
journalctl -u grafic-api -n 50 --no-pager
```

Проверьте `PORT=3001` в `server/.env` и proxy в nginx.

### API не стартует: `Invalid environment (production)`

**Причина:** сработали production guards.

**Решение:** в `server/.env`:

- `JWT_SECRET` — минимум 32 символа, не `dev-only-change-before-production`
- `SEED_USER_PASSWORD` — не `admin`
- `SEED_USER_EMAIL` — не оканчивается на `@local`

---

## Участники и CRM

### Список участников пустой или 502

**Причина:** `crm_participants.php` недоступен или неверный секрет.

**Действия:**

1. Проверьте файл на CRM
2. `CRM_SYNC_SECRET` = `CRM_LOOKUP_SECRET` на CRM
3. С сервера grafic:

```bash
curl -sk -H "X-Sync-Secret: СЕКРЕТ" "https://crm.admsr.ru/crm_participants.php"
```

### В списке только 4 демо (Константинов, Иванова, …)

**Причина:** `CRM_MOCK=true` или не загружен `.env`.

**Решение:**

1. В `server/.env`: `CRM_MOCK=false`
2. Перезапуск: `sudo systemctl restart grafic-api`
3. `GET /api/participants` → `source` должен быть `http` или `mysql`

---

## Аутентификация

### Не пускает после входа / сразу редирект на login

**Причина:** невалидный JWT, CORS, cookie не сохраняется.

**Действия:**

1. DevTools → Network → проверьте `Set-Cookie` на `/api/auth/login`
2. `CORS_ORIGIN` должен совпадать с URL фронта
3. В production: HTTPS + `Secure` cookie
4. `journalctl -u grafic-api` — ошибки JWT

### SSO из CRM не работает

**Причина:** истёк токен (>60 с), неверный HMAC, replay.

**Действия:**

1. Синхронизация времени NTP на обоих серверах
2. Одинаковый секрет SSO/CRM_SYNC
3. Повторный переход из CRM (токен одноразовый)

---

## Фронтенд

### Белая страница

**Причина:** нет сборки или неверный `root` в nginx.

**Действия:**

```bash
pnpm build
ls -la dist/index.html
# nginx root → html/dist
sudo nginx -t && sudo systemctl reload nginx
```

### Статика 404 на вложенном пути

**Причина:** неверный `base` при сборке для CRM.

**Решение:** `pnpm build:crm` с `VITE_BASE_PATH=/schedule/` в `.env.crm`.

---

## Почта

### `spawn sendmail ENOENT`

**Причина:** `MAIL_TRANSPORT=sendmail`, но sendmail не установлен.

**Решение:**

```env
MAIL_TRANSPORT=crm
CRM_MAIL_PATH=/crm_send_mail.php
```

Выложите `crm_send_mail.php` на CRM, перезапустите API.

### Письма не приходят

**Действия:**

1. `MAIL_ENABLED=true`
2. `curl` к `crm_send_mail.php` вручную
3. `journalctl -u grafic-api | grep -i mail`
4. Проверьте `MAIL_BLACKLIST`

---

## База данных

### Миграции не применились

**Причина:** нет прав на файл SQLite.

**Решение:**

```bash
sudo chown www-data:www-data /var/lib/crm-schedule/crm.sqlite
sudo systemctl restart grafic-api
```

### Потеря данных после деплоя

**Причина:** перезапись файла БД при деплое.

**Решение:** бэкап перед обновлением (`deploy.sh` делает автоматически). Восстановление:

```bash
sudo cp /var/lib/crm-schedule/backups/crm.sqlite.bak.YYYY-MM-DD-HHMMSS \
        /var/lib/crm-schedule/crm.sqlite
sudo systemctl restart grafic-api
```

---

## Логи и мониторинг

| Источник | Команда |
|----------|---------|
| API | `journalctl -u grafic-api -f` |
| nginx | `tail -f /var/log/nginx/error.log` |
| Health | `curl -s http://127.0.0.1:3001/api/health` |
| Smoke test | `pnpm smoke:server` |

---

## Быстрая диагностика (чеклист)

```bash
# 1. API жив
curl -s http://127.0.0.1:3001/api/health

# 2. Вход
curl -c /tmp/c.txt -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"ВАШ_ПАРОЛЬ"}'

# 3. Участники
curl -s -b /tmp/c.txt http://127.0.0.1:3001/api/participants | jq '.source'

# 4. События
curl -s -b /tmp/c.txt "http://127.0.0.1:3001/api/events?eventDate=$(date +%d.%m.%Y)"
```

---

## См. также

- [Развёртывание](./10-deployment.md)
- [Конфигурация](./09-configuration.md)
- [Интеграция с CRM](./11-crm-integration.md)
