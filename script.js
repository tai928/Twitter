// ==============================
// Supabase 初期化
// ==============================
const SUPABASE_URL = "https://ngtthuwmqdcxgddlbsyo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YJzguO8nmmVKURa58cKwVw__9ulKxI6";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 共通状態
let currentUser = null;
let currentProfile = null;
let currentDMPartnerId = null;

// ユーティリティ
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAuthState();
  initSidebar();
  initAccountModal();
  initEditProfileModal();
  initTimelinePage();
  initDMPage();
});

// ==============================
// 認証・プロフィール
// ==============================
async function loadAuthState() {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) {
    console.error("getUser error:", error);
  }

  if (!data?.user) {
    currentUser = null;
    currentProfile = null;
    applyUserUI(null, null);
    return;
  }

  currentUser = data.user;

  const { data: profileData, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, name, handle, avatar, bio")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("profile load error:", profileError);
  }

  currentProfile = profileData || null;
  applyUserUI(currentUser, currentProfile);
}

function applyUserUI(user, profile) {
  const nameEl = document.getElementById("currentUserName");
  const handleEl = document.getElementById("currentUserHandle");
  const avatarEl = document.getElementById("currentUserAvatar");

  if (!user) {
    if (nameEl) nameEl.textContent = "未ログイン";
    if (handleEl) handleEl.textContent = "";
    if (avatarEl) avatarEl.textContent = "🧑‍💻";
    return;
  }

  const name = profile?.name || user.user_metadata?.name || "StepLinkユーザー";
  const handle =
    profile?.handle || user.user_metadata?.handle || "user";
  const avatar =
    profile?.avatar || user.user_metadata?.avatar || "🧑‍💻";

  if (nameEl) nameEl.textContent = name;
  if (handleEl) handleEl.textContent = "@" + handle;
  if (avatarEl) avatarEl.textContent = avatar;

  // 新規投稿欄のアイコン
  const newPostAvatar = document.getElementById("newPostAvatar");
  if (newPostAvatar) newPostAvatar.textContent = avatar;
}

// ==============================
// サイドバー & テーマ & ログアウト
// ==============================
function initSidebar() {
  const themeToggleBtn = document.getElementById("themeToggle");
  const logoutBtn = document.getElementById("logoutBtn");

  // テーマ
  const savedTheme = localStorage.getItem("steplink-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.body.dataset.theme = savedTheme;
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const now = document.body.dataset.theme || "light";
      const next = now === "dark" ? "light" : "dark";
      document.body.dataset.theme = next;
      localStorage.setItem("steplink-theme", next);
    });
  }

  // ログアウト
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    });
  }
}

// ==============================
// アカウントモーダル（ログイン / 新規登録）
// ==============================
function initAccountModal() {
  const accountModal = document.getElementById("accountModal");
  if (!accountModal) return;

  const switchAccountBtn = document.getElementById("switchAccountBtn");
  const closeAccountModalBtn = document.getElementById(
    "closeAccountModalBtn"
  );
  const accountBackdrop =
    accountModal.querySelector(".modal-backdrop");

  const tabs = accountModal.querySelectorAll(".account-tab");
  const loginView = document.getElementById("accountLoginView");
  const registerView = document.getElementById("accountRegisterView");

  const loginHandleInput = document.getElementById("loginHandleInput");
  const loginPasswordInput =
    document.getElementById("loginPasswordInput");
  const loginError = document.getElementById("loginError");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  const regNameInput = document.getElementById("regNameInput");
  const regHandleInput = document.getElementById("regHandleInput");
  const regEmailInput = document.getElementById("regEmailInput");
  const regAvatarInput = document.getElementById("regAvatarInput");
  const regPasswordInput =
    document.getElementById("regPasswordInput");
  const registerError = document.getElementById("registerError");
  const registerSubmitBtn =
    document.getElementById("registerSubmitBtn");

  function openModal() {
    accountModal.classList.remove("hidden");
  }
  function closeModal() {
    accountModal.classList.add("hidden");
  }

  if (switchAccountBtn) {
    switchAccountBtn.addEventListener("click", openModal);
  }
  if (closeAccountModalBtn) {
    closeAccountModalBtn.addEventListener("click", closeModal);
  }
  if (accountBackdrop) {
    accountBackdrop.addEventListener("click", closeModal);
  }

  function switchTab(mode) {
    tabs.forEach((tab) =>
      tab.classList.toggle("active", tab.dataset.mode === mode)
    );
    if (mode === "login") {
      loginView.classList.remove("hidden");
      registerView.classList.add("hidden");
    } else {
      loginView.classList.add("hidden");
      registerView.classList.remove("hidden");
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.mode));
  });

  // ログイン
  async function handleLogin() {
    const email = loginHandleInput.value.trim();
    const password = loginPasswordInput.value;
    if (!email || !password) {
      loginError.textContent = "メールとパスワードを入れてね🥺";
      return;
    }
    loginError.textContent = "";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      loginError.textContent = error.message;
      console.error(error);
      return;
    }
    location.reload();
  }

  // 新規登録
  async function handleRegister() {
    const name = regNameInput.value.trim();
    const handle = regHandleInput.value.trim();
    const email = regEmailInput.value.trim();
    const avatar = regAvatarInput.value.trim() || "🧑‍💻";
    const password = regPasswordInput.value;

    if (!name || !handle || !email || !password) {
      registerError.textContent = "必須項目が空だよ🥺";
      return;
    }
    registerError.textContent = "";

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, handle, avatar },
      },
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        registerError.textContent =
          "このメールは登録済みだよ。ログインしてね。";
      } else {
        registerError.textContent = error.message;
      }
      console.error(error);
      return;
    }

    const user = data.user;
    if (user) {
      const { error: profErr } = await supabaseClient
        .from("profiles")
        .upsert({
          id: user.id,
          name,
          handle,
          avatar,
        });
      if (profErr) console.error(profErr);
    }

    alert("アカウント作成できたよ💚 メールを確認してからログインしてね！");
    switchTab("login");
  }

  if (loginSubmitBtn) loginSubmitBtn.addEventListener("click", handleLogin);
  if (registerSubmitBtn)
    registerSubmitBtn.addEventListener("click", handleRegister);
}

// ==============================
// プロフィール編集モーダル
// ==============================
function initEditProfileModal() {
  const modal = document.getElementById("editProfileModal");
  if (!modal) return;

  const openBtns = document.querySelectorAll(".edit-profile-btn");
  const closeBtn = document.getElementById("closeEditProfileModalBtn");
  const backdrop = modal.querySelector(".modal-backdrop");
  const nameInput = document.getElementById("editProfileName");
  const handleInput = document.getElementById("editProfileHandle");
  const avatarInput = document.getElementById("editProfileAvatar");
  const bioInput = document.getElementById("editProfileBio");
  const saveBtn = document.getElementById("editProfileSaveBtn");

  function openModal() {
    if (!currentProfile) return;
    nameInput.value = currentProfile.name || "";
    handleInput.value = currentProfile.handle || "";
    avatarInput.value = currentProfile.avatar || "🧑‍💻";
    bioInput.value = currentProfile.bio || "";
    modal.classList.remove("hidden");
  }
  function closeModal() {
    modal.classList.add("hidden");
  }

  openBtns.forEach((btn) => btn.addEventListener("click", openModal));
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (backdrop) backdrop.addEventListener("click", closeModal);

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (!currentUser) return;
      const newName = nameInput.value.trim();
      const newHandle = handleInput.value.trim();
      const newAvatar = avatarInput.value.trim() || "🧑‍💻";
      const newBio = bioInput.value.trim();

      const { data, error } = await supabaseClient
        .from("profiles")
        .upsert({
          id: currentUser.id,
          name: newName,
          handle: newHandle,
          avatar: newAvatar,
          bio: newBio,
        })
        .select()
        .maybeSingle();

      if (error) {
        alert("保存に失敗した…");
        console.error(error);
        return;
      }

      currentProfile = data;
      applyUserUI(currentUser, currentProfile);
      alert("プロフィールを保存したよ💚");
      closeModal();
    });
  }
}

// ==============================
// タイムライン（ホーム）
// ==============================
function initTimelinePage() {
  const tweetsContainer =
    document.getElementById("tweetsContainer");
  if (!tweetsContainer) return; // このページじゃない

  const tweetInput = document.getElementById("tweetInput");
  const charCounter = document.getElementById("charCounter");
  const postTweetBtn = document.getElementById("postTweetBtn");

  // 文字数
  function updateCounter() {
    if (!tweetInput || !charCounter) return;
    charCounter.textContent = `${tweetInput.value.length} / 140`;
  }
  if (tweetInput && charCounter) {
    tweetInput.addEventListener("input", updateCounter);
    updateCounter();
  }

  // 投稿
  if (postTweetBtn && tweetInput) {
    postTweetBtn.addEventListener("click", async () => {
      if (!currentUser) {
        alert("ログインしてから投稿してね🥺");
        return;
      }
      const text = tweetInput.value.trim();
      if (!text) return;
      if (text.length > 140) {
        alert("140文字までだよ🥺");
        return;
      }

      const name =
        currentProfile?.name ||
        currentUser.user_metadata?.name ||
        "StepLinkユーザー";
      const handle =
        currentProfile?.handle ||
        currentUser.user_metadata?.handle ||
        "user";
      const avatar =
        currentProfile?.avatar ||
        currentUser.user_metadata?.avatar ||
        "🧑‍💻";

      const { error } = await supabaseClient.from("tweets").insert({
        user_id: currentUser.id,
        name,
        handle,
        avatar,
        content: text,
      });

      if (error) {
        alert("投稿に失敗しちゃった…");
        console.error(error);
        return;
      }

      tweetInput.value = "";
      updateCounter();
      await loadTweetsFromDB();
    });
  }

  // 返信フォーム & いいね & プロフィール遷移（イベント委譲）
  tweetsContainer.addEventListener("click", async (e) => {
    const post = e.target.closest(".post");
    if (!post) return;
    const tweetId = post.dataset.tweetId;

    // 返信ボタン
    if (e.target.closest(".reply-btn")) {
      openReplyForm(post, tweetId);
      return;
    }

    // いいね
    if (e.target.closest(".like-btn")) {
      await toggleLike(tweetId, post);
      return;
    }

    // プロフィール遷移
    const userElem = e.target.closest(
      ".post-user-area, .post-avatar.post-user-click"
    );
    if (userElem) {
      const userId = userElem.dataset.userId;
      if (userId) {
        location.href =
          "profile.html?uid=" + encodeURIComponent(userId);
      }
    }
  });

  // 初回ロード
  loadTweetsFromDB();
}

async function loadTweetsFromDB() {
  const tweetsContainer =
    document.getElementById("tweetsContainer");
  if (!tweetsContainer) return;

  const { data: tweets, error } = await supabaseClient
    .from("tweets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("tweets load error:", error);
    return;
  }

  const tweetIds = tweets.map((t) => t.id);

  // 返信
  let repliesMap = {};
  if (tweetIds.length) {
    const { data: replies, error: repErr } = await supabaseClient
      .from("tweet_replies")
      .select("*")
      .in("tweet_id", tweetIds)
      .order("created_at", { ascending: true });

    if (!repErr && replies) {
      repliesMap = replies.reduce((map, r) => {
        if (!map[r.tweet_id]) map[r.tweet_id] = [];
        map[r.tweet_id].push(r);
        return map;
      }, {});
    } else if (repErr && repErr.code !== "PGRST116") {
      console.error(repErr);
    }
  }

  // いいね
  let likesMap = {};
  if (tweetIds.length) {
    const { data: likes, error: likeErr } = await supabaseClient
      .from("tweet_likes")
      .select("tweet_id, user_id")
      .in("tweet_id", tweetIds);

    if (!likeErr && likes) {
      likesMap = likes.reduce((map, row) => {
        if (!map[row.tweet_id])
          map[row.tweet_id] = { count: 0, liked: false };
        map[row.tweet_id].count++;
        if (currentUser && row.user_id === currentUser.id) {
          map[row.tweet_id].liked = true;
        }
        return map;
      }, {});
    } else if (likeErr && likeErr.code !== "PGRST116") {
      console.error(likeErr);
    }
  }

  tweetsContainer.innerHTML = "";
  tweets.forEach((row) =>
    renderTweet(row, repliesMap, likesMap)
  );
}

function renderTweet(row, repliesMap, likesMap) {
  const tweetsContainer =
    document.getElementById("tweetsContainer");
  if (!tweetsContainer) return;

  const tweetId = row.id;
  const userId = row.user_id;
  const likeInfo = likesMap?.[tweetId] || {
    count: 0,
    liked: false,
  };

  const article = document.createElement("article");
  article.className = "post";
  article.dataset.tweetId = tweetId;

  article.innerHTML = `
    <div class="post-avatar post-user-click" data-user-id="${userId}">
      ${row.avatar || "🧑‍💻"}
    </div>
    <div class="post-body">
      <div class="post-header">
        <span class="post-user-area" data-user-id="${userId}">
          <span class="post-name">${escapeHtml(row.name)}</span>
          <span class="post-handle">@${escapeHtml(row.handle)}</span>
        </span>
        <span class="post-time">${formatTime(row.created_at)}</span>
      </div>
      <div class="post-text">${escapeHtml(row.content)}</div>

      <div class="post-footer">
        <button class="icon-btn reply-btn">返信</button>
        <button class="icon-btn like-btn ${
          likeInfo.liked ? "liked" : ""
        }">
          ❤️ <span class="like-count">${likeInfo.count}</span>
        </button>
      </div>

      <div class="replies" data-tweet-id="${tweetId}"></div>
    </div>
  `;

  const repliesContainer = article.querySelector(".replies");
  const replies = repliesMap?.[tweetId] || [];
  replies.forEach((rep) => {
    const div = document.createElement("div");
    div.className = "reply-card";
    div.innerHTML = `
      <div class="reply-avatar">${rep.avatar || "🧑‍💻"}</div>
      <div>
        <div class="reply-header">
          <span class="reply-name">${escapeHtml(rep.name)}</span>
          <span class="reply-handle">@${escapeHtml(
            rep.handle
          )}</span>
          <span class="reply-time">${formatTime(rep.created_at)}</span>
        </div>
        <div class="reply-text">${escapeHtml(rep.content)}</div>
      </div>
    `;
    repliesContainer.appendChild(div);
  });

  tweetsContainer.appendChild(article);
}

// 返信フォームをその場に出す
function openReplyForm(postElem, tweetId) {
  if (!currentUser) {
    alert("ログインしてから返信してね🥺");
    return;
  }
  // 既存フォームがあれば消す
  const old = postElem.querySelector(".reply-form");
  if (old) old.remove();

  const form = document.createElement("div");
  form.className = "reply-form";
  form.style.marginTop = "8px";
  form.innerHTML = `
    <textarea rows="2" class="reply-input" placeholder="返信を入力…"></textarea>
    <div style="margin-top:4px; text-align:right;">
      <button class="icon-btn reply-cancel">キャンセル</button>
      <button class="icon-btn reply-send">返信する</button>
    </div>
  `;
  postElem.querySelector(".post-body").appendChild(form);

  const input = form.querySelector(".reply-input");
  const cancelBtn = form.querySelector(".reply-cancel");
  const sendBtn = form.querySelector(".reply-send");

  cancelBtn.addEventListener("click", () => form.remove());

  sendBtn.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 140) {
      alert("140文字までだよ🥺");
      return;
    }
    await createReply(tweetId, text);
    form.remove();
    await loadTweetsFromDB();
  });
}

async function createReply(tweetId, text) {
  const name =
    currentProfile?.name ||
    currentUser.user_metadata?.name ||
    "StepLinkユーザー";
  const handle =
    currentProfile?.handle ||
    currentUser.user_metadata?.handle ||
    "user";
  const avatar =
    currentProfile?.avatar ||
    currentUser.user_metadata?.avatar ||
    "🧑‍💻";

  const { error } = await supabaseClient
    .from("tweet_replies")
    .insert({
      tweet_id: tweetId,
      user_id: currentUser.id,
      name,
      handle,
      avatar,
      content: text,
    });

  if (error) {
    console.error("reply insert error:", error);
    alert("返信に失敗しちゃった…");
  }
}

// いいねトグル
async function toggleLike(tweetId, postElem) {
  if (!currentUser) {
    alert("ログインしてからいいねしてね🥺");
    return;
  }
  const btn = postElem.querySelector(".like-btn");
  const countEl = postElem.querySelector(".like-count");
  const liked = btn.classList.contains("liked");

  if (!liked) {
    const { error } = await supabaseClient.from("tweet_likes").insert({
      tweet_id: tweetId,
      user_id: currentUser.id,
    });
    if (error) {
      console.error(error);
      alert("いいね失敗した…");
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("tweet_likes")
      .delete()
      .eq("tweet_id", tweetId)
      .eq("user_id", currentUser.id);
    if (error) {
      console.error(error);
      alert("いいね解除失敗した…");
      return;
    }
  }

  // 再読み込み
  await loadTweetsFromDB();
}

// ==============================
// DM ページ
// ==============================
function initDMPage() {
  const list = document.getElementById("dmConversationList");
  const messagesEl = document.getElementById("dmMessages");
  const input = document.getElementById("dmInput");
  const sendBtn = document.getElementById("dmSendBtn");
  if (!list || !messagesEl || !input || !sendBtn) return;

  if (!currentUser) {
    messagesEl.textContent = "ログインするとメッセージが使えるよ";
    return;
  }

  sendBtn.addEventListener("click", sendDM);

  loadDMConversations();
}

async function loadDMConversations() {
  const list = document.getElementById("dmConversationList");
  if (!list) return;

  list.textContent = "読み込み中…";

  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(
      `from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadDMConversations error:", error);
    list.textContent = "読み込みエラー";
    return;
  }

  if (!data || data.length === 0) {
    list.textContent = "まだメッセージがありません";
    return;
  }

  const convMap = new Map();
  for (const msg of data) {
    const partnerId =
      msg.from_user_id === currentUser.id
        ? msg.to_user_id
        : msg.from_user_id;
    if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
  }

  const partnerIds = [...convMap.keys()];

  const { data: profiles, error: profErr } = await supabaseClient
    .from("profiles")
    .select("id, name, handle, avatar")
    .in("id", partnerIds);

  if (profErr) console.error(profErr);

  const profMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  list.innerHTML = "";

  partnerIds.forEach((partnerId) => {
    const lastMsg = convMap.get(partnerId);
    const prof = profMap.get(partnerId) || {};
    const div = document.createElement("div");
    div.className = "dm-conversation-item";
    div.dataset.partnerId = partnerId;
    div.innerHTML = `
      <div class="dm-conv-avatar">${prof.avatar || "🧑‍💻"}</div>
      <div class="dm-conv-main">
        <div class="dm-conv-name">
          ${escapeHtml(prof.name || "ユーザー")}
          <span class="dm-conv-handle">@${escapeHtml(
            prof.handle || "user"
          )}</span>
        </div>
        <div class="dm-conv-last">${escapeHtml(
          lastMsg.content.slice(0, 30)
        )}</div>
      </div>
    `;
    div.addEventListener("click", () =>
      openDMConversation(partnerId, prof)
    );
    list.appendChild(div);
  });

  const first = list.querySelector(".dm-conversation-item");
  if (first) first.click();
}

async function openDMConversation(partnerId, partnerProfile) {
  currentDMPartnerId = partnerId;

  document
    .querySelectorAll(".dm-conversation-item")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.partnerId === partnerId)
    );

  const nameEl = document.getElementById("dmPartnerName");
  const handleEl = document.getElementById("dmPartnerHandle");
  const avatarEl = document.getElementById("dmPartnerAvatar");

  if (nameEl) nameEl.textContent = partnerProfile?.name || "ユーザー";
  if (handleEl)
    handleEl.textContent = "@" + (partnerProfile?.handle || "user");
  if (avatarEl)
    avatarEl.textContent =
      partnerProfile?.avatar || "🧑‍💻";

  await loadDMMessages(partnerId);
}

async function loadDMMessages(partnerId) {
  const messagesEl = document.getElementById("dmMessages");
  if (!messagesEl) return;
  messagesEl.textContent = "読み込み中…";

  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(
      `and(from_user_id.eq.${currentUser.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUser.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("loadDMMessages error:", error);
    messagesEl.textContent = "読み込みエラー";
    return;
  }

  messagesEl.innerHTML = "";
  data.forEach((msg) => {
    const isMe = msg.from_user_id === currentUser.id;
    const div = document.createElement("div");
    div.className = "dm-message " + (isMe ? "me" : "other");
    div.innerHTML = `
      <div>${escapeHtml(msg.content)}</div>
      <div class="dm-message-time">${formatTime(msg.created_at)}</div>
    `;
    messagesEl.appendChild(div);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendDM() {
  const input = document.getElementById("dmInput");
  if (!input || !currentUser || !currentDMPartnerId) return;

  const text = input.value.trim();
  if (!text) return;

  const { error } = await supabaseClient.from("messages").insert({
    from_user_id: currentUser.id,
    to_user_id: currentDMPartnerId,
    content: text,
  });

  if (error) {
    console.error("sendDM error:", error);
    alert("送信に失敗しちゃった…");
    return;
  }

  input.value = "";
  await loadDMMessages(currentDMPartnerId);
}
