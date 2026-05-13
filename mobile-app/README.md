# Verdant Relay Mobile

Мобильная оболочка для backend сервиса управления Arduino-мостом.

Стек:

- `Expo`
- `React Native`
- `TypeScript`
- `Expo Router`

## Что уже есть

- визуальная shell-структура приложения;
- вкладки `Overview`, `Devices`, `Activity`;
- детальный экран устройства;
- базовый конфиг backend URL;
- mock snapshot, на который можно безопасно опираться до подключения живого API.

## Запуск

```bash
cd mobile-app
npm install
npx expo start
```

Для Android-эмулятора нажми `a` в терминале Expo после старта dev server.

## VS Code

Рекомендуемые расширения:

- `Expo Tools`
- `React Native Tools`
- `ESLint`
- `Prettier`

## Backend URL

По умолчанию приложение ведёт себя так:

- `web`: берёт текущий хост браузера и обращается к нему на порт `8080`
- `native`: использует `http://127.0.0.1:8080`

Сейчас это задаётся через `app.json -> expo.extra`.

Можно использовать:

- `backendUrlWeb`
- `backendUrlNative`
- `backendUrl`

Практически это выглядит так:

- локально в браузере с ноутбука `backendUrlWeb` можно не задавать;
- на телефоне в одной сети `backendUrlNative` лучше заменить на `http://192.168.x.x:8080`;
- через туннель стоит явно указать публичный домен в `backendUrlWeb` и при необходимости в `backendUrlNative`.

## Сборка APK

Подготовлен файл `eas.json`. Когда приложение будет подключено к живому backend:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Профиль `preview` собирает `apk`, который можно установить напрямую на Android.
