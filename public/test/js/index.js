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
    throw new Error(result?.message || "Hiba történt.");
  }

  return result;
}

let posts = [];
let savedPostIds = [];
let currentSort = "newest";
let currentPage = 1;
let totalPages = 1;
let currentSearchTerm = "";
const POSTS_PER_PAGE = 5;

function formatDate(dateString) {
  if (!dateString) return "Ismeretlen dátum";
  const date = new Date(dateString);
  return date.toLocaleDateString("hu-HU");
}

function getAuthorName(post) {
  if (post.author && typeof post.author === "object") {
    return post.author.username || "Ismeretlen felhasználó";
  }
  return "Ismeretlen felhasználó";
}

function getCurrentUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
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

function getCurrentUserId() {
  const currentUser = getCurrentUser();
  return currentUser?._id || currentUser?.id || null;
}

function isAdmin() {
  const token = localStorage.getItem("token");
  const currentUser = getCurrentUser();

  return !!token && currentUser?.role === "admin";
}

async function adminDeletePost(postId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!isAdmin()) return;

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a posztot adminisztrátorként?");
  if (!confirmed) return;

  try {
    await apiRequest(`/posts/${postId}`, "DELETE");

    closeModal();
    await loadPosts(currentSearchTerm, currentPage);
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a posztot.");
  }
}



async function adminDeleteAnswer(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!isAdmin()) return;

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a választ adminisztrátorként?");
  if (!confirmed) return;

  try {
    await apiRequest(`/answers/${answerId}`, "DELETE");
    await openModal(currentPostId);
    await loadPosts(currentSearchTerm, currentPage);
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a választ.");
  }
}

async function loadSavedPostIds() {
  if (!localStorage.getItem("token")) {
    savedPostIds = [];
    return;
  }

  try {
    const res = await apiRequest("/users/me/saved-posts");
    const savedPosts = res.data.posts || [];
    savedPostIds = savedPosts.map(post => post._id);
  } catch (err) {
    console.error("Nem sikerült betölteni a mentett posztokat:", err.message);
    savedPostIds = [];
  }
}

function isPostSaved(postId) {
  return savedPostIds.includes(postId);
}

function getSaveButtonLabel(postId) {
  return isPostSaved(postId) ? "🔖 Eltávolítás" : "🔖 Mentés";
}

function updatePostSaveButtons(postId) {
  const buttons = document.querySelectorAll(`[data-post-id="${postId}"]`);
  buttons.forEach((btn) => {
    btn.classList.toggle("saved", isPostSaved(postId));
    btn.innerHTML = isPostSaved(postId) ? "🔖" : "📑";
  });
}

async function toggleSavedPost(postId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!localStorage.getItem("token")) {
    alert("A mentéshez jelentkezz be!");
    return;
  }

  try {
    if (isPostSaved(postId)) {
      await apiRequest(`/users/saved-posts/${postId}`, "DELETE");
      savedPostIds = savedPostIds.filter(id => id !== postId);
    } else {
      await apiRequest(`/users/saved-posts/${postId}`, "POST");
      savedPostIds.push(postId);
    }

    updatePostSaveButtons(postId);

    if (currentPostId === postId) {
      updateModalSaveButton(postId);
    }
  } catch (err) {
    alert(err.message || "Nem sikerült menteni a posztot.");
  }
}

function updateModalSaveButton(postId) {
  const btn = document.getElementById("modalSaveBtn");
  if (!btn) return;

  btn.classList.toggle("saved", isPostSaved(postId));
  btn.innerHTML = isPostSaved(postId) ? "🔖" : "📑";
}

function updateModalAdminDeleteButton() {
  const btn = document.getElementById("modalAdminDeleteBtn");
  if (!btn) return;

  btn.style.display = isAdmin() ? "inline-flex" : "none";
}

function toggleSaveCurrentPost(event) {
  if (!currentPostId) return;
  toggleSavedPost(currentPostId, event);
}

function isOwnPost(post) {
  const currentUserId = getCurrentUserId();
  const authorId =
    post.author && typeof post.author === "object"
      ? post.author._id
      : post.author;

  return currentUserId && authorId === currentUserId;
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

async function loadPosts(searchTerm = currentSearchTerm, page = currentPage) {
  const container = document.getElementById("posts");
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  container.innerHTML = "<p>Betöltés...</p>";

  try {
    currentSearchTerm = searchTerm;
    currentPage = page;

    const params = new URLSearchParams();

    if (currentSearchTerm.trim()) {
      params.append("search", currentSearchTerm.trim());
    }

    if (currentSort) {
      params.append("sort", currentSort);
    }

    params.append("page", currentPage);
    params.append("limit", POSTS_PER_PAGE);

    const endpoint = `/posts?${params.toString()}`;
    console.log("Lekért endpoint:", endpoint);

    const response = await apiRequest(endpoint, "GET");

    posts = response.data.posts || [];
    currentPage = response.currentPage || 1;
    totalPages = response.totalPages || 1;

    container.innerHTML = "";

    if (posts.length === 0) {
      container.innerHTML = "<p>Nincsenek még posztok.</p>";
    } else {
      posts.forEach((post) => {
        const div = document.createElement("div");
        div.className = "post";

        const authorId =
          post.author && typeof post.author === "object"
            ? post.author._id
            : null;

        div.innerHTML = `
  <div class="post-card-top">
    <h3>${post.title}</h3>
    ${!isOwnPost(post) ? `
    <button 
      class="save-post-btn ${isPostSaved(post._id) ? "saved" : ""}"
      data-post-id="${post._id}"
      onclick="toggleSavedPost('${post._id}', event)"
    >
    ${isPostSaved(post._id) ? "🔖" : "📑"}
    </button>
` : ""}
  </div>

  <p>${post.description}</p>
  <div class="post-meta">
    <span>
      👤 ${authorId
            ? `<a href="#" onclick="goToUserProfile('${authorId}', event)">${getAuthorName(post)}</a>`
            : getAuthorName(post)
          }
    </span>
    <span>📅 ${formatDate(post.createdAt)}</span>
    <span>💬 ${post.answersCount || 0} replies</span>
  </div>
`;

        div.onclick = () => openModal(post);
        container.appendChild(div);
      });
    }

    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Hiba történt a posztok betöltésekor: ${err.message}</p>`;
  }
}

function goToPreviousPage() {
  if (currentPage > 1) {
    loadPosts(currentSearchTerm, currentPage - 1);
  }
}

function goToNextPage() {
  if (currentPage < totalPages) {
    loadPosts(currentSearchTerm, currentPage + 1);
  }
}



async function openModal(postOrId) {
  let post;

  if (typeof postOrId === "string" || postOrId._id) {
    const id = typeof postOrId === "string" ? postOrId : postOrId._id;

    const response = await apiRequest(`/posts/${id}`, "GET");
    post = response.data.post;
  } else {
    post = postOrId;
  }
 document.getElementById("modal").style.display = "flex";

  document.body.classList.add("modal-open"); // 👈 EZ

  updateCommentUI();
  await loadMyRating(post._id);
  updateModalSaveButton(post._id);
  updateModalAdminDeleteButton();

  currentPostId = post._id;

  const modalSaveBtn = document.getElementById("modalSaveBtn");
  if (modalSaveBtn) {
    if (isOwnPost(post)) {
      modalSaveBtn.style.display = "none";
    } else {
      modalSaveBtn.style.display = "inline-flex";
    }
  }

  document.getElementById("modal-title").innerText = post.title;
  const postAuthorId =
    post.author && typeof post.author === "object"
      ? post.author._id
      : null;

  document.getElementById("modal-author").innerHTML = postAuthorId
    ? `by <a href="#" onclick="goToUserProfile('${postAuthorId}', event)">${getAuthorName(post)}</a>`
    : `by ${getAuthorName(post)}`;
  document.getElementById("modal-desc").innerText = post.description;

  const comments = document.getElementById("modal-comments");
  comments.innerHTML = "<h4>Comments:</h4><p>Betöltés...</p>";

  try {
    const response = await apiRequest(`/posts/${post._id}/answers`, "GET");
    const answers = response.data.answers || [];

    comments.innerHTML = "<h4>Comments:</h4>";

    if (answers.length === 0) {
      comments.innerHTML += "<p>Még nincsenek válaszok ehhez a poszthoz.</p>";
    } else {
      renderAnswers(comments, answers, 0);
    }
  } catch (err) {
    comments.innerHTML = `<p>Hiba: ${err.message}</p>`;
  }

  document.getElementById("modal").style.display = "flex";
  updateCommentUI();
  await loadMyRating(post._id);
  updateModalSaveButton(post._id);
  updateModalAdminDeleteButton();
}

function renderAnswers(container, answers, level = 0) {
  const currentUserId = getCurrentUserId();

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
  <div class="comment-header" onclick="toggleComment(this)">
    <div>
      <strong>
        ${
          authorId
            ? `<a href="#" onclick="goToUserProfile('${authorId}', event)">${authorName}</a>`
            : authorName
        }
      </strong>
      • ${formatDate(answer.createdAt)}
    </div>
    <span class="toggle-icon">▼</span>
  </div>

  <div class="comment-body">
    <p id="answer-text-${answer._id}">${answer.text}</p>

    <div class="comment-card-top">
      <div class="comment-actions">
        <button onclick="showReplyBox('${answer._id}')">Válasz</button>
        ${
          isOwnAnswer
            ? `
          <button onclick="showEditAnswerBox('${answer._id}', event)">Szerkesztés</button>
          <button onclick="deleteAnswer('${answer._id}', event)">Törlés</button>
        `
            : ""
        }
      </div>
      ${
        isAdmin() && !isOwnAnswer
          ? `
        <button class="admin-delete-btn admin-delete-answer-btn" onclick="adminDeleteAnswer('${answer._id}', event)">
          🔨
        </button>
      `
          : ""
      }
    </div>

    <div id="edit-answer-${answer._id}"></div>
    <div id="reply-${answer._id}"></div>
  </div>
`;


    container.appendChild(wrapper);

    if (answer.replies && answer.replies.length > 0) {
      renderAnswers(container, answer.replies, level + 1);
    }
  });
}

function closeModal(e) {
  if (!e || e.target.id === "modal") {
    document.getElementById("modal").style.display = "none";
    document.body.classList.remove("modal-open"); // 👈 EZ
  }
}

/* DROPDOWN */
function toggleDropdown() {
  const d = document.getElementById("dropdown");
  d.style.display = d.style.display === "block" ? "none" : "block";
}

/* DARK MODE */
const toggle = document.getElementById("darkToggle");

if (toggle) {
  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  });
}

/* CREATE MODAL */
function openCreateModal() {
  document.getElementById("createModal").style.display = "flex";
  document.getElementById("postTitle").focus();
}

function closeCreateModal(event) {
  const modal = document.getElementById("createModal");

  if (!event || event.target === modal) {
    modal.style.display = "none";
    document.getElementById("postTitle").value = "";
    document.getElementById("postDescription").value = "";
    document.getElementById("createError").textContent = "";
  }
}

async function createPost() {
  const title = document.getElementById("postTitle").value.trim();
  const description = document.getElementById("postDescription").value.trim();
  const errorEl = document.getElementById("createError");

  if (!title) {
    errorEl.textContent = "A cím megadása kötelező!";
    return;
  }

  try {
    await apiRequest("/posts", "POST", { title, description });

    closeCreateModal();

    const searchInput = document.getElementById("searchInput");
    await loadPosts(searchInput ? searchInput.value : "");
  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message;
  }
}

function setSort(type) {
  currentSort = type;
  currentPage = 1;
  loadPosts(currentSearchTerm, 1);
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.reload();
}

//komment
let currentPostId = null;

//uj komment
async function submitComment() {
  const text = document.getElementById("newCommentText").value.trim();
  if (!text) return;

  if (!localStorage.getItem("token")) {
    alert("Kommenteléshez jelentkezz be!");
    return;
  }

  await apiRequest(`/posts/${currentPostId}/answers`, "POST", {
    text
  });

  document.getElementById("newCommentText").value = "";

  openModal(currentPostId);
}

//reply box
function showReplyBox(answerId) {
  if (!localStorage.getItem("token")) {
    alert("Válaszoláshoz jelentkezz be!");
    return;
  }

  const container = document.getElementById(`reply-${answerId}`);

  container.innerHTML = `
    <div class="comment-box">
      <textarea id="replyText-${answerId}" placeholder="Válasz..."></textarea>
      <button onclick="submitReply('${answerId}')">Küldés</button>
    </div>
  `;
}

function showEditAnswerBox(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const textEl = document.getElementById(`answer-text-${answerId}`);
  const editContainer = document.getElementById(`edit-answer-${answerId}`);

  if (!textEl || !editContainer) return;

  const currentText = textEl.textContent.trim();

  editContainer.innerHTML = `
    <div class="comment-box">
      <textarea id="editAnswerText-${answerId}">${currentText}</textarea>
      <button onclick="saveEditedAnswer('${answerId}')">Mentés</button>
      <button onclick="cancelEditAnswer('${answerId}')">Mégse</button>
    </div>
  `;
}

function cancelEditAnswer(answerId) {
  const editContainer = document.getElementById(`edit-answer-${answerId}`);
  if (editContainer) {
    editContainer.innerHTML = "";
  }
}

//reply kuldes
async function submitReply(parentId) {
  const text = document.getElementById(`replyText-${parentId}`).value.trim();
  if (!text) return;

  if (!localStorage.getItem("token")) {
    alert("Válaszoláshoz jelentkezz be!");
    return;
  }

  await apiRequest(`/posts/${currentPostId}/answers`, "POST", {
    text,
    replyTo: parentId   // ⚠️ EZ FONTOS (NEM parentId!)
  });

  openModal(currentPostId);
}

async function deleteAnswer(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a kommentet?");
  if (!confirmed) return;

  try {
    await apiRequest(`/answers/${answerId}`, "DELETE");
    await openModal(currentPostId);
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a kommentet.");
  }
}

async function saveEditedAnswer(answerId) {
  const text = document.getElementById(`editAnswerText-${answerId}`)?.value.trim();

  if (!text) {
    alert("A komment szövege nem lehet üres.");
    return;
  }

  try {
    await apiRequest(`/answers/${answerId}`, "PATCH", { text });
    await openModal(currentPostId);
  } catch (err) {
    alert(err.message || "Nem sikerült módosítani a kommentet.");
  }
}

function updateCommentUI() {
  const token = localStorage.getItem("token");
  const box = document.getElementById("commentBox");

  if (!box) return;

  if (!token) {
    box.innerHTML = "<p>Kommenteléshez jelentkezz be.</p>";
  }
}

//HÁTTÉR
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

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateIcon();
}

function updateIcon() {
  const icon = document.getElementById("icon");
  if (!icon) return;

  const isDark = document.documentElement.classList.contains("dark");
  icon.textContent = isDark ? "🌙" : "☀️";
}

window.addEventListener("DOMContentLoaded", updateIcon);

let selectedHelpful = null;

function updateHelpfulButtons() {
  const yesBtn = document.getElementById("helpfulYesBtn");
  const noBtn = document.getElementById("helpfulNoBtn");

  if (!yesBtn || !noBtn) return;

  yesBtn.classList.toggle("active-rating", selectedHelpful === true);
  noBtn.classList.toggle("active-rating", selectedHelpful === false);
}

function resetRatingUI() {
  selectedHelpful = null;
  document.getElementById("ratingScore").value = "";
  document.getElementById("ratingMessage").textContent = "";
  updateHelpfulButtons();
}

function ratePost(isHelpful) {
  selectedHelpful = isHelpful;

  document.getElementById("ratingMessage").textContent =
    isHelpful ? "👍 Hasznosnak jelölted" : "👎 Nem hasznosnak jelölted";

  updateHelpfulButtons();
}

async function loadMyRating(postId) {
  const token = localStorage.getItem("token");

  if (!token) {
    resetRatingUI();
    return;
  }

  try {
    const response = await apiRequest(`/posts/${postId}/my-rating`, "GET");
    const rating = response.data.rating;

    if (!rating) {
      resetRatingUI();
      return;
    }

    selectedHelpful = rating.helpful;
    document.getElementById("ratingScore").value = rating.score;
    document.getElementById("ratingMessage").textContent = "Köszönjük az értékelést!";
    updateHelpfulButtons();
  } catch (err) {
    console.error("Nem sikerült betölteni a ratinget:", err.message);
    resetRatingUI();
  }
}

//ertekeles kuldese
async function submitRating() {
  const score = parseInt(document.getElementById("ratingScore").value);

  if (selectedHelpful === null) {
    alert("Jelöld meg, hogy hasznos volt-e a poszt!");
    return;
  }

  if (!score || score < 1 || score > 10) {
    alert("Adj meg egy számot 1 és 10 között!");
    return;
  }

  try {
    await apiRequest(`/posts/${currentPostId}/rate`, "POST", {
      helpful: selectedHelpful,
      score
    });

    document.getElementById("ratingMessage").textContent =
      "Köszönjük az értékelést!";

    await loadMyRating(currentPostId);
    await loadPosts();
  } catch (err) {
    document.getElementById("ratingMessage").textContent = err.message;
  }
}

//navbar check
function renderNavbar() {
  const navRight = document.getElementById("navRight");
  const token = localStorage.getItem("token");

  if (!navRight) return;

  if (token) {
    navRight.innerHTML = `
      <div class="profile-menu">
        <div class="profile-icon" onclick="toggleDropdown()">👤</div>

        <div class="dropdown" id="dropdown">
          <a href="profile.html">Profil</a>
          <hr>
          <button onclick="logout()" type="button" class="logout-btn">
            Kijelentkezés
        </button>
        </div>
      </div>
    `;
  } else {
    navRight.innerHTML = `
      <a href="register.html" class="btn-outline">Regisztráció</a>
      <a href="login.html" class="btn-primary">Bejelentkezés</a>
    `;
  }
}

//meghivas

window.addEventListener("DOMContentLoaded", async () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.documentElement.classList.add("dark");

    const darkToggle = document.getElementById("darkToggle");
    if (darkToggle) darkToggle.checked = true;
  }

  const searchInput = document.getElementById("searchInput");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        currentPage = 1;
        loadPosts(searchInput.value, 1);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", goToPreviousPage);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", goToNextPage);
  }

  await syncCurrentUser();
  renderNavbar();
  await loadSavedPostIds();
  await loadPosts();
});

function toggleComment(el) {
  const parent = el.closest(".answer-item");
  parent.classList.toggle("collapsed");
}