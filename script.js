// ==============================
// Supabase 初期化
// ==============================

// 自分の値に置き換え
const SUPABASE_URL = "https://ngtthuwmqdcxgddlbsyo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YJzguO8nmmVKURa58cKwVw__9ulKxI6";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  // ------------------------------
  // 共通状態
  // ------------------------------
  let currentUser = null;
  let currentProfile = null;

  // DM で使う
  let currentDmPartner = null;

  // DOM
  const tweetsContainer = document.getElementById("tweetsContainer");
  const profileTweetsContainer = document.getElementById("profileTweetsContainer");

  // ==============================
  // ユーティリティ
  // ==============================
  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(
      d.getHours()
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function updateCounter(input, counter) {
    if (!input || !counter) return;
    counter.textContent = `${input.value.length} / 140`;
  }

  // ==============================
  // テーマ（見た目だけ）
  // ==============================
  const themeToggleBtn = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("steplink-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.body.setAttribute("data-theme", savedTheme);
  }
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const now = document.body.getAttribute("data-theme") || "light";
      const next = now === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("steplink-theme", next);
    });
  }

  // ==============================
  // ログイン状態の読み込み
  // ==============================
  async function loadAuthState() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) {
      console.error("getUser error:", error);
      applyUserUI(null, null);
      return;
    }
    if (!data.user) {
      applyUserUI(null, null);
      return;
    }

    currentUser = data.user;

    // profiles から取得
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("name, handle, avatar, bio")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("プロフィール取得エラー:", profileError);
    }

    currentProfile = profileData || null;
    applyUserUI(currentUser, currentProfile);
  }

  // ==============================
  // ユーザー情報を画面に反映
  // ==============================
  function applyUserUI(user, profile) {
    const nameEl = document.getElementById("currentUserName");
    const handleEl = document.getElementById("currentUserHandle");
    const avatarEl = document.getElementById("currentUserAvatar");

    const profileNameEl = document.getElementById("profileName");
    const profileHandleEl = document.getElementById("profileHandle");
    const profileBioEl = document.querySelector(".profile-bio");
    const profileAvatarEl = document.querySelector(".profile-avatar");

    if (!user) {
      if (nameEl) nameEl.textContent = "未ログイン";
      if (handleEl) handleEl.textContent = "";
      if (avatarEl) avatarEl.textContent = "🧑‍💻";

      if (profileNameEl) profileNameEl.textContent = "StepLinkユーザー";
      if (profileHandleEl) profileHandleEl.textContent = "@user";
      if (profileBioEl) profileBioEl.textContent = "プロフィール準備中";
      if (profileAvatarEl) profileAvatarEl.textContent = "🧑‍💻";
      return;
    }

    const name =
      profile?.name || user.user_metadata?.name || "StepLinkユーザー";
    const handle =
      profile?.handle || user.user_metadata?.handle || "user";
    const avatar =
      profile?.avatar || user.user_metadata?.avatar || "🧑‍💻";
    const bio = profile?.bio || "プロフィールはまだ書かれていません";

    if (nameEl) nameEl.textContent = name;
    if (handleEl) handleEl.textContent = "@" + handle;
    if (avatarEl) avatarEl.textContent = avatar;

    if (profileNameEl) profileNameEl.textContent = name;
    if (profileHandleEl) profileHandleEl.textContent = "@" + handle;
    if (profileBioEl) profileBioEl.textContent = bio;
    if (profileAvatarEl) profileAvatarEl.textContent = avatar;
  }

  await loadAuthState();

  // ==============================
  // アカウントモーダル
  // ==============================
  const accountModal = document.getElementById("accountModal");
  const switchAccountBtn = document.getElementById("switchAccountBtn");
  const closeAccountModalBtn = document.getElementById("closeAccountModalBtn");
  const accountBackdrop = accountModal?.querySelector(".modal-backdrop");

  function openAccountModal() {
    if (accountModal) accountModal.classList.remove("hidden");
  }
  function closeAccountModal() {
    if (accountModal) accountModal.classList.add("hidden");
  }

  if (switchAccountBtn && accountModal) {
    switchAccountBtn.addEventListener("click", openAccountModal);
  }
  if (closeAccountModalBtn) {
    closeAccountModalBtn.addEventListener("click", closeAccountModal);
  }
  if (accountBackdrop) {
    accountBackdrop.addEventListener("click", closeAccountModal);
  }

  // タブ切り替え
  const accountTabs = document.querySelectorAll(".account-tab");
  const accountLoginView = document.getElementById("accountLoginView");
  const accountRegisterView = document.getElementById("accountRegisterView");

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
    tab.addEventListener("click", () => switchAccountTab(tab.dataset.mode));
  });

  // ------------------------------
  // 新規登録
  // ------------------------------
  const regNameInput = document.getElementById("regNameInput");
  const regHandleInput = document.getElementById("regHandleInput");
  const regEmailInput = document.getElementById("regEmailInput");
  const regAvatarInput = document.getElementById("regAvatarInput");
  const regPasswordInput = document.getElementById("regPasswordInput");
  const registerError = document.getElementById("registerError");
  const registerSubmitBtn = document.getElementById("registerSubmitBtn");

  async function handleRegister() {
    if (!regNameInput || !regHandleInput || !regEmailInput || !regPasswordInput)
      return;

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
      const { error: profileErr } = await supabaseClient
        .from("profiles")
        .upsert({
          id: user.id,
          name,
          handle,
          avatar,
        });

      if (profileErr) {
        console.error("profiles upsert error:", profileErr);
      }
    }

    alert("アカウント作成できたよ💚 ログインしてね！");
    switchAccountTab("login");
  }

  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener("click", handleRegister);
  }

  // ------------------------------
  // ログイン
  // ------------------------------
  const loginHandleInput = document.getElementById("loginHandleInput");
  const loginPasswordInput = document.getElementById("loginPasswordInput");
  const loginError = document.getElementById("loginError");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

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

  // ------------------------------
  // ログアウト
  // ------------------------------
  const logoutBtn = document.querySelector(".logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      location.reload();
    });
  }

  // ==============================
  // ツイート読み込み + いいね + 返信
  // ==============================
  async function loadTweetsFromDB(targetContainer = tweetsContainer) {
    if (!targetContainer) return;

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
    let replyMap = {};
    if (tweetIds.length > 0) {
      const { data: replies, error: replyErr } = await supabaseClient
        .from("tweet_replies")
        .select("*")
        .in("tweet_id", tweetIds)
        .order("created_at", { ascending: true });

      if (replyErr) {
        console.error("reply load error:", replyErr);
      } else {
        replyMap = replies.reduce((map, r) => {
          if (!map[r.tweet_id]) map[r.tweet_id] = [];
          map[r.tweet_id].push(r);
          return map;
        }, {});
      }
    }

    // いいね
    let likeMap = {};
    if (tweetIds.length > 0) {
      const { data: likes, error: likeErr } = await supabaseClient
        .from("tweet_likes")
        .select("tweet_id, user_id")
        .in("tweet_id", tweetIds);

      if (likeErr) {
        console.error("like load error:", likeErr);
      } else {
        likeMap = likes.reduce((map, l) => {
          if (!map[l.tweet_id]) {
            map[l.tweet_id] = {
              count: 0,
              likedByMe: false,
            };
          }
          map[l.tweet_id].count++;
          if (currentUser && l.user_id === currentUser.id) {
            map[l.tweet_id].likedByMe = true;
          }
          return map;
        }, {});
      }
    }

    targetContainer.innerHTML = "";
    tweets.forEach((row) => {
      const likeInfo = likeMap[row.id] || { count: 0, likedByMe: false };
      const replies = replyMap[row.id] || [];
      renderTweet(row, likeInfo, replies, targetContainer);
    });
  }

  function renderTweet(row, likeInfo, replies, container) {
    if (!container) return;

    const article = document.createElement("article");
    article.className = "post";
    article.dataset.tweetId = row.id;

    const likeCount = likeInfo.count ?? 0;
    const liked = !!likeInfo.likedByMe;

    article.innerHTML = `
      <div class="post-avatar post-user-click" data-user-id="${row.user_id}">
        ${row.avatar}
      </div>
      <div class="post-body">
        <div class="post-header">
          <span class="post-name post-user-area" data-user-id="${row.user_id}">${row.name}</span>
          <span class="post-handle">@${row.handle}</span>
          <span class="post-time">${formatTime(row.created_at)}</span>
        </div>
        <div class="post-text"></div>
        <div class="post-footer">
          <button class="reply-btn" data-tweet-id="${row.id}">返信</button>
          <button class="like-btn ${liked ? "liked" : ""}" data-tweet-id="${row.id}">
            <span class="like-heart">♥</span>
            <span class="like-count">${likeCount}</span>
          </button>
        </div>
        <div class="replies"></div>
      </div>
    `;

    article.querySelector(".post-text").textContent = row.content;

    const repliesContainer = article.querySelector(".replies");
    replies.forEach((rep) => {
      const repEl = document.createElement("div");
      repEl.className = "reply-card";
      repEl.innerHTML = `
        <div class="reply-avatar">${rep.avatar}</div>
        <div class="reply-body">
          <div class="reply-header">
            <span class="reply-name">${rep.name}</span>
            <span class="reply-handle">@${rep.handle}</span>
            <span class="reply-time">${formatTime(rep.created_at)}</span>
          </div>
          <div class="reply-text"></div>
        </div>
      `;
      repEl.querySelector(".reply-text").textContent = rep.content;
      repliesContainer.appendChild(repEl);
    });

    container.appendChild(article);
  }

  // ホームならタイムライン読み込み
  if (tweetsContainer) {
    await loadTweetsFromDB(tweetsContainer);
  }

  // プロフィールページのツイート
  if (profileTweetsContainer && currentUser) {
    const { data, error } = await supabaseClient
      .from("tweets")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const fakeLikeInfo = { count: 0, likedByMe: false };
      profileTweetsContainer.innerHTML = "";
      data.forEach((row) =>
        renderTweet(row, fakeLikeInfo, [], profileTweetsContainer)
      );
    }
  }

  // ==============================
  // 投稿作成
  // ==============================
  const tweetInput = document.getElementById("tweetInput");
  const charCounter = document.getElementById("charCounter");
  const imageSelectBtn = document.getElementById("imageSelectBtn");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const postTweetBtn = document.getElementById("postTweetBtn");

  if (tweetInput && charCounter) {
    updateCounter(tweetInput, charCounter);
    tweetInput.addEventListener("input", () =>
      updateCounter(tweetInput, charCounter)
    );
  }

  if (imageSelectBtn && imageInput && imagePreview) {
    imageSelectBtn.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.innerHTML = "";
        const img = document.createElement("img");
        img.src = e.target.result;
        imagePreview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  async function createTweet(text) {
    if (!currentUser) {
      alert("ログインしてから投稿してね🥺");
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
      console.error("tweet insert error:", error);
      alert("投稿に失敗しちゃった…😭 コンソール見て！");
      return;
    }

    if (tweetsContainer) {
      await loadTweetsFromDB(tweetsContainer);
    }
  }

  async function handlePostFrom(input, counter, preview) {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 140) {
      alert("140文字までだよ🥺");
      return;
    }

    await createTweet(text);

    input.value = "";
    if (counter) updateCounter(input, counter);
    if (preview) preview.innerHTML = "";
  }

  if (postTweetBtn && tweetInput) {
    postTweetBtn.addEventListener("click", () =>
      handlePostFrom(tweetInput, charCounter, imagePreview)
    );
  }

  // ==============================
  // 返信モーダル
  // ==============================
  const replyModal = document.getElementById("replyModal");
  const replyBackdrop = replyModal?.querySelector(".modal-backdrop");
  const replyCloseBtn = document.getElementById("closeReplyModalBtn");
  const replyInput = document.getElementById("replyInput");
  const replyPostBtn = document.getElementById("replyPostBtn");
  const replyCounter = document.getElementById("replyCharCounter");
  let replyTargetTweetId = null;

  function openReplyModal(tweetId) {
    replyTargetTweetId = tweetId;
    if (replyInput) {
      replyInput.value = "";
      if (replyCounter) updateCounter(replyInput, replyCounter);
    }
    if (replyModal) replyModal.classList.remove("hidden");
  }
  function closeReplyModal() {
    if (replyModal) replyModal.classList.add("hidden");
  }

  if (replyBackdrop) replyBackdrop.addEventListener("click", closeReplyModal);
  if (replyCloseBtn) replyCloseBtn.addEventListener("click", closeReplyModal);

  if (replyInput && replyCounter) {
    replyInput.addEventListener("input", () =>
      updateCounter(replyInput, replyCounter)
    );
  }

  async function handleReplyPost() {
    if (!replyInput || !replyTargetTweetId) return;
    const text = replyInput.value.trim();
    if (!text) return;

    if (!currentUser) {
      alert("ログインしてから返信してね🥺");
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

    const { error } = await supabaseClient.from("tweet_replies").insert({
      tweet_id: replyTargetTweetId,
      user_id: currentUser.id,
      name,
      handle,
      avatar,
      content: text,
    });

    if (error) {
      console.error("reply insert error:", error);
      alert("返信に失敗しちゃった…");
      return;
    }

    if (tweetsContainer) {
      await loadTweetsFromDB(tweetsContainer);
    }
    closeReplyModal();
  }

  if (replyPostBtn) {
    replyPostBtn.addEventListener("click", handleReplyPost);
  }

  // ==============================
  // タイムライン上のクリック（返信 / いいね）
  // ==============================
  if (tweetsContainer) {
    tweetsContainer.addEventListener("click", async (e) => {
      const replyBtn = e.target.closest(".reply-btn");
      if (replyBtn) {
        const tid = replyBtn.dataset.tweetId;
        openReplyModal(tid);
        return;
      }

      const likeBtn = e.target.closest(".like-btn");
      if (likeBtn) {
        if (!currentUser) {
          alert("ログインしてからいいねしてね🥺");
          return;
        }

        const tweetId = likeBtn.dataset.tweetId;
        const countSpan = likeBtn.querySelector(".like-count");
        let count = parseInt(countSpan.textContent || "0", 10) || 0;
        const liked = likeBtn.classList.contains("liked");

        // 楽観的更新
        if (liked) {
          likeBtn.classList.remove("liked");
          countSpan.textContent = Math.max(count - 1, 0);
        } else {
          likeBtn.classList.add("liked");
          countSpan.textContent = count + 1;
        }

        // DB更新
        if (liked) {
          const { error } = await supabaseClient
            .from("tweet_likes")
            .delete()
            .match({ tweet_id: tweetId, user_id: currentUser.id });

          if (error) {
            console.error("unlike error:", error);
            likeBtn.classList.add("liked");
            countSpan.textContent = count;
          }
        } else {
          const { error } = await supabaseClient
            .from("tweet_likes")
            .insert({ tweet_id: tweetId, user_id: currentUser.id });

          if (error) {
            console.error("like error:", error);
            likeBtn.classList.remove("liked");
            countSpan.textContent = count;
          }
        }
      }
    });
  }

  // ==============================
  // プロフィール編集（Twitter 風のボタン前提）
  // ==============================
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileModal = document.getElementById("editProfileModal");
  const editProfileBackdrop =
    editProfileModal?.querySelector(".modal-backdrop");
  const closeEditProfileModalBtn = document.getElementById(
    "closeEditProfileModalBtn"
  );
  const editNameInput = document.getElementById("editNameInput");
  const editHandleInput = document.getElementById("editHandleInput");
  const editAvatarInput = document.getElementById("editAvatarInput");
  const editBioInput = document.getElementById("editBioInput");
  const editProfileSaveBtn = document.getElementById("editProfileSaveBtn");

  function openEditProfileModal() {
    if (!currentUser) {
      alert("ログインしてから編集してね🥺");
      return;
    }
    if (editNameInput)
      editNameInput.value =
        currentProfile?.name || currentUser.user_metadata?.name || "";
    if (editHandleInput)
      editHandleInput.value =
        currentProfile?.handle || currentUser.user_metadata?.handle || "";
    if (editAvatarInput)
      editAvatarInput.value =
        currentProfile?.avatar || currentUser.user_metadata?.avatar || "🧑‍💻";
    if (editBioInput) editBioInput.value = currentProfile?.bio || "";

    if (editProfileModal) editProfileModal.classList.remove("hidden");
  }
  function closeEditProfileModal() {
    if (editProfileModal) editProfileModal.classList.add("hidden");
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", openEditProfileModal);
  }
  if (editProfileBackdrop) {
    editProfileBackdrop.addEventListener("click", closeEditProfileModal);
  }
  if (closeEditProfileModalBtn) {
    closeEditProfileModalBtn.addEventListener("click", closeEditProfileModal);
  }

  if (editProfileSaveBtn) {
    editProfileSaveBtn.addEventListener("click", async () => {
      if (!currentUser) return;
      const name = editNameInput?.value.trim() || "";
      const handle = editHandleInput?.value.trim() || "";
      const avatar = editAvatarInput?.value.trim() || "🧑‍💻";
      const bio = editBioInput?.value.trim() || "";

      const { error } = await supabaseClient.from("profiles").upsert({
        id: currentUser.id,
        name,
        handle,
        avatar,
        bio,
      });

      if (error) {
        console.error("profile update error:", error);
        alert("プロフィール更新に失敗しちゃった…");
        return;
      }

      currentProfile = { name, handle, avatar, bio };
      applyUserUI(currentUser, currentProfile);
      closeEditProfileModal();
    });
  }

  // ==============================
  // DM（messages.html 用）
  // ==============================
  const dmConversationList = document.getElementById("dmConversationList");
  const dmMessagesEl = document.getElementById("dmMessages");
  const dmInput = document.getElementById("dmInput");
  const dmSendBtn = document.getElementById("dmSendBtn");
  const dmPartnerNameEl = document.getElementById("dmPartnerName");
  const dmPartnerHandleEl = document.getElementById("dmPartnerHandle");
  const dmPartnerAvatarEl = document.getElementById("dmPartnerAvatar");

  async function loadDmConversations() {
    if (!dmConversationList || !currentUser) return;

    const { data, error } = await supabaseClient
      .from("dms")
      .select("*")
      .or(
        `from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("dms load error:", error);
      return;
    }

    const partnerIds = new Set();
    data.forEach((dm) => {
      const other =
        dm.from_user_id === currentUser.id
          ? dm.to_user_id
          : dm.from_user_id;
      partnerIds.add(other);
    });

    if (partnerIds.size === 0) {
      dmConversationList.innerHTML = "<p style='padding:8px;'>まだDMはありません</p>";
      return;
    }

    const { data: profiles, error: profErr } = await supabaseClient
      .from("profiles")
      .select("id, name, handle, avatar")
      .in("id", Array.from(partnerIds));

    if (profErr) {
      console.error("dm profiles load error:", profErr);
      return;
    }

    const profileMap = {};
    profiles.forEach((p) => (profileMap[p.id] = p));

    dmConversationList.innerHTML = "";
    partnerIds.forEach((pid) => {
      const p = profileMap[pid];
      if (!p) return;
      const item = document.createElement("div");
      item.className = "dm-conversation-item";
      item.dataset.userId = p.id;
      item.innerHTML = `
        <div class="dm-conv-avatar">${p.avatar || "🧑‍💻"}</div>
        <div class="dm-conv-main">
          <div class="dm-conv-name">${p.name}</div>
          <div class="dm-conv-last">@${p.handle}</div>
        </div>
      `;
      dmConversationList.appendChild(item);
    });
  }

  async function loadCurrentConversation() {
    if (!dmMessagesEl || !currentUser || !currentDmPartner) return;

    const { data, error } = await supabaseClient
      .from("dms")
      .select("*")
      .or(
        `and(from_user_id.eq.${currentUser.id},to_user_id.eq.${currentDmPartner.id}),and(from_user_id.eq.${currentDmPartner.id},to_user_id.eq.${currentUser.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("dm messages load error:", error);
      return;
    }

    dmMessagesEl.innerHTML = "";
    data.forEach((m) => {
      const me = m.from_user_id === currentUser.id;
      const box = document.createElement("div");
      box.className = `dm-message ${me ? "me" : "other"}`;
      box.innerHTML = `
        <div class="dm-message-text"></div>
        <div class="dm-message-time">${formatTime(m.created_at)}</div>
      `;
      box.querySelector(".dm-message-text").textContent = m.content;
      dmMessagesEl.appendChild(box);
    });

    dmMessagesEl.scrollTop = dmMessagesEl.scrollHeight;
  }

  if (dmConversationList && currentUser) {
    await loadDmConversations();

    dmConversationList.addEventListener("click", async (e) => {
      const item = e.target.closest(".dm-conversation-item");
      if (!item) return;

      const partnerId = item.dataset.userId;
      const { data: p, error } = await supabaseClient
        .from("profiles")
        .select("id, name, handle, avatar")
        .eq("id", partnerId)
        .maybeSingle();

      if (error || !p) return;

      currentDmPartner = p;

      // active クラス
      dmConversationList
        .querySelectorAll(".dm-conversation-item")
        .forEach((el) => el.classList.remove("active"));
      item.classList.add("active");

      if (dmPartnerNameEl) dmPartnerNameEl.textContent = p.name;
      if (dmPartnerHandleEl) dmPartnerHandleEl.textContent = "@" + p.handle;
      if (dmPartnerAvatarEl)
        dmPartnerAvatarEl.textContent = p.avatar || "🧑‍💻";

      await loadCurrentConversation();
    });
  }

  async function handleSendDm() {
    if (!dmInput || !currentUser || !currentDmPartner) {
      alert("相手を選んでから送ってね🥺");
      return;
    }
    const text = dmInput.value.trim();
    if (!text) return;

    const { error } = await supabaseClient.from("dms").insert({
      from_user_id: currentUser.id,
      to_user_id: currentDmPartner.id,
      content: text,
    });

    if (error) {
      console.error("dm send error:", error);
      alert("DM送信に失敗しちゃった…");
      return;
    }

    dmInput.value = "";
    await loadCurrentConversation();
  }

  if (dmSendBtn) {
    dmSendBtn.addEventListener("click", handleSendDm);
  }
  if (dmInput) {
    dmInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendDm();
      }
    });
  }
});
