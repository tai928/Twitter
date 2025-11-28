// DOM 取得
const tweetInput = document.getElementById("tweetInput");
const postTweetBtn = document.getElementById("postTweetBtn");
const charCounter = document.getElementById("charCounter");
const imageInput = document.getElementById("imageInput");
const imageSelectBtn = document.getElementById("imageSelectBtn");
const imagePreview = document.getElementById("imagePreview");

const tweetsContainer = document.getElementById("tweetsContainer");
const profileTweetsContainer = document.getElementById(
  "profileTweetsContainer"
);

// モーダル用
const tweetModal = document.getElementById("tweetModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const tweetInputModal = document.getElementById("tweetInputModal");
const postTweetBtnModal = document.getElementById("postTweetBtnModal");
const charCounterModal = document.getElementById("charCounterModal");
const imageInputModal = document.getElementById("imageInputModal");
const imageSelectBtnModal = document.getElementById("imageSelectBtnModal");
const imagePreviewModal = document.getElementById("imagePreviewModal");

// ナビ＆ページ
const navItems = document.querySelectorAll(".nav-item");
const homePage = document.getElementById("homePage");
const profilePage = document.getElementById("profilePage");

// テーマ
const themeToggle = document.getElementById("themeToggle");

// 定数
const MAX_LENGTH = 140;
const TWEETS_KEY = "miniTwitterTweets";
const THEME_KEY = "miniTwitterTheme";

// 状態
let tweets = []; // {id, name, handle, text, createdAt, imageSrc, liked, likeCount, replyCount, rtCount}

// ===== テーマ =====

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (!saved) return;
  document.body.setAttribute("data-theme", saved);
  themeToggle.textContent = saved === "light" ? "☀️" : "🌙";
}

function toggleTheme() {
  const current = document.body.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.body.setAttribute("data-theme", next);
  themeToggle.textContent = next === "light" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, next);
}

themeToggle.addEventListener("click", toggleTheme);

// ===== ツイート保存 / 読み込み =====

function saveTweets() {
  localStorage.setItem(TWEETS_KEY, JSON.stringify(tweets));
}

function loadTweets() {
  const raw = localStorage.getItem(TWEETS_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    tweets = parsed.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }));
  } catch (e) {
    console.error("failed to parse tweets", e);
  }
}

// ===== 共通：文字数カウント＋画像選択＋投稿処理 =====

function setupComposer({
  textarea,
  postButton,
  counter,
  fileInput,
  fileButton,
  preview,
  afterPost,
}) {
  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${MAX_LENGTH}`;
    postButton.disabled = len === 0 || len > MAX_LENGTH;
  });

  fileButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) {
      preview.style.display = "none";
      preview.innerHTML = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.style.display = "block";
      preview.innerHTML = `<img src="${e.target.result}" alt="preview" />`;
    };
    reader.readAsDataURL(file);
  });

  postButton.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (!text || text.length > MAX_LENGTH) return;

    let imageSrc = null;
    const file = fileInput.files[0];
    if (file) {
      // 既に FileReader で表示しているので preview 内からとってもいいが
      // 安全のため再度読み込む
      const reader = new FileReader();
      reader.onload = (e) => {
        imageSrc = e.target.result;
        createTweet(text, imageSrc);
        finishPost();
      };
      reader.readAsDataURL(file);
    } else {
      createTweet(text, imageSrc);
      finishPost();
    }

    function finishPost() {
      textarea.value = "";
      counter.textContent = `0 / ${MAX_LENGTH}`;
      postButton.disabled = true;
      fileInput.value = "";
      preview.style.display = "none";
      preview.innerHTML = "";

      if (afterPost) afterPost();
    }
  });

  // 初期状態
  postButton.disabled = true;
  counter.textContent = `0 / ${MAX_LENGTH}`;
}

// ===== ツイート生成＆表示 =====

function createTweet(text, imageSrc) {
  const tweet = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    name: "たい",
    handle: "@tai_clone",
    text,
    imageSrc,
    createdAt: new Date(),
    liked: false,
    likeCount: 0,
    replyCount: 0,
    rtCount: 0,
  };

  tweets.unshift(tweet);
  saveTweets();
  renderAllTweetLists();
}

// 時刻表示
function formatTime(date) {
  const now = new Date();
  const diffSec = (now - date) / 1000;

  if (diffSec < 60) return "今";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function renderTweetsTo(container) {
  container.innerHTML = "";

  tweets.forEach((t) => {
    const el = document.createElement("article");
    el.className = "tweet";
    el.dataset.id = t.id;

    const likeClass = t.liked ? "like-btn liked tweet-action-btn" : "like-btn tweet-action-btn";

    el.innerHTML = `
      <div class="avatar">🧑‍💻</div>
      <div class="tweet-main">
        <div class="tweet-header">
          <span class="tweet-name">${t.name}</span>
          <span class="tweet-handle">${t.handle}</span>
          <span class="tweet-time">・${formatTime(t.createdAt)}</span>
        </div>
        <div class="tweet-text"></div>
        ${
          t.imageSrc
            ? `<div class="tweet-image"><img src="${t.imageSrc}" alt="image" /></div>`
            : ""
        }
        <div class="tweet-footer">
          <button class="tweet-action-btn reply-btn">
            💬 <span class="count">${t.replyCount}</span>
          </button>
          <button class="tweet-action-btn rt-btn">
            🔁 <span class="count">${t.rtCount}</span>
          </button>
          <button class="${likeClass}">
            ❤️ <span class="count">${t.likeCount}</span>
          </button>
        </div>
      </div>
    `;

    el.querySelector(".tweet-text").textContent = t.text;
    container.appendChild(el);
  });
}

function renderAllTweetLists() {
  renderTweetsTo(tweetsContainer);
  renderTweetsTo(profileTweetsContainer);
}

// ===== いいねなどのイベント（デリゲート） =====

function handleTweetActionClick(e) {
  const likeBtn = e.target.closest(".like-btn");
  const rtBtn = e.target.closest(".rt-btn");
  const replyBtn = e.target.closest(".reply-btn");
  if (!likeBtn && !rtBtn && !replyBtn) return;

  const tweetEl = e.target.closest(".tweet");
  if (!tweetEl) return;
  const id = tweetEl.dataset.id;
  const t = tweets.find((tw) => tw.id === id);
  if (!t) return;

  if (likeBtn) {
    t.liked = !t.liked;
    t.likeCount += t.liked ? 1 : -1;
  } else if (rtBtn) {
    t.rtCount += 1;
  } else if (replyBtn) {
    t.replyCount += 1;
  }

  saveTweets();
  renderAllTweetLists();
}

tweetsContainer.addEventListener("click", handleTweetActionClick);
profileTweetsContainer.addEventListener("click", handleTweetActionClick);

// ===== ナビでページ切り替え =====

function showPage(page) {
  if (page === "profile") {
    homePage.classList.add("hidden");
    profilePage.classList.remove("hidden");
  } else {
    // それ以外は全部ホーム扱い
    profilePage.classList.add("hidden");
    homePage.classList.remove("hidden");
  }
}

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const page = item.dataset.page;

    navItems.forEach((n) => n.classList.remove("active"));
    item.classList.add("active");

    showPage(page);
  });
});

// ===== モーダル =====

function openModal() {
  tweetModal.classList.remove("hidden");
  tweetInputModal.focus();
}

function closeModal() {
  tweetModal.classList.add("hidden");
}

openModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
tweetModal.addEventListener("click", (e) => {
  if (e.target === tweetModal || e.target.classList.contains("modal-backdrop")) {
    closeModal();
  }
});

// ===== 初期化 =====

// コンポーザ2つをセット
setupComposer({
  textarea: tweetInput,
  postButton: postTweetBtn,
  counter: charCounter,
  fileInput: imageInput,
  fileButton: imageSelectBtn,
  preview: imagePreview,
});

setupComposer({
  textarea: tweetInputModal,
  postButton: postTweetBtnModal,
  counter: charCounterModal,
  fileInput: imageInputModal,
  fileButton: imageSelectBtnModal,
  preview: imagePreviewModal,
  afterPost: closeModal,
});

// ツイート読み込み & テーマ読み込み & レンダリング
loadTweets();
loadTheme();
renderAllTweetLists();
