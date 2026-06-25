# Развёртывание

Пошаговое руководство по установке на Ubuntu. Краткая версия — в [README.md](../README.md).

## Требования

| Компонент | Версия |
|-----------|--------|
| Ubuntu | 20.04 / 22.04 |
| Node.js | 20 LTS |
| pnpm | 9+ |
| nginx | с SSL |
| build-essential | для `better-sqlite3` |

```bash
sudo apt update
sudo apt install -y build-essential python3 curl nginx
```

---

## 1. Node.js и pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
```

---

## 2. Код приложения

```bash
sudo mkdir -p /var/www/grafic.admsr.ru
sudo chown $USER:$USER /var/www/grafic.admsr.ru
# git clone или rsync → /var/www/grafic.admsr.ru/html
cd /var/www/grafic.admsr.ru/html
pnpm install
```

---

## 3. Конфигурация

```bash
cp .env.example server/.env
nano server/.env
```

Обязательно для production — см. [Конфигурация](./09-configuration.md#production-checklist).

Каталоги данных:

```bash
sudo mkdir -p /var/lib/crm-schedule/uploads
sudo chown www-data:www-data /var/lib/crm-schedule
```

---

## 4. Сборка

```bash
pnpm build:server
pnpm build
```

Проверка:

```bash
curl -s http://127.0.0.1:3001/api/health
# Запустите API вручную или через systemd
```

---

## 5. systemd

Файл `/etc/systemd/system/grafic-api.service`:

```ini
[Unit]
Description=Grafic Schedule API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/grafic.admsr.ru/html/server
EnvironmentFile=/var/www/grafic.admsr.ru/html/server/.env
ExecStart=/usr/bin/node /var/www/grafic.admsr.ru/html/server/dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable grafic-api
sudo systemctl start grafic-api
sudo systemctl status grafic-api
```

Логи: `journalctl -u grafic-api -f`

---

## 6. nginx

Пример: `deploy/nginx-grafic.admsr.ru.conf`

```nginx
root /var/www/grafic.admsr.ru/html/dist;

location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 25m;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

```bash
sudo ln -s /path/to/deploy/nginx-grafic.admsr.ru.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Автоматический деплой

Скрипт `deploy/deploy.sh`:

```bash
cd /var/www/grafic.admsr.ru/html
./deploy/deploy.sh
```

Опции:

| Флаг | Описание |
|------|----------|
| `-b main` | Ветка для git pull |
| `-n`, `--dry-run` | Только показать шаги |
| `--skip-backup` | Без бэкапа SQLite |
| `--skip-pull` | Только сборка и перезапуск |

Шаги скрипта:

1. Бэкап SQLite (+ WAL/SHM)
2. `git pull --ff-only`
3. `pnpm install` + `build:server` + `build`
4. `systemctl restart grafic-api`
5. Poll `http://127.0.0.1:3001/api/health`

---

## 8. Проверка после деплоя

1. `systemctl status grafic-api` — active
2. https://grafic.admsr.ru/ — интерфейс
3. Вход под seed или CRM-учёткой
4. `GET /api/participants` → `source: "http"` (не `mock`)
5. Создать мероприятие → сохраняется после F5

---

## 9. Обновление версии (вручную)

```bash
cd /var/www/grafic.admsr.ru/html
sudo cp /var/lib/crm-schedule/crm.sqlite /var/lib/crm-schedule/crm.sqlite.bak.$(date +%F)
git pull
pnpm install
pnpm build:server && pnpm build
sudo systemctl restart grafic-api
```

---

## См. также

- [Интеграция с CRM](./11-crm-integration.md)
- [Устранение неполадок](./12-troubleshooting.md)
- [Конфигурация](./09-configuration.md)
