# Быстрый старт: локальная разработка за 15 минут

**Что вы получите:** работающий фронтенд на `localhost:5173` и API на `localhost:3001` с демо-участниками и тестовым администратором.

**Что вы изучите:**

- Как устроен monorepo (Vue + Node)
- Где лежат конфигурация и данные
- Как войти в приложение локально

**Предварительные требования:**

- [ ] Node.js 20 LTS
- [ ] pnpm 9+ (`npm install -g pnpm`)
- [ ] Git (для клонирования репозитория)
- [ ] На Windows: для `better-sqlite3` может понадобиться [windows-build-tools](https://github.com/nodejs/node-gyp#on-windows) или Visual Studio Build Tools

---

## Шаг 1. Клонирование и установка зависимостей

Перейдите в каталог проекта и установите зависимости:

```bash
cd html
pnpm install
```

Вы должны увидеть успешную установку пакетов в корне и в `server/`.

> **Совет:** Если `pnpm install` падает на `better-sqlite3`, на Linux выполните `sudo apt install build-essential python3`.

---

## Шаг 2. Конфигурация окружения

Скопируйте шаблон и включите mock-режим CRM (без реального сервера CRM):

```bash
cp .env.example server/.env
```

Откройте `server/.env` и убедитесь, что задано:

```env
CRM_MOCK=true
JWT_SECRET=dev-only-change-before-production-min-32-chars
SEED_USER_LOGIN=admin
SEED_USER_PASSWORD=admin
```

В mock-режиме API возвращает 4 демо-участника вместо списка из CRM.

---

## Шаг 3. Запуск фронтенда и API

Запустите оба процесса одной командой:

```bash
pnpm dev:all
```

| Сервис | URL | Назначение |
|--------|-----|------------|
| Фронтенд | http://localhost:5173 | Vue SPA |
| API | http://localhost:3001 | Fastify |

Vite проксирует `/api/*` на порт 3001 — отдельный CORS в dev не нужен.

Проверьте API:

```bash
curl -s http://localhost:3001/api/health
```

Ожидаемый ответ: `{"ok":true,...}`.

---

## Шаг 4. Вход в приложение

1. Откройте http://localhost:5173
2. Вас перенаправит на `/login`
3. Войдите:
   - **Логин:** `admin` (из `SEED_USER_LOGIN`)
   - **Пароль:** `admin` (из `SEED_USER_PASSWORD`)

При первом запуске API создаёт seed-пользователя в SQLite (`data/crm.sqlite`).

---

## Шаг 5. Проверка основных функций

1. **График** — на главной (`/`) отображается сетка по дням
2. **Создание мероприятия** — клик по ячейке времени → форма в slideover
3. **Участники** — в форме должен быть список (4 демо в mock-режиме)
4. **Сохранение** — после F5 мероприятие остаётся на месте
5. **Журнал** — `/logs` доступен только под admin

Проверка участников через API:

```bash
curl -s -b cookies.txt -c cookies.txt \
  -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin"}'

curl -s -b cookies.txt http://localhost:3001/api/participants
```

В ответе поле `source` должно быть `"mock"` при `CRM_MOCK=true`.

---

## Шаг 6. Где лежат данные

| Путь | Содержимое |
|------|------------|
| `data/crm.sqlite` | SQLite: события, пользователи, логи |
| `data/uploads/` | Загруженные вложения |

Чтобы начать с чистой БД, остановите API и удалите `data/crm.sqlite` — при следующем запуске миграции применятся заново.

---

## Что вы построили

Локальное окружение monorepo:

- **Фронтенд** — Vue 3 SPA с file-based routing
- **API** — Fastify с SQLite и JWT-cookie
- **Интеграция** — mock CRM для офлайн-разработки

## Дальше

- [Архитектура](./03-architecture.md) — слои и потоки данных
- [Фронтенд](./04-frontend.md) — структура `src/`
- [API](./05-api-reference.md) — полный справочник эндпоинтов
- [Интеграция с CRM](./11-crm-integration.md) — подключение к реальному CRM
