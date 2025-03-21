import "../css/style.css";

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");

const API_URL = "http://localhost:7070/messages";
const UPLOAD_URL = "http://localhost:7070/upload";
const FILE_BASE_URL = "http://localhost:7070";
const WS_URL = "ws://localhost:7070";
const socket = new WebSocket(WS_URL);

function addMessage(htmlContent) {
  const msg = document.createElement("div");
  msg.classList.add("message", "self");
  msg.innerHTML = htmlContent;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function parseLinks(text) {
  const urlRegex = /((https?:\/\/)[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/<\/?[^>]+(>|$)/g, "");
    return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
  });
}

function renderUploadedFile(relativePath) {
  const msg = document.createElement("div");
  msg.classList.add("message", "self");

  const url = `${FILE_BASE_URL}${relativePath}`;
  if (/\.(jpe?g|png|gif|webp)$/i.test(relativePath)) {
    const img = document.createElement("img");
    img.src = url;
    img.style.maxWidth = "200px";
    img.style.borderRadius = "8px";
    msg.appendChild(img);
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = true;
    link.textContent = `📎 ${relativePath.split("/").pop()}`;
    link.target = "_blank";
    msg.appendChild(link);
  }

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "text") {
    addMessage(parseLinks(msg.text));
  } else if (msg.type === "file") {
    renderUploadedFile(msg.text);
  }
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

    data.forEach((msg) => {
      if (msg.type === "text") {
        addMessage(parseLinks(msg.text));
      } else if (msg.type === "file") {
        renderUploadedFile(msg.text);
      }
    });
  } catch (err) {
    console.error("Ошибка при загрузке сообщений:", err);
  }
}

fetchMessages();
