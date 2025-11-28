const tweetInput = document.getElementById("tweetInput");
const postTweetBtn = document.getElementById("postTweetBtn");
const tweetsContainer = document.getElementById("tweetsContainer");
const charCounter = document.getElementById("charCounter");

const MAX_LENGTH = 140;
let tweets = [];

// 文字数カウント
tweetInput.addEventListener("input", () => {
  const len = tweetInput.value.length;
  charCounter.textContent = `${len} / ${MAX_LENGTH}`;
  postTweetBtn.disabled = len === 0 || len > MAX_LENGTH;
});

// ツイート投稿
postTweetBtn.addEventListener("click", () => {
  const text = tweetInput.value.trim();
  if (!text || text.length > MAX_LENGTH) return;

  const tweet = {
    name: "たい",
    handle: "@tai_clone",
    text,
    createdAt: new Date()
  };

  // 新しいツイートを先頭に
  tweets.unshift(tweet);
  renderTweets();

  tweetInput.value = "";
  charCounter.textContent = `0 / ${MAX_LENGTH}`;
  postTweetBtn.disabled = true;
});

// 時刻表示をちょっとだけTwitter風に
function formatTime(date) {
  const now = new Date();
  const diff = (now - date) / 1000; // sec

  if (diff < 60) return "今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// ツイート描画
function renderTweets() {
  tweetsContainer.innerHTML = "";

  tweets.forEach((t) => {
    const el = document.createElement("article");
    el.className = "tweet";
    el.innerHTML = `
      <div class="avatar">🧑‍💻</div>
      <div class="tweet-main">
        <div class="tweet-header">
          <span class="tweet-name">${t.name}</span>
          <span class="tweet-handle">${t.handle}</span>
          <span class="tweet-time">・${formatTime(t.createdAt)}</span>
        </div>
        <div class="tweet-text"></div>
        <div class="tweet-footer">
          <span>💬 0</span>
          <span>🔁 0</span>
          <span>❤️ 0</span>
        </div>
      </div>
    `;
    el.querySelector(".tweet-text").textContent = t.text;
    tweetsContainer.appendChild(el);
  });
}

// 初期状態
postTweetBtn.disabled = true;
renderTweets();
