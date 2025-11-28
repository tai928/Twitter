// ==============================
// Supabase 設定
// ==============================

// ★自分の Supabase プロジェクトの値に変えること！★
const SUPABASE_URL = 'https://ngtthuwmqdcxgddlbsyo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YJzguO8nmmVKURa58cKwVw__9ulKxI6';

// CDN 版 @supabase/supabase-js v2 を想定
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('StepLink script loaded. URL = ' + SUPABASE_URL);

// ==============================
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
