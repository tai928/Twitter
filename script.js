// ==============================
// Supabase 設定
// ==============================

// ★自分の Supabase プロジェクトの値に変えること！★
const SUPABASE_URL = 'https://ngtthuwmqdcxgddlbsyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YJzguO8nmmVKURa58cKwVw__9ulKxI6';

// CDN 版 @supabase/supabase-js v2 を想定
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('StepLink script loaded. URL = ' + SUPABASE_URL);

// ==============================// ==============================
// StepLink script.js
// ==============================

// 🔧 ここを自分の Supabase プロジェクトの値に書き換えてね
const SUPABASE_URL = "https://ngtthuwmqdcxgddlbsyo.supabase.co";
const SUPABASE_ANON_KEY = "ここに自分の anon key を入れる";

// Supabase クライアント作成
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("StepLink script loaded. URL =", SUPABASE_URL);

// ==============================
// DOM 要素たち
// ==============================
const body = document.body;

// テーマ
const themeToggleBtn = document.getElementById("themeToggle");

// ナビ & ページ
const navItems = document.querySelectorAll(".nav-item");
const homePage = document.getElementById("homePage");
const messagesPage = document.getElementById("messagesPage");
const profilePage = document.getElementById("profilePage");

// 投稿モーダル
const tweetModal = document.getElementById("tweetModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// アカウントモーダル
const accountModal = document.getElementById("accountModal");
const switchAccountBtn = document.getElementById("switchAccountBtn");
const closeAccountModalBtn = document.getElementById("closeAccountModalBtn");
const accountTabs = document.querySelectorAll(".account-tab");
const accountLoginView = document.getElementById("accountLoginView");
const accountRegisterView = document.getElementById("accountRegisterView");

// ログイン関連入力
const loginHandleInput = document.getElementById("loginHandleInput");
const loginPasswordInput = document.getElementById("loginPasswordInput");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const loginError = document.getElementById("loginError");

// 新規登録関連入力
const regNameInput = document.getElementById("regNameInput");
const regHandleInput = document.getElementById("regHandleInput");
const regEmailInput = document.getElementById("regEmailInput");
const regAvatarInput = document.getElementById("regAvatarInput");
const regPasswordInput = document.getElementById("regPasswordInput");
const registerSubmitBtn = document.getElementById("registerSubmitBtn");
const registerError = document.getElementById("registerError");

// ユーザー表示
const currentUserAvatarEl = document.getElementById("currentUserAvatar");
const currentUserNameEl = document.getElementById("currentUserName");
const currentUserHandleEl = document.getElementById("currentUserHandle");

// プロフィール側表示
const profileNameEl = document.getElementById("profileName");
const profileHandleEl = document.getElementById("profileHandle");

// ホーム投稿欄
const tweetInput = document.getElementById("tweetInput");
const charCounter = document.getElementById("charCounter");
const imageSelectBtn = document.getElementById("imageSelectBtn");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const postTweetBtn = document.getElementById("postTweetBtn");

// モーダル投稿欄
const tweetInputModal = document.getElementById("tweetInputModal");
const charCounterModal = document.getElementById("charCounterModal");
const imageSelectBtnModal = document.getElementById("imageSelectBtnModal");
const imageInputModal = document.getElementById("imageInputModal");
const imagePreviewModal = document.getElementById("imagePreviewModal");
const postTweetBtnModal = document.getElementById("postTweetBtnModal");

// 投稿リスト
const tweetsContainer = document.getElementById("tweetsContainer");
const profileTweetsContainer = document.getElementById("profileTweetsContainer");

// ==============================
// 状態
// ==============================
let currentUser = null;          // Supabase auth user
let currentProfile = null;       // profiles テーブルの1行
let tweetsCache = [];            // 取得したツイート

// ==============================
// テーマ切り替え
// ==============================
function initTheme() {
  const saved = localStorage.getItem("steplink-theme");
  if (saved === "light" || saved === "dark") {
    body.setAttribute("data-theme", saved);
  } else {
    body.setAttribute("data-theme", "dark");
  }
}

function toggleTheme() {
  const now = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
  body.setAttribute("data-theme", now);
  localStorage.setItem("steplink-theme", now);
  themeToggleBtn.textContent = now === "dark" ? "🌙" : "☀️";
}

// ==============================
// ページ切り替え
// ==============================
function showPage(page) {
  homePage.classList.add("hidden");
  messagesPage.classList.add("hidden");
  profilePage.classList.add("hidden");

  navItems.forEach((item) => item.classList.remove("active"));

  if (page === "home") {
    homePage.classList.remove("hidden");
  } else if (page === "messages") {
    messagesPage.classList.remove("hidden");
  } else if (page === "profile") {
    profilePage.classList.remove("hidden");
  }

  const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeItem) activeItem.classList.add("active");
}

// ==============================
// モーダルの開閉
// ==============================
function openTweetModal() {
  tweetModal.classList.remove("hidden");
}

function closeTweetModal() {
  tweetModal.classList.add("hidden");
  tweetInputModal.value = "";
  charCounterModal.textContent = "0 / 140";
  clearImagePreview(imagePreviewModal);
  imageInputModal.value = "";
}

function openAccountModal() {
  accountModal.classList.remove("hidden");
}

function closeAccountModal() {
  accountModal.classList.add("hidden");
  loginError.textContent = "";
  registerError.textContent = "";
}

// ==============================
// 入力文字数カウンタ
// ==============================
function updateCharCounter(textarea, counterEl) {
  const len = textarea.value.length;
  counterEl.textContent = `${len} / 140`;
  if (len > 140) {
    counterEl.classList.add("over");
  } else {
    counterEl.classList.remove("over");
  }
}

// ==============================
// 画像プレビュー
// ==============================
function setUpImageSelector(buttonEl, inputEl, previewEl) {
  buttonEl.addEventListener("click", () => {
    inputEl.click();
  });

  inputEl.addEventListener("change", () => {
    const file = inputEl.files[0];
    if (!file) {
      clearImagePreview(previewEl);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      previewEl.innerHTML = "";
      const img = document.createElement("img");
      img.src = reader.result;
      img.alt = "preview";
      previewEl.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function clearImagePreview(previewEl) {
  previewEl.innerHTML = "";
}

// ==============================
// プロフィール upsert（RLS 対策）
// ==============================
// ここが一番大事：id に auth.uid() をセットすることで
// RLS の "auth.uid() = id" を満たす
async function upsertProfile({ display_name, handle, avatar_emoji }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("getUser error:", userError);
    throw new Error("ログインユーザーが取得できない…");
  }

  const row = {
    id: user.id,                // 🔑 RLS の条件を満たす
    display_name,
    handle,
    avatar_emoji,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "id" });

  if (error) {
    console.error("upsertProfile error:", error);
    throw error;
  }

  return data;
}

// ==============================
// ユーザー & プロフィール情報取得
// ==============================
async function refreshCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("getUser error:", error);
  }

  if (!user) {
    currentUser = null;
    currentProfile = null;
    updateUserUI();
    return;
  }

  currentUser = user;

  // プロフィール取得
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("profiles select error:", profileError);
  }

  currentProfile = profile || null;
  updateUserUI();
}

// ==============================
// ユーザーUI更新
// ==============================
function updateUserUI() {
  if (!currentUser || !currentProfile) {
    currentUserAvatarEl.textContent = "🧑‍💻";
    currentUserNameEl.textContent = "未ログイン";
    currentUserHandleEl.textContent = "";
    profileNameEl.textContent = "StepLinkユーザー";
    profileHandleEl.textContent = "@user";
    return;
  }

  const avatar = currentProfile.avatar_emoji || "🧑‍💻";
  const name = currentProfile.display_name || "名前なし";
  const handle = currentProfile.handle || "user";

  currentUserAvatarEl.textContent = avatar;
  currentUserNameEl.textContent = name;
  currentUserHandleEl.textContent = handle ? `@${handle}` : "";

  profileNameEl.textContent = name;
  profileHandleEl.textContent = handle ? `@${handle}` : "@user";
}

// ==============================
// ツイート系
// ==============================

// ツイート取得
async function loadTweets() {
  const { data, error } = await supabase
    .from("tweets")
    .select(
      `
      id,
      content,
      image_url,
      created_at,
      user_id,
      profiles (
        display_name,
        handle,
        avatar_emoji
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadTweets error:", error);
    return;
  }

  tweetsCache = data || [];
  renderTweets();
}

// ツイート描画
function renderTweets() {
  tweetsContainer.innerHTML = "";
  profileTweetsContainer.innerHTML = "";

  tweetsCache.forEach((tweet) => {
    const card = createTweetCard(tweet);
    tweetsContainer.appendChild(card);

    // 自分のプロフィールタブ用
    if (currentUser && tweet.user_id === currentUser.id) {
      const ownCard = createTweetCard(tweet);
      profileTweetsContainer.appendChild(ownCard);
    }
  });
}

function createTweetCard(tweet) {
  const card = document.createElement("article");
  card.className = "post";

  const avatar = tweet.profiles?.avatar_emoji || "🧑‍💻";
  const name = tweet.profiles?.display_name || "名無し";
  const handle = tweet.profiles?.handle || "user";
  const time = tweet.created_at
    ? new Date(tweet.created_at).toLocaleString("ja-JP")
    : "";

  card.innerHTML = `
    <div class="post-avatar">${avatar}</div>
    <div class="post-body">
      <header class="post-header">
        <span class="post-name">${name}</span>
        <span class="post-handle">@${handle}</span>
        <span class="post-dot">·</span>
        <span class="post-time">${time}</span>
      </header>
      <div class="post-content"></div>
      <div class="post-footer">
        <button class="icon-btn">💬</button>
        <button class="icon-btn">♻️</button>
        <button class="icon-btn">❤️</button>
      </div>
    </div>
  `;

  const contentEl = card.querySelector(".post-content");
  const textEl = document.createElement("p");
  textEl.textContent = tweet.content || "";
  contentEl.appendChild(textEl);

  if (tweet.image_url) {
    const img = document.createElement("img");
    img.src = tweet.image_url;
    img.alt = "post image";
    img.className = "post-image";
    contentEl.appendChild(img);
  }

  return card;
}

// ツイート送信
async function submitTweet(source) {
  const isModal = source === "modal";

  const textarea = isModal ? tweetInputModal : tweetInput;
  const previewEl = isModal ? imagePreviewModal : imagePreview;
  const fileInput = isModal ? imageInputModal : imageInput;

  const text = textarea.value.trim();
  if (!text) return;
  if (text.length > 140) {
    alert("140文字を超えてるよ…🥺");
    return;
  }

  // ログインチェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("ログインしてから投稿してね…！");
    openAccountModal();
    return;
  }

  let imageDataUrl = null;

  const imgTag = previewEl.querySelector("img");
  if (imgTag) {
    // 今回は簡単に base64 をそのまま DB に保存
    // 本当は Storage を使った方がいい
    imageDataUrl = imgTag.src;
  }

  const { error } = await supabase.from("tweets").insert({
    user_id: user.id,
    content: text,
    image_url: imageDataUrl,
  });

  if (error) {
    console.error("submitTweet error:", error);
    alert("投稿でエラーが出ちゃった…コンソール見て…");
    return;
  }

  textarea.value = "";
  updateCharCounter(textarea, isModal ? charCounterModal : charCounter);
  clearImagePreview(previewEl);
  fileInput.value = "";

  if (isModal) {
    closeTweetModal();
  }

  // 再読み込み
  await loadTweets();
}

// ==============================
// イベントセットアップ
// ==============================
function setupEvents() {
  // テーマ
  themeToggleBtn.addEventListener("click", toggleTheme);

  // ナビ
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      showPage(page);
    });
  });

  // 投稿モーダル
  openModalBtn.addEventListener("click", openTweetModal);
  closeModalBtn.addEventListener("click", closeTweetModal);

  tweetModal
    .querySelector(".modal-backdrop")
    .addEventListener("click", closeTweetModal);

  // アカウントモーダル
  switchAccountBtn.addEventListener("click", openAccountModal);
  closeAccountModalBtn.addEventListener("click", closeAccountModal);

  accountModal
    .querySelector(".modal-backdrop")
    .addEventListener("click", closeAccountModal);

  // アカウントタブ切り替え
  accountTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      accountTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const mode = tab.dataset.mode;
      if (mode === "login") {
        accountLoginView.classList.remove("hidden");
        accountRegisterView.classList.add("hidden");
      } else {
        accountLoginView.classList.add("hidden");
        accountRegisterView.classList.remove("hidden");
      }
    });
  });

  // 文字数カウント
  tweetInput.addEventListener("input", () =>
    updateCharCounter(tweetInput, charCounter)
  );
  tweetInputModal.addEventListener("input", () =>
    updateCharCounter(tweetInputModal, charCounterModal)
  );

  // 画像選択
  setUpImageSelector(imageSelectBtn, imageInput, imagePreview);
  setUpImageSelector(imageSelectBtnModal, imageInputModal, imagePreviewModal);

  // 投稿ボタン
  postTweetBtn.addEventListener("click", () => submitTweet("home"));
  postTweetBtnModal.addEventListener("click", () => submitTweet("modal"));

  // ログイン
  loginSubmitBtn.addEventListener("click", async () => {
    loginError.textContent = "";

    const email = loginHandleInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      loginError.textContent = "未入力の項目があるよ…";
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("login error:", error);
      loginError.textContent = "ログインに失敗しちゃった…";
      return;
    }

    await refreshCurrentUser();
    await loadTweets();
    closeAccountModal();
  });

  // 新規登録
  registerSubmitBtn.addEventListener("click", async () => {
    registerError.textContent = "";

    const name = regNameInput.value.trim();
    const handle = regHandleInput.value.trim();
    const email = regEmailInput.value.trim();
    const avatar = (regAvatarInput.value || "🧑‍💻").trim();
    const password = regPasswordInput.value;

    if (!name || !handle || !email || !password) {
      registerError.textContent = "未入力の項目があるよ…";
      return;
    }

    // 1️⃣ サインアップ
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error("signUp error:", signUpError);
      registerError.textContent = "サインアップに失敗しちゃった…";
      return;
    }

    try {
      // 2️⃣ プロフィール upsert（ここで RLS を満たす）
      await upsertProfile({
        display_name: name,
        handle,
        avatar_emoji: avatar,
      });

      // ユーザー情報更新
      await refreshCurrentUser();
      await loadTweets();
      closeAccountModal();
    } catch (e) {
      console.error("register upsertProfile error:", e);
      registerError.textContent = "プロフィール保存でエラー出た…";
    }
  });
}

// ==============================
// 初期化
// ==============================
async function init() {
  initTheme();
  showPage("home");
  setupEvents();

  await refreshCurrentUser();
  await loadTweets();
}

init();

// グローバル状態
// ==============================

let currentUser = null;     // Supabase auth.users
let currentProfile = null;  // profiles のレコード

// とりあえず投稿はローカル配列に保存（DB連携はあとから足せる）
let tweets = []; // { id, userId, text, imageUrl, createdAt }

// ==============================
// DOM 初期化
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupThemeToggle();
  setupTweetModal();
  setupAccountModal();
  setupTweetComposers();
  initAuthState();
});

// ==============================
// ナビゲーション（ホーム / メッセージ / プロフィール）
// ==============================

function setupNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = {
    home: document.getElementById('homePage'),
    messages: document.getElementById('messagesPage'),
    profile: document.getElementById('profilePage'),
  };

  function switchPage(pageName) {
    Object.keys(pages).forEach((key) => {
      if (!pages[key]) return;
      if (key === pageName) {
        pages[key].classList.remove('hidden');
      } else {
        pages[key].classList.add('hidden');
      }
    });

    navItems.forEach((item) => {
      if (item.dataset.page === pageName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      switchPage(page);
    });
  });

  // 初期はホーム
  switchPage('home');
}

// ==============================
// テーマ切り替え（ライト / ダーク）
// ==============================

function setupThemeToggle() {
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');

  if (!themeToggle) return;

  const savedTheme = localStorage.getItem('steplink-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    body.dataset.theme = savedTheme;
  }

  updateThemeToggleIcon();

  themeToggle.addEventListener('click', () => {
    const current = body.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    body.dataset.theme = next;
    localStorage.setItem('steplink-theme', next);
    updateThemeToggleIcon();
  });

  function updateThemeToggleIcon() {
    const mode = body.dataset.theme === 'dark' ? 'dark' : 'light';
    themeToggle.textContent = mode === 'dark' ? '🌙' : '☀️';
  }
}

// ==============================
// 投稿モーダル（開く／閉じる）
// ==============================

function setupTweetModal() {
  const tweetModal = document.getElementById('tweetModal');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalBackdrop = tweetModal?.querySelector('.modal-backdrop');

  if (!tweetModal) return;

  function openModal() {
    tweetModal.classList.remove('hidden');
  }
  function closeModal() {
    tweetModal.classList.add('hidden');
  }

  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
}

// ==============================
// アカウントモーダル（ログイン／新規登録）
// ==============================

function setupAccountModal() {
  const accountModal = document.getElementById('accountModal');
  const switchAccountBtn = document.getElementById('switchAccountBtn');
  const closeAccountModalBtn = document.getElementById('closeAccountModalBtn');
  const modalBackdrop = accountModal?.querySelector('.modal-backdrop');

  const accountTabs = document.querySelectorAll('.account-tab');
  const loginView = document.getElementById('accountLoginView');
  const registerView = document.getElementById('accountRegisterView');

  const loginHandleInput = document.getElementById('loginHandleInput'); // メール
  const loginPasswordInput = document.getElementById('loginPasswordInput');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginError = document.getElementById('loginError');

  const regNameInput = document.getElementById('regNameInput');
  const regHandleInput = document.getElementById('regHandleInput');
  const regEmailInput = document.getElementById('regEmailInput');
  const regAvatarInput = document.getElementById('regAvatarInput');
  const regPasswordInput = document.getElementById('regPasswordInput');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const registerError = document.getElementById('registerError');

  if (!accountModal) return;

  function openModal(mode = 'login') {
    accountModal.classList.remove('hidden');
    switchAccountMode(mode);
  }

  function closeModal() {
    accountModal.classList.add('hidden');
  }

  if (switchAccountBtn) {
    switchAccountBtn.addEventListener('click', () => openModal('login'));
  }
  if (closeAccountModalBtn) {
    closeAccountModalBtn.addEventListener('click', closeModal);
  }
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeModal);
  }

  accountTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      switchAccountMode(mode);
    });
  });

  function switchAccountMode(mode) {
    accountTabs.forEach((tab) => {
      if (tab.dataset.mode === mode) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    if (mode === 'login') {
      loginView.classList.remove('hidden');
      registerView.classList.add('hidden');
    } else {
      loginView.classList.add('hidden');
      registerView.classList.remove('hidden');
    }

    // エラー表示クリア
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
  }

  // ログイン処理
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', async () => {
      if (!loginHandleInput || !loginPasswordInput) return;

      const email = loginHandleInput.value.trim();
      const password = loginPasswordInput.value.trim();
      loginError.textContent = '';

      if (!email || !password) {
        loginError.textContent = 'メールとパスワードを入力してください。';
        return;
      }

      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = 'ログイン中...';

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('login error:', error);
          loginError.textContent = error.message || 'ログインに失敗しました。';
          return;
        }

        currentUser = data.user;
        await loadProfileForCurrentUser();
        closeModal();
      } catch (err) {
        console.error('login exception:', err);
        loginError.textContent = err.message || '予期せぬエラーが発生しました。';
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'ログイン';
      }
    });
  }

  // 新規登録処理
  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener('click', async () => {
      if (!regNameInput || !regHandleInput || !regEmailInput || !regPasswordInput || !regAvatarInput) return;

      const name = regNameInput.value.trim();
      const handle = regHandleInput.value.trim();
      const email = regEmailInput.value.trim();
      const avatar = regAvatarInput.value.trim() || '🧑‍💻';
      const password = regPasswordInput.value.trim();
      registerError.textContent = '';

      if (!email || !password) {
        registerError.textContent = 'メールとパスワードは必須です。';
        return;
      }

      if (!handle) {
        registerError.textContent = 'ハンドルを入力してください。';
        return;
      }

      registerSubmitBtn.disabled = true;
      registerSubmitBtn.textContent = '作成中...';

      try {
        // サインアップ（ここで 500 が出る場合は Supabase 側の DB 設定の問題）
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('signUp error:', error);
          registerError.textContent = error.message || '登録に失敗しました。';
          return;
        }

        const user = data.user;
        if (!user) {
          registerError.textContent = 'ユーザー情報が取得できませんでした。';
          return;
        }

        // profiles に upsert
        try {
          const profile = await upsertProfile(user, { name, handle, avatar });
          console.log('upsertProfile success:', profile);
          currentUser = user;
          currentProfile = profile;
          updateCurrentUserUI();
          closeModal();
        } catch (profileErr) {
          console.error('upsertProfile error:', profileErr);
          registerError.textContent =
            profileErr.message || 'プロフィールの保存に失敗しました。';
        }
      } catch (err) {
        console.error('register exception:', err);
        registerError.textContent = err.message || '予期せぬエラーが発生しました。';
      } finally {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = 'アカウント作成';
      }
    });
  }
}

// ==============================
// Auth セッション初期化
// ==============================

async function initAuthState() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (session && session.user) {
      currentUser = session.user;
      await loadProfileForCurrentUser();
    } else {
      updateCurrentUserUI(); // 未ログイン表示
    }
  } catch (err) {
    console.error('initAuthState error:', err);
    updateCurrentUserUI();
  }
}

// 現在の currentUser に対応する profiles を読み込む
async function loadProfileForCurrentUser() {
  if (!currentUser) {
    currentProfile = null;
    updateCurrentUserUI();
    return;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('loadProfile error:', error);
      currentProfile = null;
    } else {
      currentProfile = data;
    }
  } catch (err) {
    console.error('loadProfile exception:', err);
    currentProfile = null;
  }

  updateCurrentUserUI();
}

// profiles テーブルに upsert
async function upsertProfile(user, { name, handle, avatar }) {
  const payload = {
    id: user.id, // auth.users.id と対応させる想定
    name: name || null,
    handle: handle || null,
    avatar: avatar || '🧑‍💻',
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// ==============================
// ユーザー情報 UI 反映
// ==============================

function updateCurrentUserUI() {
  const avatarEl = document.getElementById('currentUserAvatar');
  const nameEl = document.getElementById('currentUserName');
  const handleEl = document.getElementById('currentUserHandle');

  const profileNameEl = document.getElementById('profileName');
  const profileHandleEl = document.getElementById('profileHandle');

  if (!currentUser || !currentProfile) {
    if (avatarEl) avatarEl.textContent = '🧑‍💻';
    if (nameEl) nameEl.textContent = '未ログイン';
    if (handleEl) handleEl.textContent = '';

    if (profileNameEl) profileNameEl.textContent = 'StepLinkユーザー';
    if (profileHandleEl) profileHandleEl.textContent = '@user';
    return;
  }

  const avatar = currentProfile.avatar || '🧑‍💻';
  const name = currentProfile.name || (currentUser.email ?? 'ユーザー');
  const handle = currentProfile.handle || currentUser.email;

  if (avatarEl) avatarEl.textContent = avatar;
  if (nameEl) nameEl.textContent = name;
  if (handleEl) handleEl.textContent = handle ? '@' + handle : '';

  if (profileNameEl) profileNameEl.textContent = name;
  if (profileHandleEl) profileHandleEl.textContent = handle ? '@' + handle : '';
}

// ==============================
// 投稿 UI（文字数カウント・画像プレビュー・投稿）
// ==============================

function setupTweetComposers() {
  // ホーム側
  setupSingleComposer({
    textarea: document.getElementById('tweetInput'),
    counter: document.getElementById('charCounter'),
    imageInput: document.getElementById('imageInput'),
    imageSelectBtn: document.getElementById('imageSelectBtn'),
    imagePreview: document.getElementById('imagePreview'),
    submitBtn: document.getElementById('postTweetBtn'),
    isModal: false,
  });

  // モーダル側
  setupSingleComposer({
    textarea: document.getElementById('tweetInputModal'),
    counter: document.getElementById('charCounterModal'),
    imageInput: document.getElementById('imageInputModal'),
    imageSelectBtn: document.getElementById('imageSelectBtnModal'),
    imagePreview: document.getElementById('imagePreviewModal'),
    submitBtn: document.getElementById('postTweetBtnModal'),
    isModal: true,
  });

  renderTweets();
}

function setupSingleComposer({
  textarea,
  counter,
  imageInput,
  imageSelectBtn,
  imagePreview,
  submitBtn,
  isModal,
}) {
  if (!textarea) return;

  const MAX_LEN = 140;

  function updateCounter() {
    if (!counter) return;
    const len = textarea.value.length;
    counter.textContent = `${len} / ${MAX_LEN}`;
    if (len > MAX_LEN) {
      counter.classList.add('over');
    } else {
      counter.classList.remove('over');
    }
    if (submitBtn) {
      submitBtn.disabled = len === 0 || len > MAX_LEN || !currentUser;
    }
  }

  textarea.addEventListener('input', updateCounter);
  updateCounter();

  // 画像選択
  if (imageSelectBtn && imageInput && imagePreview) {
    imageSelectBtn.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', () => {
      imagePreview.innerHTML = '';
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'preview';
      imagePreview.appendChild(img);
    });
  }

  // 投稿ボタン
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const text = textarea.value.trim();
      if (!text || text.length > MAX_LEN) return;
      if (!currentUser) {
        alert('投稿するにはログインが必要です。');
        return;
      }

      let imageUrl = null;
      // ★ここで Supabase Storage にアップロードする処理をあとから追加できる
      // 今はローカルだけで完結させる（リロードすると消える）

      const tweet = {
        id: Date.now().toString(),
        userId: currentUser.id,
        text,
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      tweets.unshift(tweet);
      renderTweets();

      // リセット
      textarea.value = '';
      if (imagePreview) imagePreview.innerHTML = '';
      if (imageInput) imageInput.value = '';
      updateCounter();

      if (isModal) {
        const tweetModal = document.getElementById('tweetModal');
        if (tweetModal) tweetModal.classList.add('hidden');
      }
    });
  }
}

// ==============================
// 投稿の描画（ホーム / プロフィール）
// ==============================

function renderTweets() {
  const homeContainer = document.getElementById('tweetsContainer');
  const profileContainer = document.getElementById('profileTweetsContainer');

  if (homeContainer) homeContainer.innerHTML = '';
  if (profileContainer) profileContainer.innerHTML = '';

  tweets.forEach((tweet) => {
    const owner =
      currentUser && tweet.userId === currentUser.id ? currentProfile : null;

    const card = document.createElement('article');
    card.className = 'post';

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent =
      (owner && owner.avatar) || (currentProfile && currentProfile.avatar) || '🧑‍💻';

    const body = document.createElement('div');
    body.className = 'post-body';

    const header = document.createElement('div');
    header.className = 'post-header';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'post-author';
    nameSpan.textContent =
      (owner && owner.name) ||
      (currentProfile && currentProfile.name) ||
      'ユーザー';

    const handleSpan = document.createElement('span');
    handleSpan.className = 'post-handle';
    handleSpan.textContent =
      owner && owner.handle ? '@' + owner.handle : '@user';

    header.appendChild(nameSpan);
    header.appendChild(handleSpan);

    const textP = document.createElement('p');
    textP.className = 'post-text';
    textP.textContent = tweet.text;

    body.appendChild(header);
    body.appendChild(textP);

    if (tweet.imageUrl) {
      const img = document.createElement('img');
      img.className = 'post-image';
      img.src = tweet.imageUrl;
      img.alt = 'image';
      body.appendChild(img);
    }

    card.appendChild(avatar);
    card.appendChild(body);

    // ホーム：全部
    if (homeContainer) homeContainer.appendChild(card.cloneNode(true));

    // プロフィール：自分の投稿だけ
    if (profileContainer && currentUser && tweet.userId === currentUser.id) {
      profileContainer.appendChild(card);
    }
  });
}
