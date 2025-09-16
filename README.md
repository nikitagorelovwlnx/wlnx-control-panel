# WLNX Control Panel

Легковесный браузерный интерфейс на TypeScript для отображения данных из [wlnx-api-server](https://github.com/nikitagorelovwlnx/wlnx-api-server).

## Возможности

- 👥 **Пользователи** - просмотр списка пользователей с их статусами
- 💬 **Интервью** - переписка во время интервью в реальном времени
- 📋 **Саммари** - сводки и результаты интервью

## Технологии

- TypeScript
- Vanilla JavaScript (без фреймворков)
- Modern CSS
- ES Modules

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Сборка проекта
```bash
npm run build
```

### 3. Запуск в режиме разработки
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### 4. Продакшен
```bash
npm run start
```

## Структура проекта

```
wlnx-control-panel/
├── src/
│   ├── api/
│   │   └── client.ts          # API клиент для взаимодействия с сервером
│   ├── components/
│   │   ├── UsersList.ts       # Компонент списка пользователей
│   │   ├── ChatView.ts        # Компонент переписки
│   │   └── SummaryView.ts     # Компонент саммари
│   ├── types/
│   │   └── api.ts            # TypeScript интерфейсы
│   ├── styles/
│   │   └── main.css          # Основные стили
│   └── index.ts              # Главный файл приложения
├── dist/                     # Скомпилированные файлы
├── index.html               # Основная HTML страница
├── package.json
└── tsconfig.json
```

## Настройка API

По умолчанию приложение подключается к API серверу по адресу `http://localhost:8000`.

Для изменения адреса API сервера отредактируйте файл `src/api/client.ts`:

```typescript
constructor(baseUrl: string = 'YOUR_API_URL') {
    this.baseUrl = baseUrl;
}
```

## Ожидаемые API эндпоинты

Приложение ожидает следующие эндпоинты от API сервера:

- `GET /api/health` - проверка состояния API
- `GET /api/users` - список пользователей
- `GET /api/interviews` - список интервью
- `GET /api/interviews/{id}/messages` - сообщения интервью
- `GET /api/interviews/{id}/summary` - саммари интервью

## Особенности

- ✅ Адаптивный дизайн для мобильных устройств
- ✅ Автоматическая проверка подключения к API
- ✅ Обработка ошибок и состояний загрузки
- ✅ Современный Material Design интерфейс
- ✅ Без авторизации (как требовалось)
- ✅ Легковесность - минимум зависимостей

## Разработка

### Команды

- `npm run build` - сборка TypeScript в JavaScript
- `npm run dev` - режим разработки с автоперезагрузкой
- `npm run start` - запуск статического сервера
- `npm run type-check` - проверка типов без сборки

### Добавление новых функций

1. Добавьте новые типы в `src/types/api.ts`
2. Обновите API клиент в `src/api/client.ts`
3. Создайте новый компонент в `src/components/`
4. Обновите главное приложение в `src/index.ts`

## Лицензия

MIT
