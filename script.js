/* LAPBUFFXU: giao diện một trang, không dùng thư viện ngoài. */

const gameList = document.querySelector("#game-list");
const gameContent = document.querySelector("#game-content");
const disabledMessage = "Chức năng này đã bị vô hiệu hóa.";

// Chỉ hạn chế một số thao tác phổ thông; không thay thế các biện pháp bảo mật.
function installBasicRestrictions() {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    window.alert(disabledMessage);
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const blockedShortcut = event.key === "F12"
      || (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key))
      || (event.ctrlKey && ["u", "s", "p"].includes(key));

    if (blockedShortcut) {
      event.preventDefault();
      event.stopPropagation();
      window.alert(disabledMessage);
    }
  });
}

// Chỉ cho phép HTTPS và đường dẫn tương đối; chặn các scheme nguy hiểm.
function validateUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const raw = value.trim();
  if (/^(javascript|data|vbscript):/i.test(raw)) return "";
  try {
    const url = new URL(raw, window.location.href);
    if (url.protocol === "https:") return url.href;
    if (url.origin === window.location.origin && /^(\.\.\/|\.\/|\/)/.test(raw)) return url.href;
  } catch (_) {
    return "";
  }
  return "";
}

function makeElement(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}

function makeExternalLink(url, label, className) {
  const link = makeElement("a", className, label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function getVideoSource(value) {
  const url = validateUrl(value);
  if (!url) return null;
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i);
  if (youtube) return { type: "iframe", url: `https://www.youtube-nocookie.com/embed/${youtube[1]}` };
  if (/drive\.google\.com/i.test(url)) return { type: "iframe", url: url.replace(/\/view(?:\?.*)?$/i, "/preview") };
  if (/\.mp4(?:$|[?#])/i.test(url)) return { type: "video", url };
  return null;
}

function renderVideo(game) {
  const source = getVideoSource(game.video);
  if (!source) {
    return makeElement("div", "video-placeholder", "Video hướng dẫn chưa được cập nhật.");
  }
  const frame = makeElement("div", "video-frame");
  if (source.type === "video") {
    const video = makeElement("video");
    video.src = source.url;
    video.controls = true;
    video.preload = "metadata";
    frame.append(video);
  } else {
    const iframe = makeElement("iframe");
    iframe.src = source.url;
    iframe.title = `Video hướng dẫn ${game.name}`;
    iframe.allowFullscreen = true;
    frame.append(iframe);
  }
  return frame;
}

function renderGame(game, activeIndex) {
  gameContent.replaceChildren();
  const heading = makeElement("div", "content-heading");
  heading.append(makeElement("p", "eyebrow", "HƯỚNG DẪN GAME"));
  heading.append(makeElement("h1", "", game.name));
  gameContent.append(heading, renderVideo(game));

  const actions = makeElement("div", "actions");
  const downloadUrl = validateUrl(game.download);
  if (downloadUrl) actions.append(makeExternalLink(downloadUrl, "Tải ở đây", "button primary"));
  const copyButton = makeElement("button", "button secondary", "Sao chép link");
  copyButton.type = "button";
  const copyMessage = makeElement("span", "copy-message");
  copyButton.addEventListener("click", () => copyDownloadLink(downloadUrl, copyMessage));
  actions.append(copyButton, copyMessage);
  gameContent.append(actions);

  const note = makeElement("section", "note");
  note.append(makeElement("h2", "", "Lưu ý"), makeElement("p", "", game.note || "Chưa có lưu ý cho game này."));
  gameContent.append(note);
  document.title = `${game.name} | LAPBUFFXU`;
  document.querySelectorAll(".game-button").forEach((button, index) => button.classList.toggle("active", index === activeIndex));
}

async function copyDownloadLink(url, message) {
  if (!url) { message.textContent = "Chưa có link tải."; return; }
  try {
    await navigator.clipboard.writeText(url);
    message.textContent = "Đã sao chép.";
  } catch (_) {
    message.textContent = "Không thể sao chép.";
  }
  window.setTimeout(() => { message.textContent = ""; }, 2200);
}

function renderGameList() {
  if (!Array.isArray(tools) || tools.length === 0) {
    gameList.append(makeElement("p", "empty", "Chưa có game."));
    gameContent.append(makeElement("p", "empty", "Chưa có dữ liệu game."));
    return;
  }
  tools.forEach((game, index) => {
    const button = makeElement("button", "game-button", game.name || "Game chưa đặt tên");
    button.type = "button";
    button.addEventListener("click", () => renderGame(game, index));
    gameList.append(button);
  });
  renderGame(tools[0], 0);
}

installBasicRestrictions();
renderGameList();
