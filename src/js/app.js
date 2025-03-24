import "../css/style.css";
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("message-form");
  const input = document.getElementById("message-input");
  const messages = document.getElementById("messages");
  const attachBtn = document.getElementById("attach-btn");
  const fileInput = document.getElementById("file-input");
  const floatingDate = document.getElementById("floating-date");
  const searchInput = document.getElementById("search-input");
  const clearBtn = document.getElementById("clear-search");
  const recordBtn = document.getElementById("record-btn");
  const recordModal = document.getElementById("record-modal");
  const stopRecordBtn = document.getElementById("stop-record-btn");

  const allMessages = [];
  let pinnedMessage = null;
  const CHUNK_SIZE = 10;
  let renderStart = 0;

  const API_URL = "https://chaosorganiz-bac.onrender.com/messages";
  const UPLOAD_URL = "https://chaosorganiz-bac.onrender.com/upload";
  const FILE_BASE_URL = "https://chaosorganiz-bac.onrender.com";

  const WS_URL = "wss://chaosorganiz-bac.onrender.com";
  const socket = new WebSocket(WS_URL);

  // Восстанавливаем закреплённое сообщение
  const savedPinned = localStorage.getItem("pinnedMessage");
  if (savedPinned) {
    try {
      pinnedMessage = JSON.parse(savedPinned);
    } catch (e) {
      pinnedMessage = null;
    }
  }

  function parseLinks(text) {
    const urlRegex = /((https?:\/\/)[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      const cleanUrl = url.replace(/<\/?[^>]+(>|$)/g, "");
      return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
    });
  }

  function renderPinned() {
    const container = document.getElementById("pinned-container");
    container.innerHTML = "";

    if (!pinnedMessage) {
      container.style.display = "none";
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("pinned-wrapper");

    const content = document.createElement("div");
    content.classList.add("message", "self", "pinned-message");

    const linkToOriginal = document.createElement("a");
    linkToOriginal.href = `#msg-${pinnedMessage.id}`;
    linkToOriginal.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById(`msg-${pinnedMessage.id}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("highlighted");
        setTimeout(() => target.classList.remove("highlighted"), 1500);
      }
    });

    linkToOriginal.classList.add("pinned-link");
    if (pinnedMessage.type === "text") {
      const shortText =
        pinnedMessage.text.length > 20
          ? `${pinnedMessage.text.slice(0, 20)}...`
          : pinnedMessage.text;
      linkToOriginal.textContent = shortText;
    } else if (pinnedMessage.type === "file") {
      const ext = pinnedMessage.text.toLowerCase();
      if (/\.(jpe?g|png|gif|webp)$/i.test(ext)) {
        linkToOriginal.textContent = "Изображение";
      } else if (/\.(mp4|webm|mov)$/i.test(ext)) {
        linkToOriginal.textContent = "Видео";
      } else {
        linkToOriginal.textContent = "Файл";
      }
    } else if (pinnedMessage.type === "geo") {
      const [lat, lon] = pinnedMessage.text.split(",");
      linkToOriginal.textContent = `📍 Геолокация (${lat}, ${lon})`;
    }

    content.appendChild(linkToOriginal);

    const unpin = document.createElement("button");
    unpin.classList.add("unpin-btn");
    unpin.textContent = "✖";
    unpin.title = "Открепить";
    unpin.addEventListener("click", () => {
      pinnedMessage = null;
      localStorage.removeItem("pinnedMessage");
      renderPinned();
    });

    wrapper.appendChild(content);
    wrapper.appendChild(unpin);
    container.appendChild(wrapper);
    container.style.display = "block";
  }

  function updateFloatingDate() {
    const dateHeaders = [...messages.querySelectorAll(".date-header")];
    const parentRect = messages.getBoundingClientRect();

    let currentDate = null;

    for (let i = dateHeaders.length - 1; i >= 0; i -= 1) {
      const rect = dateHeaders[i].getBoundingClientRect();
      if (rect.top < parentRect.top + 30) {
        currentDate = dateHeaders[i].textContent;
        break;
      }
    }

    if (!currentDate && dateHeaders.length > 0) {
      currentDate = dateHeaders[0].textContent;
    }

    if (currentDate) {
      floatingDate.textContent = currentDate;
      floatingDate.style.display = "block";
    } else {
      floatingDate.style.display = "none";
    }
  }

  messages.addEventListener("scroll", updateFloatingDate);

  function renderMessages(
    messagesList,
    append = false,
    scrollToBottom = false
  ) {
    if (!append) messages.innerHTML = "";

    const container = document.createDocumentFragment();

    const firstByDate = new Map();
    messagesList.forEach((msg) => {
      const date = new Date(msg.date).toLocaleDateString("ru-RU");
      if (!firstByDate.has(date)) {
        firstByDate.set(date, msg.id);
      }
    });

    messagesList.forEach((msg) => {
      if (document.getElementById(`msg-${msg.id}`)) return;

      const dateLabel = new Date(msg.date).toLocaleDateString("ru-RU");
      const timeLabel = new Date(msg.date).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (firstByDate.get(dateLabel) === msg.id) {
        const dateHeader = document.createElement("div");
        dateHeader.classList.add("date-header");
        dateHeader.setAttribute("data-date", dateLabel);
        dateHeader.textContent = dateLabel;
        container.appendChild(dateHeader);
      }

      const msgBlock = document.createElement("div");
      msgBlock.classList.add("message", "self");

      if (msg.type === "text") {
        msgBlock.innerHTML = parseLinks(msg.text);
      } else if (msg.type === "file") {
        const url = `${FILE_BASE_URL}${msg.text}`;

        if (/\.(jpe?g|png|gif|webp)$/i.test(msg.text)) {
          const img = document.createElement("img");
          img.src = url;
          img.style.maxWidth = "200px";
          img.style.borderRadius = "8px";
          msgBlock.appendChild(img);
        } else if (/\.(mp4|webm|mov)$/i.test(msg.text)) {
          const video = document.createElement("video");
          video.src = url;
          video.controls = true;
          video.style.maxWidth = "250px";
          msgBlock.appendChild(video);
        } else if (/\.(mp3|wav|ogg|m4a)$/i.test(msg.text)) {
          const audio = document.createElement("audio");
          audio.src = url;
          audio.controls = true;
          msgBlock.appendChild(audio);
        } else {
          const link = document.createElement("a");
          link.href = url;
          link.download = true;
          link.textContent = `📎 ${msg.text.split("/").pop()}`;
          link.target = "_blank";
          msgBlock.appendChild(link);
        }
      } else if (
        msg.type === "geo" ||
        (msg.text && msg.text.includes(",") && !msg.type)
      ) {
        const [lat, lon] = msg.text.split(",");
        const link = document.createElement("a");
        link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
        link.target = "_blank";
        link.textContent = `📍 Геолокация (${lat}, ${lon})`;
        msgBlock.appendChild(link);
      }

      const timeTag = document.createElement("span");
      timeTag.classList.add("timestamp");
      timeTag.textContent = timeLabel;
      msgBlock.appendChild(timeTag);
      msgBlock.id = `msg-${msg.id}`;

      const wrapper = document.createElement("div");
      wrapper.classList.add("message-wrapper");

      // ⭐ Избранное
      const starBtn = document.createElement("button");
      starBtn.classList.add("star-btn");
      starBtn.innerHTML = "☆";
      starBtn.title = "Добавить в избранное";

      const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      const isFavorite = favorites.some((fav) => fav.id === msg.id);
      if (isFavorite) {
        starBtn.classList.add("active");
        starBtn.innerHTML = "★";
      }

      starBtn.addEventListener("click", () => {
        const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
        const index = stored.findIndex((f) => f.id === msg.id);
        if (index >= 0) {
          stored.splice(index, 1);
        } else {
          stored.push(msg);
        }

        localStorage.setItem("favorites", JSON.stringify(stored));

        const isInFavoritesView = document
          .querySelector(".sidebar li.active")
          ?.textContent.includes("Избранное");

        if (isInFavoritesView) {
          renderMessages(stored, false, true);
        } else {
          renderMessages(allMessages.slice(renderStart));
        }
      });

      // 📌 Закрепление
      const pinBtn = document.createElement("button");
      pinBtn.classList.add("pin-btn");
      pinBtn.textContent = "📌";
      pinBtn.title = "Закрепить";
      pinBtn.addEventListener("click", () => {
        pinnedMessage = msg;
        localStorage.setItem("pinnedMessage", JSON.stringify(msg));
        renderPinned();
      });

      wrapper.appendChild(starBtn);
      wrapper.appendChild(pinBtn);
      wrapper.appendChild(msgBlock);
      container.appendChild(wrapper);
    });

    if (!append) {
      messages.appendChild(container);
    } else {
      messages.prepend(container);
    }

    if (scrollToBottom) {
      messages.scrollTop = messages.scrollHeight;
    }

    setTimeout(() => {
      updateFloatingDate();
    }, 0);
  }

  // 🔁 Lazy loading
  messages.addEventListener("scroll", () => {
    if (messages.scrollTop === 0 && renderStart > 0) {
      const prevHeight = messages.scrollHeight;
      const newStart = Math.max(0, renderStart - CHUNK_SIZE);
      renderStart = newStart;
      const chunk = allMessages.slice(renderStart, renderStart + CHUNK_SIZE);
      renderMessages(chunk, true);
      messages.scrollTop = messages.scrollHeight - prevHeight;
    }
  });

  // 📡 WebSocket
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    allMessages.push(msg);
    allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (searchInput.value.trim()) return;
    const isNearBottom =
      messages.scrollHeight - messages.scrollTop - messages.clientHeight < 50;
    const chunk = allMessages.slice(-CHUNK_SIZE);
    renderStart = Math.max(0, allMessages.length - CHUNK_SIZE);
    renderMessages(chunk, false, isNearBottom);
  });

  // 📤 Отправка
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      input.value = "";
    } catch (err) {
      console.error("Ошибка отправки:", err);
    }
  });

  // 📎 Загрузка файла
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Ошибка загрузки файла:", err);
    }
  }

  attachBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    [...fileInput.files].forEach(uploadFile);
    fileInput.value = "";
  });

  messages.addEventListener("dragover", (e) => {
    e.preventDefault();
    messages.style.border = "2px dashed #007bff";
  });
  messages.addEventListener("dragleave", () => {
    messages.style.border = "1px solid #ccc";
  });
  messages.addEventListener("drop", (e) => {
    e.preventDefault();
    messages.style.border = "1px solid #ccc";
    [...e.dataTransfer.files].forEach(uploadFile);
  });

  // 📥 Получение сообщений
  async function fetchMessages() {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      allMessages.length = 0;
      allMessages.push(
        ...data.sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      renderStart = Math.max(0, allMessages.length - CHUNK_SIZE);
      const chunk = allMessages.slice(renderStart);
      renderMessages(chunk, false, true);

      // после рендера подождём загрузки всех изображений и прокрутим вниз
      // после рендера подождём загрузки всех изображений и прокрутим вниз
      const mediaElements = messages.querySelectorAll("img, video, audio");

      if (mediaElements.length) {
        let loaded = 0;

        mediaElements.forEach((el) => {
          const onLoaded = () => {
            loaded += 1;
            if (loaded === mediaElements.length) {
              messages.scrollTop = messages.scrollHeight;
            }
          };

          if (el.tagName === "IMG") {
            el.complete ? onLoaded() : el.addEventListener("load", onLoaded);
          } else {
            el.readyState >= 2
              ? onLoaded()
              : el.addEventListener("loadeddata", onLoaded);
          }
        });

        if (loaded === mediaElements.length) {
          messages.scrollTop = messages.scrollHeight;
        }
      } else {
        messages.scrollTop = messages.scrollHeight;
      }

      renderPinned();

      // 👇 Добавь это
      setTimeout(() => {
        updateFloatingDate();
      }, 0);
    } catch (err) {
      console.error("Ошибка при загрузке сообщений:", err);
    }

    // ✅ Покажем дату сразу после загрузки
    /*   updateFloatingDate(); */
  }

  fetchMessages();

  // 🔍 Поиск
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
      const chunk = allMessages.slice(renderStart);
      renderMessages(chunk, false, true);
      return;
    }
    const filtered = allMessages.filter(
      (msg) => msg.type === "text" && msg.text.toLowerCase().includes(term)
    );
    renderStart = 0;
    renderMessages(filtered);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderStart = Math.max(0, allMessages.length - CHUNK_SIZE);
    const chunk = allMessages.slice(renderStart);
    renderMessages(chunk, false, true);
  });

  /*  Добавим обработчик клика по «⭐ Избранное» в сайдбаре: */
  document.querySelectorAll(".sidebar li").forEach((item) => {
    item.addEventListener("click", (e) => {
      // сброс активного класса
      document
        .querySelectorAll(".sidebar li")
        .forEach((li) => li.classList.remove("active"));
      e.currentTarget.classList.add("active");

      const label = e.currentTarget.textContent.trim();

      if (label.includes("Избранное")) {
        const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
        renderMessages(favs, false, true);
      } else if (label.includes("Все")) {
        renderStart = Math.max(0, allMessages.length - CHUNK_SIZE);
        const chunk = allMessages.slice(renderStart);
        renderMessages(chunk, false, true);
      } else if (label.includes("Изображения")) {
        const imgs = allMessages.filter(
          (msg) =>
            msg.type === "file" && /\.(jpe?g|png|gif|webp)$/i.test(msg.text)
        );
        renderMessages(imgs, false, true);
      } else if (label.includes("Аудио")) {
        const audios = allMessages.filter(
          (msg) => msg.type === "file" && /\.(mp3|wav|ogg|m4a)$/i.test(msg.text)
        );
        renderMessages(audios, false, true);
      } else if (label.includes("Видео")) {
        const videos = allMessages.filter(
          (msg) => msg.type === "file" && /\.(mp4|webm|mov)$/i.test(msg.text)
        );
        renderMessages(videos, false, true);
      } else {
        // fallback
        renderStart = Math.max(0, allMessages.length - CHUNK_SIZE);
        const chunk = allMessages.slice(renderStart);
        renderMessages(chunk, false, true);
      }
    });
  });

  /* гео */
  const geoBtn = document.getElementById("geo-btn");

  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Геолокация не поддерживается вашим браузером.");
        return;
      }

      geoBtn.disabled = true;
      geoBtn.textContent = "⏳";

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordsText = `${latitude},${longitude}`;

          try {
            await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: coordsText, type: "geo" }),
            });
          } catch (err) {
            console.error("Ошибка при отправке координат:", err);
          } finally {
            geoBtn.disabled = false;
            geoBtn.textContent = "📍";
          }
        },
        () => {
          alert("Не удалось получить геолокацию.");
          geoBtn.disabled = false;
          geoBtn.textContent = "📍";
        }
      );
    });
  }
  let mediaRecorder;
  let audioChunks = [];

  recordBtn.addEventListener("click", async () => {
    console.log("клик по аудио");

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Ваш браузер не поддерживает запись аудио");
      return;
    }
    console.log("клик по аудио 2");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.onstart = () => {
        console.log("🔴 Запись пошла");
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("💾 Запись завершена, отправляю файл...");
        const blob = new Blob(audioChunks, { type: "audio/ogg" });
        const file = new File([blob], `recording-${Date.now()}.ogg`, {
          type: "audio/ogg",
        });
        await uploadFile(file);
      };

      mediaRecorder.start();
      recordModal.style.display = "flex";

      // закрытие по фону
      recordModal.addEventListener("click", (e) => {
        if (e.target === recordModal) stopRecording();
      });
    } catch (err) {
      console.error(
        "❌ Ошибка при получении доступа к микрофону или записи:",
        err
      );
    }
  });

  stopRecordBtn.addEventListener("click", () => {
    stopRecording();
  });

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      console.log("⏹ запись остановлена");
      mediaRecorder.stop();
      recordModal.style.display = "none";
    }
  }
});
