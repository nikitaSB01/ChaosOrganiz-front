# Chaos Organizer 🧠💬

[![Build status](https://ci.appveyor.com/api/projects/status/5321qam6p4qncdf4?svg=true)](https://ci.appveyor.com/project/nikitaSB01/chaosorganiz-front)

> Дипломный проект к курсу **«Продвинутый JavaScript в браузере»**

## 🚀 Демо

- [🌐 Веб-приложение (Frontend на GitHub Pages)](https://nikitasb01.github.io/ChaosOrganiz-front/)
- [🖥 Сервер (Backend на Render)](https://chaosorganiz-bac.onrender.com)

---

## 📦 Функциональность

### ✅ Обязательные функции

- 💬 Поддержка текстовых сообщений
- ![СМС](./src/assets/ввод-смс.png)
- ![СМС](./src/assets/отправка-смс.png)
- 🔗 Кликабельные ссылки (http/https)
- ![Кликабельные ссылки](./src/assets/клик.png)
- ![Кликабельные ссылки](./src/assets/клик2.png)
- 📎 Загрузка файлов (через иконку и drag & drop)
- ![drag & drop](./src/assets/нажатие-на-меню-загрузок.png)
- ![drag & drop](./src/assets/открытое-меню-загр.png)
- ![drag & drop](./src/assets/drop1.png)
- ![drag & drop](./src/assets/drop2.png)
- 🖼 Отображение изображений, видео, аудио, других файлов
- ![Отображение](./src/assets/отображение.png)
- 💾 Возможность скачивания загруженных файлов
- ![скачивания загруженных файлов](./src/assets/скачивание.png)
- 📜 История сообщений (сохранение на сервере, отображение на клиенте)
- ![История сообщений](./src/assets/история1.png)
- ![История сообщений](./src/assets/история2.png)
- ⏳ Ленивая подгрузка сообщений по 10 штук при скролле вверх
- ![Ленивая подгрузка](./src/assets/лень1.png)
- ![Ленивая подгрузка](./src/assets/лень2.png)

### ✨ Дополнительные функции

- 🔄 Синхронизация между вкладками (через WebSocket)
- ![WebSocket](./src/assets/WebSocket1.png)
- ![WebSocket](./src/assets/WebSocket2.png)
- ![WebSocket](./src/assets/WebSocket3.png)
- 🔍 Поиск по текстовым сообщениям (интерфейс + реализация)
- ![Поиск](./src/assets/поиск.png)
- 📍 Отправка геолокации (с открытием карты)
- ![Геометка](./src/assets/гео.png)
- ![Геометка](./src/assets/гео-2.png)
- ![Геометка](./src/assets/гео-3.png)
- 📌 Закрепление сообщений (только одно за раз)
- ![Закреп](./src/assets/избр+закреп.png)
- ![Закреп](./src/assets/закреп.png)
- ⭐ Добавление сообщений в избранное + просмотр избранного
- ![Избранное](./src/assets/избр+закреп.png)
- ![Избранное](./src/assets/избр-2.png)
- ![Избранное](./src/assets/избр-3.png)
- 🗂 Просмотр вложений по категориям (изображения, аудио, видео, другие)
- ![Категории](./src/assets/категории-1.png)
- ![Категории](./src/assets/категории-2.png)
- 🎙 Запись аудио через MediaRecorder API и отправка
- ![Аудио](./src/assets/аудио-1.png)
- ![Аудио](./src/assets/аудио-2.png)

---

## ⚙️ Технологии

### Frontend:

- HTML, CSS, JavaScript
- Webpack, Babel
- ESLint (Airbnb config)
- GitHub Pages (деплой)
- AppVeyor (CI/CD)

### Backend:

- Node.js + Koa
- WebSocket (ws)
- Koa-body для загрузки файлов
- Хранение данных в `messages.json`
- Render (деплой сервера)
