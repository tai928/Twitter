// ==============================
// Supabase 初期化
// ==============================
const SUPABASE_URL = "https://ngtthuwmqdcxgddlbsyo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YJzguO8nmmVKURa58cKwVw__9ulKxI6";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {

  // ==============================
  // ログイン状態の確認 & UI更新
  // ==============================
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (user) {
    const name = user.user_metadata.name || "ユーザー";
    const handle = user.user_metadata.handle || "user";
    const avatar = user.user_metadata.avatar || "🧑‍💻";

    // 左下UI
    document.getElementById("currentUserName").textContent = name;
    document.getElementById("currentUserHandle").textContent = "@" + handle;
    document.getElementById("currentUserAvatar").textContent = avatar;
  }

  // ==============================
  // ✨ テーマ切替
  // ==============================
  const themeToggleBtn = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("steplink-theme");
  if (savedTheme) document.body.setAttribute("data-theme", savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const now = document.body.getAttribute("data-theme") || "dark";
      const next = now === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("steplink-theme", next);
    });
  }

  // ==============================
  // ✨ アカウントモーダル開閉
  // ==============================
  const accountModal = document.getElementById("accountModal");
  const switchAccountBtn = document.getElementById("switchAccountBtn");
  const closeAccountModalBtn = document.getElementById("closeAccountModalBtn");
  const accountBackdrop = accountModal?.querySelector(".modal-backdrop");

  function openAccountModal() {
    accountModal.classList.remove("hidden");
  }
  function closeAccountModal() {
    accountModal.classList.add("hidden");
  }

  if (switchAccountBtn) switchAccountBtn.addEventListener("click", openAccountModal);
  if (closeAccountModalBtn) closeAccountModalBtn.addEventListener("click", closeAccountModal);
  if (accountBackdrop) accountBackdrop.addEventListener("click", closeAccountModal);

  // ==============================
  // ✨ アカウントタブ切替（ログイン/新規）
  // ==============================
  const accountTabs = document.querySelectorAll(".account-tab");
  const accountLoginView = document.getElementById("accountLoginView");
  const accountRegisterView = document.getElementById("accountRegisterView");

  function switchAccountTab(mode) {
    accountTabs.forEach((t) =>
      t.classList.toggle("active", t.dataset.mode === mode)
    );
    if (mode === "login") {
      accountLoginView.classList.remove("hidden");
      accountRegisterView.classList.add("hidden");
    } else {
      accountLoginView.classList.add("hidden");
      accountRegisterView.classList.remove("hidden");
    }
  }

  accountTabs.forEach((t) =>
    t.addEventListener("click", () => switchAccountTab(t.dataset.mode))
  );

  // ==============================
  // ✨ Supabase 新規登録
  // ==============================
  const regNameInput = document.getElementById("regNameInput");
  const regHandleInput = document.getElementById("regHandleInput");
  const regEmailInput = document.getElementById("regEmailInput");
  const regAvatarInput = document.getElementById("regAvatarInput");
  const regPasswordInput = document.getElementById("regPasswordInput");
  const registerError = document.getElementById("registerError");
  const registerSubmitBtn = document.getElementById("registerSubmitBtn");

  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener("click", async () => {
      const name = regNameInput.value;
      const handle = regHandleInput.value;
      const email = regEmailInput.value;
      const avatar = regAvatarInput.value || "🧑‍💻";
      const password = regPasswordInput.value;

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { name, handle, avatar },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          registerError.textContent = "このメールは登録済みだよ🥺 ログインしてね。";
          switchAccountTab("login");
        } else {
          registerError.textContent = error.message;
        }
        return;
      }

      alert("アカウント作成できたよ💚 ログインしてみてね！");
      switchAccountTab("login");
    });
  }

  // ==============================
  // ✨ Supabase ログイン処理
  // ==============================
  const loginHandleInput = document.getElementById("loginHandleInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");
  const loginError = document.getElementById("loginError");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", async () => {
      const email = loginHandleInput.value;
      const password = loginPasswordInput.value;

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        loginError.textContent = error.message;
        return;
      }

      // ページの情報更新のため再読み込み
      location.reload();
    });
  }

  // ==============================
  // ✨ ログアウト
  // ==============================
  document.getElementById("currentUserName")?.addEventListener("dblclick", async () => {
    await supabaseClient.auth.signOut();
    location.reload();
  });

  // ==============================
  // ✨ 以下：投稿・モーダルは前と同じ（フロントのみ）
  // ==============================

  function updateCounter(input, counter) {
    if (!input || !counter) return;
    counter.textContent = `${input.value.length} / 140`;
  }

  // ホーム投稿系
  const tweetInput = document.getElementById("tweetInput");
  const charCounter = document.getElementById("charCounter");
  const imageSelectBtn = document.getElementById("imageSelectBtn");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const postTweetBtn = document.getElementById("postTweetBtn");
  const tweetsContainer = document.getElementById("tweetsContainer");

  if (tweetInput) {
    updateCounter(tweetInput, charCounter);
    tweetInput.addEventListener("input", () => updateCounter(tweetInput, charCounter));
  }

  if (imageSelectBtn) {
    imageSelectBtn.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.innerHTML = `<img src="${e.target.result}" />`;
      };
      reader.readAsDataURL(file);
    });
  }

  function addTweet(text) {
    if (!tweetsContainer) return;

    const article = document.createElement("article");
    article.className = "post";
    article.innerHTML = `
      <div class="post-avatar">🧑‍💻</div>
      <div class="post-body">
        <div class="post-header">
          <span class="post-name">StepLinkユーザー</span>
          <span class="post-handle">@user</span>
          <span class="post-time">今</span>
        </div>
        <div class="post-text">${text}</div>
      </div>
    `;
    tweetsContainer.prepend(article);
  }

  if (postTweetBtn) {
    postTweetBtn.addEventListener("click", () => {
      if (!tweetInput.value.trim()) return;
      addTweet(tweetInput.value.trim());
      tweetInput.value = "";
      updateCounter(tweetInput, charCounter);
      imagePreview.innerHTML = "";
    });
  }

  // モーダル（投稿）
  const tweetModal = document.getElementById("tweetModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

  function openTweetModal() {
    tweetModal.classList.remove("hidden");
  }
  function closeTweetModal() {
    tweetModal.classList.add("hidden");
  }

  if (openModalBtn) openModalBtn.addEventListener("click", openTweetModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeTweetModal);
});
