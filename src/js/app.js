import "../css/style.css";

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");
const allMessages = []; // для хранения всех сообщений
let pinnedMessage = null;

const API_URL = "http://localhost:7070/messages";
const UPLOAD_URL = "http://localhost:7070/upload";
const FILE_BASE_URL = "http://localhost:7070";
const WS_URL = "ws://localhost:7070";
const socket = new WebSocket(WS_URL);

function parseLinks(text) {
  const urlRegex = /((https?:\/\/)[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/<\/?[^>]+(>|$)/g, "");
    return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
  });
}

function renderMessages(messagesList) {
  messages.innerHTML = "";

  let lastDate = null;

  messagesList.forEach((msg) => {
    const dateObj = new Date(msg.date);
    const dateLabel = dateObj.toLocaleDateString("ru-RU");
    const timeLabel = dateObj.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // если день сменился — вставляем заголовок даты
    if (lastDate !== dateLabel) {
      lastDate = dateLabel;
      const dateHeader = document.createElement("div");
      dateHeader.classList.add("date-header");
      dateHeader.textContent = dateLabel;
      messages.appendChild(dateHeader);
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
        renderPinned();
      });

      wrapper.appendChild(content);
      wrapper.appendChild(unpin);
      container.appendChild(wrapper);
      container.style.display = "block";
    }

    // создаём сообщение
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

    // добавляем метку времени
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
      renderPinned();
    });

    wrapper.appendChild(pinBtn);
    wrapper.appendChild(msgBlock);
    messages.appendChild(wrapper);
  });

  messages.scrollTop = messages.scrollHeight;
}

socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  allMessages.push(msg);
  renderMessages(allMessages); // всегда перерисовываем
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

    allMessages.push(...data);
    renderMessages(allMessages);
  } catch (err) {
    console.error("Ошибка при загрузке сообщений:", err);
  }
}

fetchMessages();

/* логика поиска */
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-search");

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

  renderMessages(filtered);
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderMessages(allMessages);
});
