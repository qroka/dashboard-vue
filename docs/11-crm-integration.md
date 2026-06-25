# Интеграция с CRM

Приложение grafic.admsr.ru работает рядом с legacy CRM на **crm.admsr.ru** (`172.17.30.42`). CRM остаётся источником истины для сотрудников и аутентификации; grafic хранит только график мероприятий.

## Схема взаимодействия

```text
┌─────────────────────┐                    ┌─────────────────────┐
│  crm.admsr.ru       │                    │  grafic.admsr.ru    │
│  (PHP + MySQL)      │                    │  (Vue + Node)       │
├─────────────────────┤                    ├─────────────────────┤
│  config.php         │  ссылка в меню     │  /login             │
│  schedule.php       │ ─── SSO #sso= ──► │  /api/auth/crm-sso  │
│  crm_lookup.php     │ ◄── password ──── │  /api/auth/login    │
│  crm_participants   │ ◄── X-Sync-Secret │  /api/participants  │
│  crm_send_mail.php  │ ◄── X-Sync-Secret │  notification-mail  │
│  MySQL user table   │ ◄── optional ───── │  crm-participants   │
└─────────────────────┘                    └─────────────────────┘
```

На CRM **не устанавливаются** Node.js и статика grafic.

---

## Общий секрет

| grafic | CRM (php-fpm) |
|--------|---------------|
| `CRM_SYNC_SECRET` | `CRM_LOOKUP_SECRET` |

Используется в:

- `crm_lookup.php` — аутентификация
- `crm_participants.php` — список сотрудников
- `crm_send_mail.php` — отправка почты
- SSO HMAC (если не задан `SCHEDULE_SSO_SECRET`)

Генерация:

```bash
openssl rand -hex 24
```

На CRM в nginx/fastcgi:

```nginx
fastcgi_param CRM_LOOKUP_SECRET "ваш-секрет";
```

---

## Эндпоинты CRM (PHP)

### `crm_lookup.php`

**Назначение:** проверка логина/пароля.

**Вызывается из:** `POST /api/auth/login`, `POST /api/auth/crm-bridge`

**Конфиг grafic:** `CRM_LOOKUP_URL`

**Ответ (успех):** JSON с полями пользователя: `id`, `login`, `fio`, `email`, `u_prem9`, `u_is_zam`, `u_zam_id`, …

### `crm_participants.php`

**Назначение:** список сотрудников для выбора участников.

**Заголовок:** `X-Sync-Secret: <CRM_SYNC_SECRET>`

**Конфиг grafic:**

```env
CRM_BASE_URL=https://crm.admsr.ru
CRM_PARTICIPANTS_PATH=/crm_participants.php
CRM_HOST_HEADER=crm.admsr.ru
```

**Проверка с сервера grafic:**

```bash
curl -sk -H "X-Sync-Secret: ВАШ_СЕКРЕТ" \
  "https://crm.admsr.ru/crm_participants.php" | head
```

Ожидается: `{"success":true,"participants":[...]}`

**Ответ API grafic:** поле `source` = `"http"`.

### `crm_send_mail.php`

**Назначение:** отправка email (postfix на grafic не нужен).

**Конфиг grafic:**

```env
MAIL_ENABLED=true
MAIL_TRANSPORT=crm
CRM_MAIL_PATH=/crm_send_mail.php
```

### `schedule.php`

**Назначение:** редирект в grafic с SSO-токеном.

**URL в CRM:** переменная `$GRAFIC_SCHEDULE_URL` в `config.php` → `https://grafic.admsr.ru/`

**Формат токена:** base64url(payload).base64url(hmac_sha256)

Payload включает: `uid`, `login`, `fio`, `exp`, `iat`, `u_prem9`, …

---

## Прямой MySQL (альтернатива HTTP)

Если с grafic есть доступ к `172.17.30.42:3306`:

```env
CRM_DB_HOST=172.17.30.42
CRM_DB_USER=...
CRM_DB_PASSWORD=...
CRM_DB_NAME=crm
```

Сервис `crm-participants.ts` предпочитает MySQL перед HTTP.

**Запись** в CRM (`/api/crm-users` POST/PATCH) требует `CRM_DB_WRITABLE=true`.

---

## Mock-режим (разработка)

```env
CRM_MOCK=true
```

Возвращает 4 демо-участника. В ответе `GET /api/participants` поле `source` = `"mock"`.

**Не используйте в production.**

---

## Поле `u_prem9` в CRM

Уровень доступа к графику в таблице `user`:

| Значение | Роль в графике |
|----------|----------------|
| 0 | Исполнитель (просмотр) |
| 1 | Руководитель (просмотр) |
| 2 | Администратор |
| 3 | Заместитель |
| 4 | Помощник заместителя |

Подробнее: [Права доступа](./07-permissions.md).

---

## Ссылка из меню CRM

В `config.php` CRM задаётся URL графика. Пользователь переходит по ссылке → `schedule.php` → SSO → grafic.

Альтернатива: прямой вход на `https://grafic.admsr.ru/login` с CRM-учёткой.

---

## Диагностика интеграции

| Симптом | Проверка |
|---------|----------|
| Участники пустые | `curl` к `crm_participants.php`, секрет, логи API |
| `source: mock` в prod | `CRM_MOCK=false` в `server/.env`, перезапуск |
| Login 503 | CRM недоступен, `CRM_LOOKUP_URL` |
| SSO не работает | Часы серверов, max 60 с, секрет, `sso_used_tokens` |
| Почта не уходит | `MAIL_TRANSPORT=crm`, `crm_send_mail.php`, journalctl |

---

## См. также

- [Аутентификация](./06-authentication.md)
- [Конфигурация](./09-configuration.md)
- [Устранение неполадок](./12-troubleshooting.md)
