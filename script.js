// ==============================
// StepLink / Supabase 設定
// ==============================

// ★ここは自分の Supabase プロジェクトの URL / anon key に置き換えてね
const SUPABASE_URL = 'https://ngtthuwmqdcxgddlbsyo.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

// CDN 版 supabase-js v2 想定（window.supabase から createClient）
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log('StepLink script loaded. URL = ' + SUPABASE_URL);

// ==============================
// DOM 初期化
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  // 会員登録フォーム
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  // もしログインフォームもあるなら、こんな感じで後から足せる👇
  // const loginForm = document.getElementById('login-form');
  // if (loginForm) {
  //   loginForm.addEventListener('submit', handleLoginSubmit);
  // }
});

// ==============================
// 会員登録フロー
// ==============================

// フォーム送信ハンドラ
async function handleRegisterSubmit(event) {
  event.preventDefault();

  const submitButton = event.submitter || event.target.querySelector('button[type="submit"]');

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = '登録中...';
    }

    // HTML 側の input の id はこの名前に合わせておくと楽だよ
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const usernameInput = document.getElementById('register-username');
    const displayNameInput = document.getElementById('register-display-name');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const username = usernameInput ? usernameInput.value.trim() : '';
    const displayName = displayNameInput ? displayNameInput.value.trim() : '';

    if (!email || !password) {
      alert('メールアドレスとパスワードは必須です。');
      return;
    }

    // 1. Auth サインアップ
    const { user } = await signUpWithEmailPassword(email, password);

    if (!user) {
      console.error('signUp succeeded but no user returned');
      alert('ユーザー情報が取得できませんでした。');
      return;
    }

    // 2. profiles に upsert
    await upsertProfile(user, {
      username,
      displayName,
    });

    alert('登録が完了しました！確認メールが届いている場合はチェックしてください。');

  } catch (error) {
    // もともとのログに合わせておく
    console.error('registerSubmit exception:', error);
    alert('予期しないエラーが発生しました: ' + (error.message || error));
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = '登録';
    }
  }
}

// 実際に Supabase Auth にサインアップする関数
async function signUpWithEmailPassword(email, password) {
  // 追加で user_metadata を入れたい場合は options.data に詰める
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    // options: {
    //   data: {
    //     plan: 'free',
    //   },
    // },
  });

  if (error) {
    console.error('signUp error:', error);
    alert('サインアップでエラーが発生しました: ' + error.message);
    throw error; // 上の try/catch まで投げる
  }

  console.log('signUp success:', data);

  return {
    user: data.user,
    session: data.session ?? null,
  };
}

// ==============================
// profiles テーブル upsert
// ==============================

/**
 * profiles テーブルにユーザー情報を upsert する。
 * - profiles.id  = auth.users.id（UUID）を前提にしている。
 * - もしスキーマが違うなら、この payload をテーブル定義に合わせて調整してね。
 */
async function upsertProfile(user, profileInput) {
  const payload = {
    // profiles.id が auth.users.id と紐づいている前提
    id: user.id,
    email: user.email,
    // カラム名はあなたの profiles テーブルの定義に合わせて変えてね
    username: profileInput.username || null,
    display_name: profileInput.displayName || null,
    updated_at: new Date().toISOString(),
  };

  // ここが大事：ちゃんと「オブジェクト」を渡すこと！
  // これをしないと前に出てた 400 (Empty or invalid json) になる。
  const { data, error } = await supabaseClient
    .from('profiles')
    .upsert(payload, {
      // id が PK or unique の場合、merge-duplicates 的な動きになる
      onConflict: 'id',
    });

  if (error) {
    console.error('upsertProfile error:', error);
    alert('プロフィールの保存でエラーが発生しました: ' + error.message);
    throw error;
  }

  console.log('upsertProfile success:', data);
  return data;
}

// ==============================
// （おまけ）ログイン処理を追加したい場合
// ==============================

async function handleLoginSubmit(event) {
  event.preventDefault();

  const submitButton = event.submitter || event.target.querySelector('button[type="submit"]');

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'ログイン中...';
    }

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!email || !password) {
      alert('メールアドレスとパスワードは必須です。');
      return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('login error:', error);
      alert('ログインでエラーが発生しました: ' + error.message);
      return;
    }

    console.log('login success:', data);
    alert('ログインしました！');

  } catch (error) {
    console.error('loginSubmit exception:', error);
    alert('予期しないエラーが発生しました: ' + (error.message || error));
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'ログイン';
    }
  }
}
