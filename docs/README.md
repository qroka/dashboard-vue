# Техническая документация — График заместителей

> Веб-приложение для ведения графика мероприятий заместителей администрации Саратовской области.

**Домен:** [grafic.admsr.ru](https://grafic.admsr.ru)  
**Интеграция:** [crm.admsr.ru](https://crm.admsr.ru) (legacy PHP CRM)

---

## О чём эта документация

Вы найдёте здесь всё необходимое для разработки, сопровождения и развёртывания проекта. Документация организована по [системе Divio](https://docs.divio.com/documentation-system/):

| Тип | Для кого | Файлы |
|-----|----------|-------|
| **Обзор** | Руководители, новые разработчики | [Обзор системы](./01-overview.md) |
| **Tutorial** | Первый запуск за 15 минут | [Быстрый старт](./02-getting-started.md) |
| **Explanation** | Понимание архитектуры и бизнес-логики | [Архитектура](./03-architecture.md), [Аутентификация](./06-authentication.md), [Права доступа](./07-permissions.md), [Интеграция с CRM](./11-crm-integration.md) |
| **How-to** | Конкретные задачи | [Развёртывание](./10-deployment.md), [Устранение неполадок](./12-troubleshooting.md) |
| **Reference** | Справочник API, БД, конфигурации | [API](./05-api-reference.md), [База данных](./08-database.md), [Конфигурация](./09-configuration.md), [Фронтенд](./04-frontend.md) |

---

## Быстрые ссылки

```bash
# Локальная разработка
pnpm install && cp .env.example server/.env
pnpm dev:all
# → http://localhost:5173 (фронт), http://localhost:3001 (API)
```

| Команда | Назначение |
|---------|------------|
| `pnpm dev` | Vite dev-сервер (фронтенд) |
| `pnpm dev:server` | API в watch-режиме |
| `pnpm dev:all` | Фронт + API параллельно |
| `pnpm build` | Сборка SPA → `dist/` |
| `pnpm build:server` | Сборка API → `server/dist/` |
| `pnpm typecheck` | Проверка типов (Vue + Node) |
| `pnpm test:server` | Тесты серверной части |

---

## Структура репозитория

```text
html/
├── src/                  Vue 3 SPA (график, журнал, уведомления)
├── server/               Node.js API (Fastify)
│   ├── src/              Исходники TypeScript
│   ├── db/migrations/    SQL-миграции SQLite
│   └── dist/             Скомпилированный API
├── dist/                 Собранный фронтенд (nginx root)
├── data/                 SQLite и uploads (локальная разработка)
├── deploy/               nginx-конфиг и скрипт деплоя
└── docs/                 Эта документация
```

---

## Связанные материалы

- [README.md](../README.md) — краткое руководство по развёртыванию на Ubuntu
- [.env.example](../.env.example) — шаблон переменных окружения
- [server/.env.example](../server/.env.example) — production-конфиг API
