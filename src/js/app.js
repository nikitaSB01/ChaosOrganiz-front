import "../css/style.css";

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");
const floatingDate = document.getElementById("floating-date");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-search");

const allMessages = [];
let pinnedMessage = null;
const CHUNK_SIZE = 10;
let renderStart = 0;

const API_URL = "http://localhost:7070/messages";
const UPLOAD_URL = "http://localhost:7070/upload";
const FILE_BASE_URL = "http://localhost:7070";
const WS_URL = "ws://localhost:7070";
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

function renderMessages(messagesList, append = false, scrollToBottom = false) {
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
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = true;
        link.textContent = `📎 ${msg.text.split("/").pop()}`;
        link.target = "_blank";
        msgBlock.appendChild(link);
      }
    }

    const timeTag = document.createElement("span");
    timeTag.classList.add("timestamp");
    timeTag.textContent = timeLabel;
    msgBlock.appendChild(timeTag);
    msgBlock.id = `msg-${msg.id}`;

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper");

    const pinBtn = document.createElement("button");
    const starBtn = document.createElement("button");
    starBtn.classList.add("star-btn");
    starBtn.textContent = "⭐";
    starBtn.title = "Добавить в избранное";

    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    const isFavorite = favorites.some((fav) => fav.id === msg.id);
    if (isFavorite) {
      starBtn.classList.add("active");
    }

    starBtn.addEventListener("click", () => {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      const updated = stored.some((f) => f.id === msg.id)
        ? stored.filter((f) => f.id !== msg.id)
        : [...stored, msg];

      localStorage.setItem("favorites", JSON.stringify(updated));
      renderMessages(allMessages.slice(renderStart)); // обновим отрисовку
    });

    wrapper.appendChild(starBtn); // ДО pinBtn.appendChild(msgBlock)

    pinBtn.classList.add("pin-btn");
    pinBtn.textContent = "📌";
    pinBtn.title = "Закрепить";
    pinBtn.addEventListener("click", () => {
      pinnedMessage = msg;
      localStorage.setItem("pinnedMessage", JSON.stringify(msg));
      renderPinned();
    });

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
  // 👇 Добавь это
  setTimeout(() => {
    updateFloatingDate();
  }, 0);
  /*   updateFloatingDate(); // Показываем дату сразу  */
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
    const imgs = messages.querySelectorAll("img");
    if (imgs.length) {
      let loaded = 0;
      imgs.forEach((img) => {
        if (img.complete) {
          loaded += 1;
        } else {
          img.addEventListener("load", () => {
            loaded += 1;
            if (loaded === imgs.length) {
              messages.scrollTop = messages.scrollHeight;
            }
          });
        }
      });

      // если все уже загружены
      if (loaded === imgs.length) {
        messages.scrollTop = messages.scrollHeight;
      }
    } else {
      // если изображений нет — прокручиваем сразу
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
    const label = e.currentTarget.textContent.trim();

    if (label.includes("Избранное")) {
      const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
      renderMessages(favs, false, true);
    } else {
      renderStart = Math.max(0, allMessages.length - CHUNK_SIZE);
      const chunk = allMessages.slice(renderStart);
      renderMessages(chunk, false, true);
    }
  });
});
