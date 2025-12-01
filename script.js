// ==============================
// Supabase 初期化
// ==============================
const SUPABASE_URL = "https://ngtthuwmqdcxgddlbsyo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YJzguO8nmmVKURa58cKwVw__9ulKxI6";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(location.search);
  const viewingHandle = urlParams.get("u"); // プロフ表示用
  const dmToHandle = urlParams.get("to");   // DM宛先

  let currentUser = null;
  let currentProfile = null;

  let viewingProfileUserId = null;
  let currentReplyParentId = null;
  let currentDMPartnerId = null;
  const dmPartnersMap = {}; // user_id → profile

  // -------------------------
  // DOM取得
  // -------------------------
  const tweetsContainer = document.getElementById("tweetsContainer");
  const profileTweetsContainer = document.getElementById("profileTweetsContainer");
  const notificationsContainer = document.getElementById("notificationsContainer");

  // サイドバー
  const sidebarNameEl = document.getElementById("currentUserName");
  const sidebarHandleEl = document.getElementById("currentUserHandle");
  const sidebarAvatarEl = document.getElementById("currentUserAvatar");
  const logoutBtn = document.getElementById("logoutBtn");

  // コンポーザー
  const composerAvatarHome = document.getElementById("composerAvatar");
  const composerAvatarModal = document.getElementById("composerAvatarModal");

  const tweetInput = document.getElementById("tweetInput");
  const charCounter = document.getElementById("charCounter");
  const imageSelectBtn = document.getElementById("imageSelectBtn");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const postTweetBtn = document.getElementById("postTweetBtn");

  const tweetModal = document.getElementById("tweetModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const tweetModalBackdrop = tweetModal?.querySelector(".modal-backdrop");
  const tweetInputModal = document.getElementById("tweetInputModal");
  const charCounterModal = document.getElementById("charCounterModal");
  const imageSelectBtnModal = document.getElementById("imageSelectBtnModal");
  const imageInputModal = document.getElementById("imageInputModal");
  const imagePreviewModal = document.getElementById("imagePreviewModal");
  const postTweetBtnModal = document.getElementById("postTweetBtnModal");

  // 返信モーダル
  const replyModal = document.getElementById("replyModal");
  const closeReplyModalBtn = document.getElementById("closeReplyModalBtn");
  const replyInput = document.getElementById("replyInput");
  const replyCounter = document.getElementById("replyCounter");
  const replyPostBtn = document.getElementById("replyPostBtn");
  const replyAvatarEl = document.getElementById("replyAvatar");
  const replyBackdrop = replyModal?.querySelector(".modal-backdrop");

  // アカウントモーダル
  const accountModal = document.getElementById("accountModal");
  const switchAccountBtn = document.getElementById("switchAccountBtn");
  const switchAccountBtnMobile = document.getElementById("switchAccountBtnMobile");
  const closeAccountModalBtn = document.getElementById("closeAccountModalBtn");
  const accountBackdrop = accountModal?.querySelector(".modal-backdrop");
  const accountTabs = document.querySelectorAll(".account-tab");
  const accountLoginView = document.getElementById("accountLoginView");
  const accountRegisterView = document.getElementById("accountRegisterView");

  const regNameInput = document.getElementById("regNameInput");
  const regHandleInput = document.getElementById("regHandleInput");
  const regEmailInput = document.getElementById("regEmailInput");
  const regAvatarInput = document.getElementById("regAvatarInput");
  const regPasswordInput = document.getElementById("regPasswordInput");
  const registerError = document.getElementById("registerError");
  const registerSubmitBtn = document.getElementById("registerSubmitBtn");

  const loginHandleInput = document.getElementById("loginHandleInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");
  const loginError = document.getElementById("loginError");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  // プロフィール関連
  const profileNameEl = document.getElementById("profileName");
  const profileHandleEl = document.getElementById("profileHandle");
  const profileAvatarEl = document.getElementById("profileAvatar");
  const profileBioEl =
    document.getElementById("profileBio") || document.querySelector(".profile-bio");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileModal = document.getElementById("editProfileModal");
  const closeEditProfileModalBtn = document.getElementById("closeEditProfileModal");
  const editNameInput = document.getElementById("editNameInput");
  const editAvatarInput = document.getElementById("editAvatarInput");
  const editBioInput = document.getElementById("editBioInput");
  const saveProfileBtn = document.getElementById("saveProfileBtn");
  const editProfileError = document.getElementById("editProfileError");
  const editProfileBackdrop = editProfileModal?.querySelector(".modal-backdrop");
  const dmFromProfileBtn = document.getElementById("dmFromProfileBtn");

  // DM関連
  const dmConversationsEl = document.getElementById("dmConversations");
  const dmMessagesEl = document.getElementById("dmMessages");
  const dmPartnerNameEl = document.getElementById("dmPartnerName");
  const dmPartnerHandleEl = document.getElementById("dmPartnerHandle");
  const dmPartnerAvatarEl = document.getElementById("dmPartnerAvatar");
  const dmInputEl = document.getElementById("dmInput");
  const dmSendBtn = document.getElementById("dmSendBtn");

  // テーマ（見た目だけライト固定）
  const themeToggleBtn = document.getElementById("themeToggle");
  document.body.setAttribute("data-theme", "light");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.setAttribute("data-theme", "light");
      localStorage.setItem("steplink-theme", "light");
    });
  }

  // ==============================
  // ログイン状態ロード
  // ==============================
  async function loadAuthState() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data.user) {
      currentUser = null;
      currentProfile = null;
      applySidebarUI(null, null);
      return;
    }

    currentUser = data.user;

    const { data: p, error: pErr } = await supabaseClient
      .from("profiles")
      .select("id, name, handle, avatar, bio")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (pErr && pErr.code !== "PGRST116") {
      console.error("profile load error:", pErr);
    }
    currentProfile = p || null;

    applySidebarUI(currentUser, currentProfile);
  }

  function applySidebarUI(user, profile) {
    if (!user) {
      if (sidebarNameEl) sidebarNameEl.textContent = "未ログイン";
      if (sidebarHandleEl) sidebarHandleEl.textContent = "";
      if (sidebarAvatarEl) sidebarAvatarEl.textContent = "🧑‍💻";
      if (composerAvatarHome) composerAvatarHome.textContent = "🧑‍💻";
      if (composerAvatarModal) composerAvatarModal.textContent = "🧑‍💻";
      if (replyAvatarEl) replyAvatarEl.textContent = "🧑‍💻";
      return;
    }

    const name = profile?.name || user.user_metadata?.name || "StepLinkユーザー";
    const handle = profile?.handle || user.user_metadata?.handle || "user";
    const avatar = profile?.avatar || user.user_metadata?.avatar || "🧑‍💻";

    if (sidebarNameEl) sidebarNameEl.textContent = name;
    if (sidebarHandleEl) sidebarHandleEl.textContent = "@" + handle;
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = avatar;
    if (composerAvatarHome) composerAvatarHome.textContent = avatar;
    if (composerAvatarModal) composerAvatarModal.textContent = avatar;
    if (replyAvatarEl) replyAvatarEl.textContent = avatar;
  }

  function applyProfileViewUI(profileData) {
    if (!profileNameEl && !profileHandleEl && !profileAvatarEl && !profileBioEl) return;

    if (!profileData) {
      if (profileNameEl) profileNameEl.textContent = "ユーザーが見つかりません";
      if (profileHandleEl) profileHandleEl.textContent = "";
      if (profileAvatarEl) profileAvatarEl.textContent = "❓";
      if (profileBioEl) profileBioEl.textContent = "";
      return;
    }

    const { name, handle, avatar, bio } = profileData;
    if (profileNameEl) profileNameEl.textContent = name || "StepLinkユーザー";
    if (profileHandleEl) profileHandleEl.textContent = handle ? "@" + handle : "@user";
    if (profileAvatarEl) profileAvatarEl.textContent = avatar || "🧑‍💻";
    if (profileBioEl) profileBioEl.textContent =
      bio || "プロフィールはまだ書かれていません";
  }

  await loadAuthState();

  // ==============================
  // ログアウト
  // ==============================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    });
  }

  // ==============================
  // アカウントモーダル
  // ==============================
  function openAccountModal() {
    if (accountModal) accountModal.classList.remove("hidden");
  }
  function closeAccountModal() {
    if (accountModal) accountModal.classList.add("hidden");
  }

  if (switchAccountBtn && accountModal) {
    switchAccountBtn.addEventListener("click", openAccountModal);
  }
  if (switchAccountBtnMobile && accountModal) {
    switchAccountBtnMobile.addEventListener("click", openAccountModal);
  }
  if (closeAccountModalBtn) {
    closeAccountModalBtn.addEventListener("click", closeAccountModal);
  }
  if (accountBackdrop) {
    accountBackdrop.addEventListener("click", closeAccountModal);
  }

  function switchAccountTab(mode) {
    accountTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.mode === mode);
    });

    if (!accountLoginView || !accountRegisterView) return;
    if (mode === "login") {
      accountLoginView.classList.remove("hidden");
      accountRegisterView.classList.add("hidden");
    } else {
      accountLoginView.classList.add("hidden");
      accountRegisterView.classList.remove("hidden");
    }
  }

  accountTabs.forEach((tab) => {
    tab?.addEventListener("click", () => switchAccountTab(tab.dataset.mode));
  });

  // 新規登録
  async function handleRegister() {
    if (!regNameInput || !regHandleInput || !regEmailInput || !regPasswordInput) return;

    const name = regNameInput.value.trim();
    const handle = regHandleInput.value.trim();
    const email = regEmailInput.value.trim();
    const avatar = (regAvatarInput?.value.trim() || "🧑‍💻").trim();
    const password = regPasswordInput.value;

    if (!name || !handle || !email || !password) {
      if (registerError) registerError.textContent = "必須項目が空だよ🥺";
      return;
    }
    if (registerError) registerError.textContent = "";

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, handle, avatar },
      },
    });

    if (error) {
      console.error("signUp error:", error);
      if (registerError) {
        if (error.message.includes("User already registered")) {
          registerError.textContent = "このメールは登録済みだよ。ログインしてね。";
          switchAccountTab("login");
        } else {
          registerError.textContent = error.message;
        }
      }
      return;
    }

    const user = data.user;
    if (user) {
      const { error: pErr } = await supabaseClient.from("profiles").upsert({
        id: user.id,
        name,
        handle,
        avatar,
      });
      if (pErr) console.error("profiles upsert error:", pErr);
    }

    alert("アカウント作成できたよ💚 ログインしてね！");
    switchAccountTab("login");
  }

  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener("click", handleRegister);
  }

  // ログイン
  async function handleLogin() {
    if (!loginHandleInput || !loginPasswordInput) return;
    const email = loginHandleInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      if (loginError) loginError.textContent = "メールとパスワードを入れてね🥺";
      return;
    }
    if (loginError) loginError.textContent = "";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("signIn error:", error);
      if (loginError) loginError.textContent = error.message;
      return;
    }

    location.reload();
  }

  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", handleLogin);
  }

  // ==============================
  // プロフィール編集
  // ==============================
  function openEditProfileModal() {
    if (!editProfileModal || !currentUser) return;

    const name =
      currentProfile?.name || currentUser?.user_metadata?.name || "StepLinkユーザー";
    const avatar =
      currentProfile?.avatar || currentUser?.user_metadata?.avatar || "🧑‍💻";
    const bio = currentProfile?.bio || currentUser?.user_metadata?.bio || "";

    if (editNameInput) editNameInput.value = name;
    if (editAvatarInput) editAvatarInput.value = avatar;
    if (editBioInput) editBioInput.value = bio;
    if (editProfileError) editProfileError.textContent = "";

    editProfileModal.classList.remove("hidden");
  }

  function closeEditProfileModal() {
    if (editProfileModal) editProfileModal.classList.add("hidden");
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      if (!currentUser) {
        alert("ログインしてから編集してね🥺");
        return;
      }
      openEditProfileModal();
    });
  }
  if (closeEditProfileModalBtn) {
    closeEditProfileModalBtn.addEventListener("click", closeEditProfileModal);
  }
  if (editProfileBackdrop) {
    editProfileBackdrop.addEventListener("click", closeEditProfileModal);
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      if (!currentUser) return;

      const name = editNameInput?.value.trim() || "";
      const avatar = editAvatarInput?.value.trim() || "";
      const bio = editBioInput?.value.trim() || "";

      if (!name || !avatar) {
        if (editProfileError)
          editProfileError.textContent = "名前とアイコンは必須だよ🥺";
        return;
      }
      if (editProfileError) editProfileError.textContent = "";

      const handle =
        currentProfile?.handle || currentUser.user_metadata?.handle || "user";

      const { error: pErr } = await supabaseClient.from("profiles").upsert({
        id: currentUser.id,
        name,
        handle,
        avatar,
        bio,
      });
      if (pErr) {
        console.error("profile update error:", pErr);
        if (editProfileError)
          editProfileError.textContent = "プロフィール更新に失敗した…😭";
        return;
      }

      const { error: authErr } = await supabaseClient.auth.updateUser({
        data: { name, handle, avatar, bio },
      });
      if (authErr) console.error("auth update error:", authErr);

      currentProfile = { ...(currentProfile || {}), name, handle, avatar, bio };
      applySidebarUI(currentUser, currentProfile);

      if (viewingProfileUserId === currentUser.id) {
        applyProfileViewUI({ name, handle, avatar, bio });
      }

      closeEditProfileModal();
    });
  }

  // ==============================
  // DM：プロフィールから「メッセージ」ボタン
  // ==============================
  if (dmFromProfileBtn) {
    dmFromProfileBtn.addEventListener("click", () => {
      if (!profileHandleEl) return;
      const handleText = profileHandleEl.textContent || "";
      const handle = handleText.replace(/^@/, "");
      if (!handle) return;
      location.href = `messages.html?to=${encodeURIComponent(handle)}`;
    });
  }

  // ==============================
  // カウンタ & プレビュー
  // ==============================
  function updateCounter(input, counter) {
    if (!input || !counter) return;
    counter.textContent = `${input.value.length} / 140`;
  }

  function setupComposer({
    input,
    counter,
    imageBtn,
    fileInput,
    preview,
    submitBtn,
    parentId = null,
  }) {
    if (input && counter) {
      updateCounter(input, counter);
      input.addEventListener("input", () => updateCounter(input, counter));
    }

    if (imageBtn && fileInput && preview) {
      imageBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.innerHTML = "";
          const img = document.createElement("img");
          img.src = e.target.result;
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    }

    if (submitBtn && input) {
      submitBtn.addEventListener("click", () =>
        handlePostFrom(input, counter, preview, parentId)
      );
    }
  }

  // ホーム用コンポーザー
  setupComposer({
    input: tweetInput,
    counter: charCounter,
    imageBtn: imageSelectBtn,
    fileInput: imageInput,
    preview: imagePreview,
    submitBtn: postTweetBtn,
  });

  // モーダル用コンポーザー
  setupComposer({
    input: tweetInputModal,
    counter: charCounterModal,
    imageBtn: imageSelectBtnModal,
    fileInput: imageInputModal,
    preview: imagePreviewModal,
    submitBtn: postTweetBtnModal,
  });

  // ==============================
  // 通知作成ヘルパー
  // ==============================
  async function createNotification(type, targetUserId, messageText) {
    if (!currentUser || !targetUserId || targetUserId === currentUser.id) return;

    const name =
      currentProfile?.name || currentUser.user_metadata?.name || "StepLinkユーザー";
    const handle =
      currentProfile?.handle || currentUser.user_metadata?.handle || "user";
    const avatar =
      currentProfile?.avatar || currentUser.user_metadata?.avatar || "🧑‍💻";

    const snippet =
      (messageText || "").length > 60
        ? messageText.slice(0, 60) + "…"
        : messageText || "";

    const { error } = await supabaseClient.from("notifications").insert({
      user_id: targetUserId,
      from_user_id: currentUser.id,
      type,
      message: snippet,
      from_name: name,
      from_handle: handle,
      from_avatar: avatar,
    });
    if (error) console.error("notification error:", error);
  }

  // ==============================
  // 投稿処理
  // ==============================
  async function handlePostFrom(input, counter, preview, parentId = null) {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 140) {
      alert("140文字までだよ🥺");
      return;
    }

    await createTweet(text, parentId);

    input.value = "";
    if (counter) updateCounter(input, counter);
    if (preview) preview.innerHTML = "";

    if (tweetsContainer) await loadTimeline();
    if (profileTweetsContainer && viewingProfileUserId) {
      await loadProfileTimeline(viewingProfileUserId);
    }
  }

  async function createTweet(text, parentId = null) {
    if (!currentUser) {
      alert("ログインしてから投稿してね🥺");
      return;
    }

    const name =
      currentProfile?.name || currentUser.user_metadata?.name || "StepLinkユーザー";
    const handle =
      currentProfile?.handle || currentUser.user_metadata?.handle || "user";
    const avatar =
      currentProfile?.avatar || currentUser.user_metadata?.avatar || "🧑‍💻";

    const { data: inserted, error } = await supabaseClient
      .from("tweets")
      .insert({
        user_id: currentUser.id,
        name,
        handle,
        avatar,
        content: text,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) {
      console.error("tweet insert error:", error);
      alert("投稿に失敗しちゃった…😭 コンソール見て！");
      return;
    }

    // 返信 → 通知
    if (parentId) {
      const { data: parentTweet, error: parentErr } = await supabaseClient
        .from("tweets")
        .select("user_id")
        .eq("id", parentId)
        .maybeSingle();

      if (!parentErr && parentTweet && parentTweet.user_id) {
        await createNotification("reply", parentTweet.user_id, text);
      }
    }

    return inserted;
  }

  // ==============================
  // 返信モーダル
  // ==============================
  function openReplyModal(parentTweetRow) {
    currentReplyParentId = parentTweetRow.id;

    if (replyInput) {
      replyInput.value = "";
      updateCounter(replyInput, replyCounter);
    }

    if (replyModal) replyModal.classList.remove("hidden");
  }

  function closeReplyModal() {
    if (replyModal) replyModal.classList.add("hidden");
  }

  if (closeReplyModalBtn) {
    closeReplyModalBtn.addEventListener("click", closeReplyModal);
  }
  if (replyBackdrop) {
    replyBackdrop.addEventListener("click", closeReplyModal);
  }

  if (replyPostBtn && replyInput) {
    replyPostBtn.addEventListener("click", async () => {
      const text = replyInput.value.trim();
      if (!text) return;
      if (text.length > 140) {
        alert("140文字までだよ🥺");
        return;
      }

      await createTweet(text, currentReplyParentId);
      closeReplyModal();

      if (tweetsContainer) await loadTimeline();
      if (profileTweetsContainer && viewingProfileUserId) {
        await loadProfileTimeline(viewingProfileUserId);
      }
    });
  }

  // ==============================
  // タイムライン & 返信読み込み
  // ==============================
  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(
      d.getHours()
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function renderTweet(row, container, { showReplyButton = true } = {}) {
    const article = document.createElement("article");
    article.className = "post";
    article.dataset.tweetId = row.id;

    article.innerHTML = `
      <div class="post-avatar post-user-click">${row.avatar || "🧑‍💻"}</div>
      <div class="post-body">
        <div class="post-header post-user-area">
          <span class="post-name">${row.name}</span>
          <span class="post-handle">@${row.handle}</span>
          <span class="post-time">${formatTime(row.created_at)}</span>
        </div>
        <div class="post-text"></div>
        ${
          showReplyButton
            ? `<div class="post-footer">
                 <button class="icon-btn reply-button">返信</button>
               </div>`
            : ""
        }
        <div class="replies"></div>
      </div>
    `;
    article.querySelector(".post-text").textContent = row.content || "";
    container.appendChild(article);

    const userArea = article.querySelector(".post-user-area");
    const avatarArea = article.querySelector(".post-avatar.post-user-click");
    const goProfile = () => {
      if (row.handle) {
        location.href = `profile.html?u=${encodeURIComponent(row.handle)}`;
      }
    };
    if (userArea) userArea.addEventListener("click", goProfile);
    if (avatarArea) avatarArea.addEventListener("click", goProfile);

    return article;
  }

  async function loadReplies(parentId, repliesContainer) {
    if (!repliesContainer) return;
    const { data, error } = await supabaseClient
      .from("tweets")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("replies load error:", error);
      return;
    }

    repliesContainer.innerHTML = "";
    data.forEach((reply) => {
      const div = document.createElement("div");
      div.className = "reply-card";
      div.innerHTML = `
        <div class="reply-avatar">${reply.avatar || "🧑‍💻"}</div>
        <div class="reply-body">
          <div class="reply-header">
            <span class="reply-name">${reply.name}</span>
            <span class="reply-handle">@${reply.handle}</span>
            <span class="reply-time">${formatTime(reply.created_at)}</span>
          </div>
          <div class="reply-text"></div>
        </div>
      `;
      div.querySelector(".reply-text").textContent = reply.content || "";
      repliesContainer.appendChild(div);
    });
  }

  async function loadTimeline() {
    if (!tweetsContainer) return;
    const { data, error } = await supabaseClient
      .from("tweets")
      .select("*")
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("tweets load error:", error);
      return;
    }

    tweetsContainer.innerHTML = "";
    for (const row of data) {
      const article = renderTweet(row, tweetsContainer, { showReplyButton: true });
      const repliesContainer = article.querySelector(".replies");
      await loadReplies(row.id, repliesContainer);

      const replyBtn = article.querySelector(".reply-button");
      if (replyBtn) {
        replyBtn.addEventListener("click", () => {
          openReplyModal(row);
        });
      }
    }
  }

  async function loadProfileTimeline(userId) {
    if (!profileTweetsContainer || !userId) return;
    const { data, error } = await supabaseClient
      .from("tweets")
      .select("*")
      .eq("user_id", userId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("profile tweets load error:", error);
      return;
    }

    profileTweetsContainer.innerHTML = "";
    data.forEach((row) => {
      renderTweet(row, profileTweetsContainer, { showReplyButton: false });
    });
  }

  // ==============================
  // 通知一覧
  // ==============================
  async function loadNotifications() {
    if (!notificationsContainer || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("notifications load error:", error);
      return;
    }

    notificationsContainer.innerHTML = "";

    if (!data.length) {
      const empty = document.createElement("div");
      empty.className = "post";
      empty.textContent = "まだ通知はありません。";
      notificationsContainer.appendChild(empty);
      return;
    }

    data.forEach((n) => {
      const article = document.createElement("article");
      article.className = "post";

      const label =
        n.type === "reply"
          ? "あなたの投稿に返信しました"
          : n.type === "dm"
          ? "あなたにメッセージを送りました"
          : "通知";

      article.innerHTML = `
        <div class="post-avatar">${n.from_avatar || "🧑‍💻"}</div>
        <div class="post-body">
          <div class="post-header">
            <span class="post-name">${n.from_name || "ユーザー"}</span>
            <span class="post-handle">@${n.from_handle || "user"}</span>
            <span class="post-time">${formatTime(n.created_at)}</span>
          </div>
          <div class="post-text">
            ${label}<br>
            「${n.message || ""}」
          </div>
        </div>
      `;
      notificationsContainer.appendChild(article);
    });
  }

  // ==============================
  // プロフィール画面セットアップ
  // ==============================
  async function setupProfileView() {
    if (!profileNameEl && !profileTweetsContainer) return;

    // ?u=handle → 他人 or 自分
    if (viewingHandle) {
      const { data: p, error } = await supabaseClient
        .from("profiles")
        .select("id, name, handle, avatar, bio")
        .eq("handle", viewingHandle)
        .maybeSingle();

      if (error) {
        console.error("view profile load error:", error);
        applyProfileViewUI(null);
        if (editProfileBtn) editProfileBtn.style.display = "none";
        if (dmFromProfileBtn) dmFromProfileBtn.style.display = "none";
        return;
      }
      if (!p) {
        applyProfileViewUI(null);
        if (editProfileBtn) editProfileBtn.style.display = "none";
        if (dmFromProfileBtn) dmFromProfileBtn.style.display = "none";
        return;
      }

      viewingProfileUserId = p.id;
      applyProfileViewUI(p);

      if (editProfileBtn) {
        if (currentUser && currentUser.id === p.id) {
          editProfileBtn.style.display = "inline-block";
        } else {
          editProfileBtn.style.display = "none";
        }
      }
      if (dmFromProfileBtn) {
        if (currentUser && currentUser.id === p.id) {
          dmFromProfileBtn.style.display = "none";
        } else {
          dmFromProfileBtn.style.display = "inline-block";
        }
      }

      await loadProfileTimeline(viewingProfileUserId);
      return;
    }

    // 自分のプロフィール
    if (!currentUser) {
      applyProfileViewUI({
        name: "StepLinkユーザー",
        handle: "user",
        avatar: "🧑‍💻",
        bio: "ログインするとプロフィールを編集できます",
      });
      if (editProfileBtn) editProfileBtn.style.display = "none";
      if (dmFromProfileBtn) dmFromProfileBtn.style.display = "none";
      return;
    }

    const name =
      currentProfile?.name || currentUser.user_metadata?.name || "StepLinkユーザー";
    const handle =
      currentProfile?.handle || currentUser.user_metadata?.handle || "user";
    const avatar =
      currentProfile?.avatar || currentUser.user_metadata?.avatar || "🧑‍💻";
    const bio =
      currentProfile?.bio ||
      currentUser.user_metadata?.bio ||
      "プロフィールはまだ書かれていません";

    viewingProfileUserId = currentUser.id;

    applyProfileViewUI({ name, handle, avatar, bio });

    if (editProfileBtn) editProfileBtn.style.display = "inline-block";
    if (dmFromProfileBtn) dmFromProfileBtn.style.display = "none";

    await loadProfileTimeline(viewingProfileUserId);
  }

  // ==============================
  // DM 関係
  // ==============================
  async function setupDM() {
    if (!dmConversationsEl) return;

    if (!currentUser) {
      dmConversationsEl.innerHTML =
        '<div class="dm-conversation-item">ログインしてね🥺</div>';
      return;
    }

    let initialPartnerProfile = null;
    if (dmToHandle) {
      const { data: p, error } = await supabaseClient
        .from("profiles")
        .select("id, name, handle, avatar")
        .eq("handle", dmToHandle)
        .maybeSingle();
      if (!error && p) {
        initialPartnerProfile = p;
        dmPartnersMap[p.id] = p;
      }
    }

    await loadDMConversations(initialPartnerProfile);
  }

  async function loadDMConversations(initialPartnerProfile) {
    if (!dmConversationsEl || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("messages")
      .select("*")
      .or(
        `from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("messages load error:", error);
      return;
    }

    const partners = new Map(); // user_id → { lastMessage, updatedAt }

    data.forEach((msg) => {
      const partnerId =
        msg.from_user_id === currentUser.id ? msg.to_user_id : msg.from_user_id;
      const existing = partners.get(partnerId);
      if (!existing || existing.updatedAt < msg.created_at) {
        partners.set(partnerId, {
          lastMessage: msg.content,
          updatedAt: msg.created_at,
        });
      }
    });

    if (initialPartnerProfile && !partners.has(initialPartnerProfile.id)) {
      partners.set(initialPartnerProfile.id, {
        lastMessage: "",
        updatedAt: new Date().toISOString(),
      });
    }

    const partnerIds = Array.from(partners.keys());
    if (partnerIds.length) {
      const { data: profiles, error: pErr } = await supabaseClient
        .from("profiles")
        .select("id, name, handle, avatar")
        .in("id", partnerIds);

      if (!pErr && profiles) {
        profiles.forEach((p) => {
          dmPartnersMap[p.id] = p;
        });
      }
    }

    if (initialPartnerProfile) {
      dmPartnersMap[initialPartnerProfile.id] = initialPartnerProfile;
    }

    // レンダリング
    dmConversationsEl.innerHTML = "";
    if (!partnerIds.length && !initialPartnerProfile) {
      dmConversationsEl.innerHTML =
        '<div class="dm-conversation-item">まだメッセージはありません</div>';
      return;
    }

    const sorted = Array.from(partners.entries()).sort(
      (a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt)
    );

    sorted.forEach(([partnerId, info]) => {
      const profile = dmPartnersMap[partnerId] || {
        name: "ユーザー",
        handle: "user",
        avatar: "🧑‍💻",
      };

      const item = document.createElement("div");
      item.className = "dm-conversation-item";
      item.dataset.userId = partnerId;
      item.innerHTML = `
        <div class="dm-conv-avatar">${profile.avatar || "🧑‍💻"}</div>
        <div class="dm-conv-main">
          <div class="dm-conv-name">${profile.name}</div>
          <div class="dm-conv-last">${info.lastMessage || ""}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        selectConversation(partnerId);
      });
      dmConversationsEl.appendChild(item);
    });

    // 初期選択
    if (initialPartnerProfile) {
      selectConversation(initialPartnerProfile.id);
    } else if (!currentDMPartnerId && sorted.length) {
      selectConversation(sorted[0][0]);
    } else if (currentDMPartnerId) {
      selectConversation(currentDMPartnerId);
    }
  }

  async function selectConversation(partnerId) {
    currentDMPartnerId = partnerId;

    if (dmConversationsEl) {
      Array.from(dmConversationsEl.querySelectorAll(".dm-conversation-item")).forEach(
        (el) => {
          el.classList.toggle("active", el.dataset.userId === partnerId);
        }
      );
    }

    const profile =
      dmPartnersMap[partnerId] || (await fetchProfileById(partnerId));

    if (profile) dmPartnersMap[partnerId] = profile;

    if (dmPartnerNameEl) dmPartnerNameEl.textContent = profile?.name || "ユーザー";
    if (dmPartnerHandleEl)
      dmPartnerHandleEl.textContent = profile?.handle
        ? "@" + profile.handle
        : "";
    if (dmPartnerAvatarEl)
      dmPartnerAvatarEl.textContent = profile?.avatar || "🧑‍💻";

    await loadDMMessages(partnerId);
  }

  async function fetchProfileById(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, name, handle, avatar")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("fetchProfileById error:", error);
      return null;
    }
    return data;
  }

  async function loadDMMessages(partnerId) {
    if (!dmMessagesEl || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("messages")
      .select("*")
      .or(
        `and(from_user_id.eq.${currentUser.id},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${currentUser.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("dm messages load error:", error);
      return;
    }

    dmMessagesEl.innerHTML = "";
    data.forEach((msg) => {
      const div = document.createElement("div");
      div.className =
        "dm-message " + (msg.from_user_id === currentUser.id ? "me" : "other");
      div.innerHTML = `
        <div>${msg.content}</div>
        <div class="dm-message-time">${formatTime(msg.created_at)}</div>
      `;
      dmMessagesEl.appendChild(div);
    });

    dmMessagesEl.scrollTop = dmMessagesEl.scrollHeight;
  }

  async function sendDM() {
    if (!currentUser || !dmInputEl || !currentDMPartnerId) {
      alert("相手を選んでから送ってね🥺");
      return;
    }

    const text = dmInputEl.value.trim();
    if (!text) return;

    const { error, data } = await supabaseClient
      .from("messages")
      .insert({
        from_user_id: currentUser.id,
        to_user_id: currentDMPartnerId,
        content: text,
      })
      .select()
      .single();

    if (error) {
      console.error("dm insert error:", error);
      alert("メッセージ送信に失敗した…😭");
      return;
    }

    await createNotification("dm", currentDMPartnerId, text);

    dmInputEl.value = "";
    await loadDMConversations(dmPartnersMap[currentDMPartnerId] || null);
  }

  if (dmSendBtn && dmInputEl) {
    dmSendBtn.addEventListener("click", sendDM);
  }

  // ==============================
  // 投稿モーダル開閉
  // ==============================
  function openTweetModal() {
    if (tweetModal) tweetModal.classList.remove("hidden");
  }
  function closeTweetModal() {
    if (tweetModal) tweetModal.classList.add("hidden");
  }

  if (openModalBtn && tweetModal) {
    openModalBtn.addEventListener("click", openTweetModal);
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeTweetModal);
  }
  if (tweetModalBackdrop) {
    tweetModalBackdrop.addEventListener("click", closeTweetModal);
  }

  // ==============================
  // 初期ロード
  // ==============================
  if (tweetsContainer) {
    await loadTimeline();
  }
  await setupProfileView();
  if (notificationsContainer) {
    await loadNotifications();
  }
  if (dmConversationsEl) {
    await setupDM();
  }
});
