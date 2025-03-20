import "../css/style.css";

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");

function parseLinks(text) {
  const urlRegex = /((https?:\/\/)[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/<\/?[^>]+(>|$)/g, ""); // защита от HTML
    return `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
  });
}

// Добавление сообщения
function addMessage(text, isSelf = false) {
  const msg = document.createElement("div");
  msg.classList.add("message");
  if (isSelf) msg.classList.add("self");
  msg.innerHTML = parseLinks(text); // ← здесь подставляем с обработкой
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// обработка файлов  (похожа на drag & drop, но универсальна)
function handleFiles(files) {
  files.forEach((file) => {
    const fileURL = URL.createObjectURL(file);
    const msg = document.createElement("div");
    msg.classList.add("message", "self");

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = fileURL;
      img.style.maxWidth = "200px";
      img.style.borderRadius = "8px";
      msg.appendChild(img);
    } else {
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = file.name;
      link.textContent = `📎 ${file.name}`;
      link.target = "_blank";
      msg.appendChild(link);
    }

    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  });
}

// Обработка отправки текста
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    addMessage(text, true);
    input.value = "";
  }
});

// Прикрепление файла (эмуляция клика по скрытому input)
attachBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files);
  handleFiles(files);
  fileInput.value = ""; // сбрасываем, чтобы можно было выбрать тот же файл снова
});

// Обработка Drag & Drop файлов в messages
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
  files.forEach((file) => {
    const fileURL = URL.createObjectURL(file);
    const msg = document.createElement("div");
    msg.classList.add("message", "self");

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = fileURL;
      img.style.maxWidth = "200px";
      img.style.borderRadius = "8px";
      msg.appendChild(img);
    } else {
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = file.name;
      link.textContent = `📎 ${file.name}`;
      link.target = "_blank";
      msg.appendChild(link);
    }

    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  });
});
