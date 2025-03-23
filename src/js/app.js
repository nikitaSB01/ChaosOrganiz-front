import "../css/style.css";

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");
const allMessages = []; // для хранения всех сообщений
let pinnedMessage = null;
const CHUNK_SIZE = 10;
let renderStart = 0;
let loadedMessagesCount = 0;

const API_URL = "http://localhost:7070/messages";
const UPLOAD_URL = "http://localhost:7070/upload";
const FILE_BASE_URL = "http://localhost:7070";
const WS_URL = "ws://localhost:7070";
const socket = new WebSocket(WS_URL);

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
/* закреп */
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
    // eslint-disable-next-line operator-linebreak
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

function renderMessages(messagesList, append = false, scrollToBottom = false) {
  if (!append) {
    messages.innerHTML = "";
  }

  let lastDate = null;
  const container = document.createDocumentFragment();

  messagesList.forEach((msg) => {
    // 🔒 Проверка: если уже есть такое сообщение — не рендерим его повторно
    if (document.getElementById(`msg-${msg.id}`)) return;

    const dateObj = new Date(msg.date);
    const dateLabel = dateObj.toLocaleDateString("ru-RU");
    const timeLabel = dateObj.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 📅 Заголовок с датой (один на день)
    if (lastDate !== dateLabel) {
      lastDate = dateLabel;
      const dateHeader = document.createElement("div");
      dateHeader.classList.add("date-header");
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
}

messages.addEventListener("scroll", () => {
  if (messages.scrollTop === 0 && renderStart > 0) {
    const prevHeight = messages.scrollHeight;

    const newStart = renderStart - CHUNK_SIZE;
    if (newStart < 0) renderStart = 0;
    else renderStart = newStart;

    const chunk = allMessages.slice(renderStart, renderStart + CHUNK_SIZE);

    renderMessages(chunk, true); // append = true

    const newHeight = messages.scrollHeight;
    messages.scrollTop = newHeight - prevHeight;
  }
});

/* логика поиска */
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-search");

socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  allMessages.push(msg);
  allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));

  // если пользователь ищет — не перерисовываем
  if (searchInput.value.trim()) return;

  // если чат уже внизу (видны последние сообщения), продолжаем скролл
  // eslint-disable-next-line operator-linebreak
  const isNearBottom =
    messages.scrollHeight - messages.scrollTop - messages.clientHeight < 50;

  // рендерим последние сообщения (НЕ весь список!)
  const chunk = allMessages.slice(-CHUNK_SIZE);
  renderStart = allMessages.length - CHUNK_SIZE;
  if (renderStart < 0) renderStart = 0;

  renderMessages(chunk, false, isNearBottom);
});

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

attachBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files);
  files.forEach(uploadFile);
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
  const files = Array.from(e.dataTransfer.files);
  files.forEach(uploadFile);
});

async function fetchMessages() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    // Сортировка
    allMessages.length = 0;
    allMessages.push(
      ...data.sort((a, b) => new Date(a.date) - new Date(b.date))
    );

    // Запоминаем старт
    renderStart = allMessages.length - CHUNK_SIZE;
    if (renderStart < 0) renderStart = 0;

    loadedMessagesCount = 0;

    const chunk = allMessages.slice(renderStart);
    renderMessages(chunk, false, true); // scrollToBottom = true

    renderPinned(); // восстановим закреп
  } catch (err) {
    console.error("Ошибка при загрузке сообщений:", err);
  }
}

fetchMessages();

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderMessages(allMessages);
    return;
  }

  const filtered = allMessages.filter((msg) => {
    if (msg.type === "text") {
      return msg.text.toLowerCase().includes(term);
    }
    return false;
  });

  renderStart = 0;
  renderMessages(filtered);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderStart = allMessages.length - CHUNK_SIZE;
  if (renderStart < 0) renderStart = 0;
  const chunk = allMessages.slice(renderStart);
  loadedMessagesCount = chunk.length;
  renderMessages(chunk, false, true);
});
