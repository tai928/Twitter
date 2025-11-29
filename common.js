// common.js

document.addEventListener("DOMContentLoaded", () => {
  // テーマ切り替え
  const themeToggleBtn = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("steplink-theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    document.body.setAttribute("data-theme", savedTheme);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const now = document.body.getAttribute("data-theme") || "dark";
      const next = now === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", next);
      localStorage.setItem("steplink-theme", next);
    });
  }

  // 投稿関連（ホームにだけ要素があるけど、nullチェックしてるから他ページでもエラーにならない）
  const tweetInput = document.getElementById("tweetInput");
  const charCounter = document.getElementById("charCounter");
  const imageSelectBtn = document.getElementById("imageSelectBtn");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const postTweetBtn = document.getElementById("postTweetBtn");
  const tweetsContainer = document.getElementById("tweetsContainer");

  const tweetInputModal = document.getElementById("tweetInputModal");
  const charCounterModal = document.getElementById("charCounterModal");
  const imageSelectBtnModal = document.getElementById("imageSelectBtnModal");
  const imageInputModal = document.getElementById("imageInputModal");
  const imagePreviewModal = document.getElementById("imagePreviewModal");
  const postTweetBtnModal = document.getElementById("postTweetBtnModal");

  function updateCounter(input, counter) {
    if (!input || !counter) return;
    counter.textContent = `${input.value.length} / 140`;
  }

  if (tweetInput && charCounter) {
    updateCounter(tweetInput, charCounter);
    tweetInput.addEventListener("input", () => updateCounter(tweetInput, charCounter));
  }
  if (tweetInputModal && charCounterModal) {
    updateCounter(tweetInputModal, charCounterModal);
    tweetInputModal.addEventListener("input", () =>
      updateCounter(tweetInputModal, charCounterModal)
    );
  }

  function handleImageSelect(fileInput, previewEl) {
    if (!fileInput || !previewEl || !fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      previewEl.innerHTML = "";
      const img = document.createElement("img");
      img.src = e.target.result;
      previewEl.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  if (imageSelectBtn && imageInput) {
    imageSelectBtn.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", () =>
      handleImageSelect(imageInput, imagePreview)
    );
  }

  if (imageSelectBtnModal && imageInputModal) {
    imageSelectBtnModal.addEventListener("click", () => imageInputModal.click());
    imageInputModal.addEventListener("change", () =>
      handleImageSelect(imageInputModal, imagePreviewModal)
    );
  }

  function addTweetFrom(input, counter, preview) {
    if (!input || !tweetsContainer) return;
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 140) {
      alert("140文字までだよ");
      return;
    }

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
        <div class="post-text"></div>
      </div>
    `;
    article.querySelector(".post-text").textContent = text;

    tweetsContainer.prepend(article);

    input.value = "";
    if (counter) updateCounter(input, counter);
    if (preview) preview.innerHTML = "";
  }

  if (postTweetBtn && tweetInput) {
    postTweetBtn.addEventListener("click", () =>
      addTweetFrom(tweetInput, charCounter, imagePreview)
    );
  }
  if (postTweetBtnModal && tweetInputModal) {
    postTweetBtnModal.addEventListener("click", () =>
      addTweetFrom(tweetInputModal, charCounterModal, imagePreviewModal)
    );
  }

  // 投稿モーダル
  const tweetModal = document.getElementById("tweetModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const tweetModalBackdrop = tweetModal?.querySelector(".modal-backdrop");

  function openTweetModal() {
    if (tweetModal) tweetModal.classList.remove("hidden");
  }
  function closeTweetModal() {
    if (tweetModal) tweetModal.classList.add("hidden");
  }

  if (openModalBtn && tweetModal) openModalBtn.addEventListener("click", openTweetModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeTweetModal);
  if (tweetModalBackdrop) tweetModalBackdrop.addEventListener("click", closeTweetModal);

  // アカウントモーダル
  const accountModal = document.getElementById("accountModal");
  const switchAccountBtn = document.getElementById("switchAccountBtn");
  const closeAccountModalBtn = document.getElementById("closeAccountModalBtn");
  const accountBackdrop = accountModal?.querySelector(".modal-backdrop");
  const accountTabs = document.querySelectorAll(".account-tab");
  const accountLoginView = document.getElementById("accountLoginView");
  const accountRegisterView = document.getElementById("accountRegisterView");

  function openAccountModal() {
    if (accountModal) accountModal.classList.remove("hidden");
  }
  function closeAccountModal() {
    if (accountModal) accountModal.classList.add("hidden");
  }

  if (switchAccountBtn && accountModal) {
    switchAccountBtn.addEventListener("click", openAccountModal);
  }
  if (closeAccountModalBtn) closeAccountModalBtn.addEventListener("click", closeAccountModal);
  if (accountBackdrop) accountBackdrop.addEventListener("click", closeAccountModal);

  function switchAccountTab(mode) {
    accountTabs.forEach((tab) => {
      if (tab.dataset.mode === mode) tab.classList.add("active");
      else tab.classList.remove("active");
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
    tab.addEventListener("click", () => {
      switchAccountTab(tab.dataset.mode);
    });
  });
});
