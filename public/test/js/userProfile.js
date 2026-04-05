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
        <div class="profile-icon" id="profileIcon">👤</div>
        <div class="dropdown" id="dropdown">
          <a href="profile.html">Profil</a>
          <hr>
          <button id="logoutBtn" class="logout-btn">Kijelentkezés</button>
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

function getAuthorName(post) {
  if (post.author && typeof post.author === "object") {
    return post.author.username || "Ismeretlen felhasználó";
  }
  return "Ismeretlen felhasználó";
}

let viewedUserPosts = [];
let currentViewedPostId = null;

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

    document.getElementById("email").value = user.email || "";
    document.getElementById("username").value = user.username || "";
    document.getElementById("school").value = user.school || "";
    document.getElementById("profileImage").src =
      user.profilePicture || "https://i.pravatar.cc/120";

    const postsRes = await apiRequest(`/posts/user/${userId}`, "GET");
    viewedUserPosts = postsRes.data.posts || [];

    const container = document.getElementById("userPosts");
    container.innerHTML = "";

    if (viewedUserPosts.length === 0) {
      container.innerHTML = "<p>Ennek a felhasználónak még nincs posztja.</p>";
      return;
    }

    viewedUserPosts.forEach((post) => {
      const div = document.createElement("div");
      div.className = "user-post clickable-post";
      div.innerHTML = `
        <h3>${post.title || ""}</h3>
        <p>${post.description || ""}</p>
      `;
      div.addEventListener("click", () => openViewedUserPost(post._id));
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    alert("Nem sikerült betölteni a felhasználó profilját.");
  }
}

function renderUserAnswers(container, answers, level = 0) {
  answers.forEach((answer) => {
    const authorName =
      answer.author && typeof answer.author === "object"
        ? answer.author.username
        : "Ismeretlen felhasználó";

    const wrapper = document.createElement("div");
    wrapper.className = "answer-item";
    wrapper.style.marginLeft = `${level * 20}px`;
    wrapper.style.marginTop = "12px";

    const authorId =
      answer.author && typeof answer.author === "object"
        ? answer.author._id
        : null;

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

      <div class="comment-actions">
        <button onclick="showUserReplyBox('${answer._id}')">Válasz</button>
      </div>

      <div id="user-reply-${answer._id}"></div>
    `;

    container.appendChild(wrapper);

    if (answer.replies && answer.replies.length > 0) {
      renderUserAnswers(container, answer.replies, level + 1);
    }
  });
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
  } catch (err) {
    console.error(err);
    alert("Nem sikerült megnyitni a posztot.");
  }
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

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }

  updateIcon();
  renderNavbar();
  loadViewedUserProfile();
});