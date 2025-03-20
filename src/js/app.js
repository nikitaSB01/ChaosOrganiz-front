import "../css/style.css";

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");

// Добавление сообщения
function addMessage(text, isSelf = false) {
  const msg = document.createElement("div");
  msg.classList.add("message");
  if (isSelf) msg.classList.add("self");
  msg.textContent = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
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
