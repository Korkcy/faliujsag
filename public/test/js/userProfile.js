const API_BASE = "/api/v1";

async function apiRequest(endpoint, method = "GET", data = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {}
  };

  if (data) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(data);
  }

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  let result = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    result = await response.json();
  }

   if (!response.ok) {
        if (response.status === 403 && result?.message?.includes("ki van tiltva")) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("Ez a felhasználó ki van tiltva.");
            window.location.href = "login.html";
            return;
        }

        throw new Error(result?.message || "Hiba történt.");
    }

  return result;
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateIcon();
}

function updateIcon() {
  const icon = document.getElementById("icon");
  if (icon) {
    const isDark = document.documentElement.classList.contains("dark");
    icon.textContent = isDark ? "🌙" : "☀️";
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById("dropdown");
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function renderNavbar() {
  const navRight = document.getElementById("navRight");
  if (!navRight) return;

  const token = localStorage.getItem("token");

  if (token) {
    navRight.innerHTML = `
      <div class="profile-menu">
        <div class="profile-icon" onclick="toggleDropdown()">👤</div>

        <div class="dropdown" id="dropdown">
          <a href="profile.html">Profil</a>
          <br>
          ${isAdmin() ? `<a href="admin.html">Admin</a>` : ""}
          <hr>
          <button onclick="logout()" type="button" class="logout-btn">
            Kijelentkezés
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const profileIcon = document.getElementById("profileIcon");
      const logoutBtn = document.getElementById("logoutBtn");

      if (profileIcon) profileIcon.addEventListener("click", toggleDropdown);
      if (logoutBtn) logoutBtn.addEventListener("click", logout);
    }, 10);
  } else {
    navRight.innerHTML = `
      <a href="register.html" class="btn-outline">Regisztráció</a>
      <a href="login.html" class="btn-primary">Bejelentkezés</a>
    `;
  }
}

function getUserIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getCurrentUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function syncCurrentUser() {
  if (!localStorage.getItem("token")) return;

  try {
    const res = await apiRequest("/users/me", "GET");
    const freshUser = res.data.user;

    if (freshUser) {
      localStorage.setItem("user", JSON.stringify(freshUser));
    }
  } catch (err) {
    console.error("Nem sikerült frissíteni a current usert:", err.message);
  }
}

function isAdmin() {
  const token = localStorage.getItem("token");
  const currentUser = getCurrentUser();

  return !!token && currentUser?.role === "admin";
}

function updateViewedModalAdminDeleteButton() {
  const btn = document.getElementById("userModalAdminDeleteBtn");
  if (!btn) return;

  btn.style.display = isAdmin() ? "inline-flex" : "none";
}

async function adminDeleteViewedPost(postId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!isAdmin()) return;

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a posztot adminisztrátorként?");
  if (!confirmed) return;

  try {
    await apiRequest(`/posts/${postId}`, "DELETE");
    closeUserPostModal();
    await loadViewedUserProfile();
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a posztot.");
  }
}

async function adminDeleteViewedAnswer(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!isAdmin()) return;

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a választ adminisztrátorként?");
  if (!confirmed) return;

  try {
    await apiRequest(`/answers/${answerId}`, "DELETE");
    await openViewedUserPost(currentViewedPostId);
    await loadViewedUserProfile();
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a választ.");
  }
}

function getAuthorName(post) {
  if (post.author && typeof post.author === "object") {
    return post.author.username || "Ismeretlen felhasználó";
  }
  return "Ismeretlen felhasználó";
}

let viewedUserPosts = [];
let viewedSavedPostIds = [];
let selectedViewedHelpful = null;
let currentViewedPostId = null;

let currentViewedPage = 1;
let totalViewedPages = 1;
const VIEWED_POSTS_PER_PAGE = 5;

function renderViewedUserPosts() {
  const container = document.getElementById("userPosts");
  const pageInfo = document.getElementById("userPageInfo");
  const prevBtn = document.getElementById("userPrevPageBtn");
  const nextBtn = document.getElementById("userNextPageBtn");

  if (!container) return;

  container.innerHTML = "";

  if (viewedUserPosts.length === 0) {
    container.innerHTML = "<p>Ennek a felhasználónak még nincs posztja.</p>";

    if (pageInfo) pageInfo.textContent = "1 / 1";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  totalViewedPages = Math.max(
    1,
    Math.ceil(viewedUserPosts.length / VIEWED_POSTS_PER_PAGE)
  );

  if (currentViewedPage > totalViewedPages) {
    currentViewedPage = totalViewedPages;
  }

  const startIndex = (currentViewedPage - 1) * VIEWED_POSTS_PER_PAGE;
  const paginatedPosts = viewedUserPosts.slice(
    startIndex,
    startIndex + VIEWED_POSTS_PER_PAGE
  );

  paginatedPosts.forEach((post) => {
    const div = document.createElement("div");
    div.className = "user-post clickable-post";

    div.innerHTML = `
      <div class="post-card-top">
        <h3>${post.title || ""}</h3>
        ${localStorage.getItem("token")
          ? `<button 
              type="button"
              class="save-post-btn card-save-btn ${isViewedPostSaved(post._id) ? "saved" : ""}"
              data-viewed-post-id="${post._id}"
              onclick="toggleViewedSavedPost('${post._id}', event)"
            >
            ${isViewedPostSaved(post._id) ? "🔖" : "📑"}
            </button>`
          : ""
        }
      </div>
      <p>${post.description || ""}</p>
    `;

    div.addEventListener("click", () => openViewedUserPost(post._id));
    container.appendChild(div);
  });

  if (pageInfo) pageInfo.textContent = `${currentViewedPage} / ${totalViewedPages}`;
  if (prevBtn) prevBtn.disabled = currentViewedPage <= 1;
  if (nextBtn) nextBtn.disabled = currentViewedPage >= totalViewedPages;
}

async function loadViewedUserProfile() {
  const userId = getUserIdFromUrl();
  if (!userId) {
    alert("Hiányzó felhasználó azonosító.");
    return;
  }

  const currentUser = getCurrentUser();
  if (currentUser && (currentUser.id === userId || currentUser._id === userId)) {
    window.location.href = "profile.html";
    return;
  }

  try {
    const userRes = await apiRequest(`/users/${userId}`, "GET");
    const user = userRes.data.user;

    document.getElementById("username").value = user.username || "";
    document.getElementById("school").value = user.school || "";
    document.getElementById("profileImage").src =
      user.profilePicture || "https://i.pravatar.cc/120";
    document.getElementById("bio").value = user.bio || "";

    const postsRes = await apiRequest(`/posts/user/${userId}`, "GET");
    viewedUserPosts = postsRes.data.posts || [];

    currentViewedPage = 1;
    renderViewedUserPosts();
  } catch (err) {
    console.error(err);
    alert("Nem sikerült betölteni a felhasználó profilját.");
  }
}

function goToPreviousViewedPage() {
  if (currentViewedPage > 1) {
    currentViewedPage--;
    renderViewedUserPosts();
  }
}

function goToNextViewedPage() {
  if (currentViewedPage < totalViewedPages) {
    currentViewedPage++;
    renderViewedUserPosts();
  }
}

function renderUserAnswers(container, answers, level = 0) {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.id;

  answers.forEach((answer) => {
    const authorName =
      answer.author && typeof answer.author === "object"
        ? answer.author.username
        : "Ismeretlen felhasználó";

    const authorId =
      answer.author && typeof answer.author === "object"
        ? answer.author._id
        : null;

    const isOwnAnswer = currentUserId && authorId === currentUserId;

    const wrapper = document.createElement("div");
    wrapper.className = "answer-item";
    wrapper.style.marginLeft = `${level * 20}px`;
    wrapper.style.marginTop = "12px";

    wrapper.innerHTML = `
      <p>
        <strong>
          ${authorId
        ? `<a href="#" onclick="goToUserProfile('${authorId}', event)">${authorName}</a>`
        : authorName}
        </strong>
        • ${new Date(answer.createdAt).toLocaleDateString("hu-HU")}
      </p>
      <p>${answer.text}</p>

      <div class="comment-card-top">
        <div class="comment-actions">
          <button onclick="showUserReplyBox('${answer._id}')">Válasz</button>
          ${
            isOwnAnswer
            ? `
              <button onclick="showUserEditAnswerBox('${answer._id}', event)">Szerkesztés</button>
              <button onclick="deleteUserAnswer('${answer._id}', event)">Törlés</button>
              `
            : ""
          }
        </div>

        ${
          isAdmin() && !isOwnAnswer
          ? `
            <button class="admin-delete-btn admin-delete-answer-btn" onclick="adminDeleteViewedAnswer('${answer._id}', event)">
              🔨
            </button>
            `
          : ""
         }
      </div>

      <div id="user-edit-answer-${answer._id}"></div>
      <div id="user-reply-${answer._id}"></div>
    `;

    container.appendChild(wrapper);

    if (answer.replies && answer.replies.length > 0) {
      renderUserAnswers(container, answer.replies, level + 1);
    }
  });
}

function updateViewedSaveButtons(postId) {
  const buttons = document.querySelectorAll(`[data-viewed-post-id="${postId}"]`);
  buttons.forEach((btn) => {
    btn.classList.toggle("saved", isViewedPostSaved(postId));
    btn.innerHTML = isViewedPostSaved(postId) ? "🔖" : "📑";
  });
}

async function toggleViewedSavedPost(postId, event = null) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!localStorage.getItem("token")) {
    alert("Mentéshez jelentkezz be!");
    return;
  }

  try {
    if (isViewedPostSaved(postId)) {
      await apiRequest(`/users/saved-posts/${postId}`, "DELETE");
      viewedSavedPostIds = viewedSavedPostIds.filter(id => id !== postId);
    } else {
      await apiRequest(`/users/saved-posts/${postId}`, "POST");
      viewedSavedPostIds.push(postId);
    }

    updateViewedSaveButtons(postId);
    updateViewedModalSaveButton(postId);
  } catch (err) {
    alert(err.message || "Nem sikerült módosítani a mentett posztokat.");
  }
}

function updateViewedModalSaveButton(postId) {
  const btn = document.getElementById("userModalSaveBtn");
  if (!btn) return;

  if (!localStorage.getItem("token")) {
    btn.style.display = "none";
    return;
  }

  btn.style.display = "inline-flex";
  btn.classList.toggle("saved", isViewedPostSaved(postId));
  btn.textContent = getViewedSaveButtonLabel(postId);
}

async function openViewedUserPost(postId) {
  try {
    currentViewedPostId = postId;

    const postRes = await apiRequest(`/posts/${postId}`, "GET");
    const post = postRes.data.post;

    const postAuthorId =
      post.author && typeof post.author === "object" ? post.author._id : null;

    document.getElementById("userModalTitle").innerText = post.title;
    document.getElementById("userModalAuthor").innerHTML = postAuthorId
      ? `by <a href="#" onclick="goToUserProfile('${postAuthorId}', event)">${getAuthorName(post)}</a>`
      : `by ${getAuthorName(post)}`;
    document.getElementById("userModalDesc").innerText = post.description;

    const commentsContainer = document.getElementById("userModalComments");
    commentsContainer.innerHTML = "<h4>Comments:</h4><p>Betöltés...</p>";

    const answersRes = await apiRequest(`/posts/${postId}/answers`, "GET");
    const answers = answersRes.data.answers || [];

    commentsContainer.innerHTML = "<h4>Comments:</h4>";

    if (answers.length === 0) {
      commentsContainer.innerHTML += "<p>Még nincsenek válaszok ehhez a poszthoz.</p>";
    } else {
      renderUserAnswers(commentsContainer, answers, 0);
    }

    updateUserCommentUI();

    document.getElementById("userPostModal").style.display = "flex";
    updateViewedModalSaveButton(postId);
    updateViewedModalAdminDeleteButton();
    await loadViewedPostRating(postId);
  } catch (err) {
    console.error(err);
    alert("Nem sikerült megnyitni a posztot.");
  }
}

async function loadViewedSavedPosts() {
  const token = localStorage.getItem("token");

  if (!token) {
    viewedSavedPostIds = [];
    return;
  }

  try {
    const response = await apiRequest("/users/me/saved-posts", "GET");
    const savedPosts = response.data.posts || [];
    viewedSavedPostIds = savedPosts.map(post => post._id);
  } catch (err) {
    console.error("Nem sikerült betölteni a mentett posztokat:", err.message);
    viewedSavedPostIds = [];
  }
}

function isViewedPostSaved(postId) {
  return viewedSavedPostIds.includes(postId);
}

function getViewedSaveButtonLabel(postId) {
  return isViewedPostSaved(postId) ? "🔖" : "📑";
}

function closeUserPostModal(event) {
  if (!event || event.target.id === "userPostModal") {
    document.getElementById("userPostModal").style.display = "none";
  }
}

function updateUserCommentUI() {
  const token = localStorage.getItem("token");
  const box = document.getElementById("userCommentBox");

  if (!box) return;

  if (!token) {
    box.innerHTML = "<p>Kommenteléshez jelentkezz be.</p>";
  } else {
    box.innerHTML = `
      <textarea id="userNewCommentText" placeholder="Írj kommentet..."></textarea>
      <button onclick="submitUserComment()">Küldés</button>
    `;
  }
}

async function submitUserComment() {
  const text = document.getElementById("userNewCommentText")?.value.trim();

  if (!text) return;

  if (!localStorage.getItem("token")) {
    alert("Kommenteléshez jelentkezz be!");
    return;
  }

  try {
    await apiRequest(`/posts/${currentViewedPostId}/answers`, "POST", {
      text
    });

    document.getElementById("userNewCommentText").value = "";
    await openViewedUserPost(currentViewedPostId);
  } catch (err) {
    alert(err.message || "Nem sikerült elküldeni a kommentet.");
  }
}

function showUserReplyBox(answerId) {
  if (!localStorage.getItem("token")) {
    alert("Válaszoláshoz jelentkezz be!");
    return;
  }

  const container = document.getElementById(`user-reply-${answerId}`);

  container.innerHTML = `
    <div class="comment-box">
      <textarea id="userReplyText-${answerId}" placeholder="Válasz..."></textarea>
      <button onclick="submitUserReply('${answerId}')">Küldés</button>
    </div>
  `;
}

async function submitUserReply(parentId) {
  const text = document.getElementById(`userReplyText-${parentId}`)?.value.trim();

  if (!text) return;

  if (!localStorage.getItem("token")) {
    alert("Válaszoláshoz jelentkezz be!");
    return;
  }

  try {
    await apiRequest(`/posts/${currentViewedPostId}/answers`, "POST", {
      text,
      replyTo: parentId
    });

    await openViewedUserPost(currentViewedPostId);
  } catch (err) {
    alert(err.message || "Nem sikerült elküldeni a választ.");
  }
}

function showUserEditAnswerBox(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const container = document.getElementById(`user-edit-answer-${answerId}`);
  if (!container) return;

  container.innerHTML = `
    <div class="comment-box">
      <textarea id="userEditAnswerText-${answerId}" placeholder="Szerkesztett válasz..."></textarea>
      <button onclick="saveUserEditedAnswer('${answerId}')">Mentés</button>
      <button onclick="cancelUserEditAnswer('${answerId}')">Mégse</button>
    </div>
  `;
}

function cancelUserEditAnswer(answerId) {
  const container = document.getElementById(`user-edit-answer-${answerId}`);
  if (container) container.innerHTML = "";
}

async function saveUserEditedAnswer(answerId) {
  const text = document.getElementById(`userEditAnswerText-${answerId}`)?.value.trim();

  if (!text) {
    alert("A válasz nem lehet üres.");
    return;
  }

  try {
    await apiRequest(`/answers/${answerId}`, "PATCH", { text });
    await openViewedUserPost(currentViewedPostId);
  } catch (err) {
    alert(err.message || "Nem sikerült módosítani a kommentet.");
  }
}

async function deleteUserAnswer(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a kommentet?");
  if (!confirmed) return;

  try {
    await apiRequest(`/answers/${answerId}`, "DELETE");
    await openViewedUserPost(currentViewedPostId);
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a kommentet.");
  }
}

function updateViewedHelpfulButtons() {
  const yesBtn = document.getElementById("userHelpfulYesBtn");
  const noBtn = document.getElementById("userHelpfulNoBtn");

  if (!yesBtn || !noBtn) return;

  yesBtn.classList.toggle("active-rating", selectedViewedHelpful === true);
  noBtn.classList.toggle("active-rating", selectedViewedHelpful === false);
}

function resetViewedRatingUI() {
  selectedViewedHelpful = null;

  const scoreInput = document.getElementById("userRatingScore");
  const messageEl = document.getElementById("userRatingMessage");

  if (scoreInput) scoreInput.value = "";
  if (messageEl) messageEl.textContent = "";

  updateViewedHelpfulButtons();
}

function rateViewedPost(isHelpful) {
  selectedViewedHelpful = isHelpful;

  const messageEl = document.getElementById("userRatingMessage");
  if (messageEl) {
    messageEl.textContent =
      isHelpful ? "👍 Hasznosnak jelölted" : "👎 Nem hasznosnak jelölted";
  }

  updateViewedHelpfulButtons();
}

async function loadViewedPostRating(postId) {
  const token = localStorage.getItem("token");

  if (!token) {
    resetViewedRatingUI();
    return;
  }

  try {
    const response = await apiRequest(`/posts/${postId}/my-rating`, "GET");
    const rating = response.data.rating;

    if (!rating) {
      resetViewedRatingUI();
      return;
    }

    selectedViewedHelpful = rating.helpful;

    const scoreInput = document.getElementById("userRatingScore");
    const messageEl = document.getElementById("userRatingMessage");

    if (scoreInput) scoreInput.value = rating.score;
    if (messageEl) messageEl.textContent = "Köszönjük az értékelést!";

    updateViewedHelpfulButtons();
  } catch (err) {
    console.error("Nem sikerült betölteni a ratinget:", err.message);
    resetViewedRatingUI();
  }
}

async function submitViewedPostRating() {
  const score = parseInt(document.getElementById("userRatingScore")?.value, 10);

  if (selectedViewedHelpful === null) {
    alert("Jelöld meg, hogy hasznos volt-e a poszt!");
    return;
  }

  if (!score || score < 1 || score > 10) {
    alert("Adj meg egy számot 1 és 10 között!");
    return;
  }

  try {
    await apiRequest(`/posts/${currentViewedPostId}/rate`, "POST", {
      helpful: selectedViewedHelpful,
      score
    });

    document.getElementById("userRatingMessage").textContent =
      "Köszönjük az értékelést!";

    await loadViewedPostRating(currentViewedPostId);
  } catch (err) {
    document.getElementById("userRatingMessage").textContent =
      err.message || "Nem sikerült elküldeni az értékelést.";
  }
}

function goToUserProfile(userId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const currentUser = getCurrentUser();

  if (currentUser && (currentUser.id === userId || currentUser._id === userId)) {
    window.location.href = "profile.html";
    return;
  }

  window.location.href = `user.html?id=${userId}`;
}

const canvas = document.getElementById("stars");

if (canvas) {
  const ctx = canvas.getContext("2d");
  let stars = [];
  const STAR_COUNT = 80;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resize);
  resize();

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        speed: Math.random() * 0.3 + 0.1
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains("dark");

    stars.forEach((s) => {
      ctx.beginPath();
      ctx.fillStyle = isDark
        ? "rgba(255,255,255,0.6)"
        : "rgb(74, 144, 226)";
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      s.y += s.speed;

      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });

    requestAnimationFrame(draw);
  }

  createStars();
  draw();
}

window.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }

  updateIcon();
  await syncCurrentUser();
  renderNavbar();

  const prevBtn = document.getElementById("userPrevPageBtn");
  const nextBtn = document.getElementById("userNextPageBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", goToPreviousViewedPage);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", goToNextViewedPage);
  }

  await loadViewedSavedPosts();
  await loadViewedUserProfile();
});