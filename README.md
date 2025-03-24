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
- 🔗 Кликабельные ссылки (http/https)
- 📎 Загрузка файлов (через иконку и drag & drop)
- 🖼 Отображение изображений, видео, аудио, других файлов
- 💾 Возможность скачивания загруженных файлов
- 📜 История сообщений (сохранение на сервере, отображение на клиенте)
- ⏳ Ленивая подгрузка сообщений по 10 штук при скролле вверх

### ✨ Дополнительные функции

- 🔄 Синхронизация между вкладками (через WebSocket)
- 🔍 Поиск по текстовым сообщениям (интерфейс + реализация)
- 📍 Отправка геолокации (с открытием карты)
- 📌 Закрепление сообщений (только одно за раз)
- ⭐ Добавление сообщений в избранное + просмотр избранного
- 🗂 Просмотр вложений по категориям (изображения, аудио, видео, другие)
- 🎙 Запись аудио через MediaRecorder API и отправка

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
