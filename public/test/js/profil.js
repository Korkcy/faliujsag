const API_BASE = "/api/v1";

async function apiRequest(endpoint, method = "GET", data = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {},
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

function getCurrentUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

// ====================== COMMON FUNCTIONS ======================
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
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  }
}

function togglePassword(id) {
  const input = document.getElementById(id);
  if (input) {
    input.type = input.type === "password" ? "text" : "password";
  }
}

function logout() {
  if (!confirm("Biztosan ki szeretnél jelentkezni?")) return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ====================== NAVBAR ======================
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

// ====================== PROFILE ======================
function enableEditMode() {
  document.getElementById("profilePicture").disabled = false;
  document.getElementById("email").disabled = false;
  document.getElementById("username").disabled = false;
  document.getElementById("school").disabled = false;

  document.getElementById("saveProfileBtn").style.display = "block";
}

async function loadProfile() {
  try {
    const res = await apiRequest("/users/me");
    const user = res.data.user;

    document.getElementById("profilePicture").value = user.profilePicture || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("username").value = user.username || "";
    document.getElementById("school").value = user.school || "";

    const profileImage = document.getElementById("profileImage");
    profileImage.src = user.profilePicture || "https://i.pravatar.cc/120";

    loadUserPosts();
  } catch (err) {
    console.error("Profile load error:", err);
    alert("Nem sikerült betölteni a profilt.");
  }
}

async function saveProfile() {
  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();
  const school = document.getElementById("school").value.trim();
  const profilePicture = document.getElementById("profilePicture").value.trim();

  try {
    const res = await apiRequest("/users/me", "PATCH", {
      email,
      username,
      school,
      profilePicture,
    });

    const updatedUser = res.data.user;

    localStorage.setItem("user", JSON.stringify(updatedUser));

    document.getElementById("profileImage").src =
      updatedUser.profilePicture || "https://i.pravatar.cc/120";

    document.getElementById("profilePicture").disabled = true;
    document.getElementById("email").disabled = true;
    document.getElementById("username").disabled = true;
    document.getElementById("school").disabled = true;

    document.getElementById("saveProfileBtn").style.display = "none";

    alert("Profil sikeresen frissítve!");
  } catch (err) {
    alert(err.message || "Hiba történt a mentés során.");
  }
}

async function savePassword() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const newPasswordConfirm =
    document.getElementById("newPasswordConfirm").value;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    alert("Tölts ki minden jelszó mezőt!");
    return;
  }

  try {
    await apiRequest("/users/updateMyPassword", "PATCH", {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    });

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("newPasswordConfirm").value = "";

    alert("Jelszó sikeresen frissítve!");
  } catch (err) {
    alert(err.message || "Hiba történt a jelszó módosításakor.");
  }
}

// ====================== USER POSTS ======================
let userPosts = [];
let currentProfilePostId = null;
let currentEditingPostId = null;

async function loadUserPosts() {
  const container = document.getElementById("userPosts");
  if (!container) return;

  container.innerHTML = "Betöltés...";

  try {
    const res = await apiRequest("/posts/me");
    userPosts = res.data.posts || [];

    container.innerHTML = "";

    if (userPosts.length === 0) {
      container.innerHTML = "<p>Még nincs saját posztod.</p>";
      return;
    }

    userPosts.forEach((post) => {
      const div = document.createElement("div");
      div.className = "user-post clickable-post";
      div.innerHTML = `
    <h3>${post.title || ""}</h3>
    <p>${post.description || ""}</p>

    <div class="post-actions">
      <button type="button" onclick="event.stopPropagation(); editMyPost('${post._id}')">Szerkesztés</button>
      <button type="button" onclick="event.stopPropagation(); deleteMyPost('${post._id}')">Törlés</button>
    </div>
  `;

      div.addEventListener("click", () => {
        openMyPost(post._id);
      });

      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "Hiba a posztok betöltésekor";
  }
}

function getAuthorName(post) {
  if (post.author && typeof post.author === "object") {
    return post.author.username || "Ismeretlen felhasználó";
  }
  return "Ismeretlen felhasználó";
}

function goToUserProfile(userId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const currentUser = getCurrentUser();

  if (
    currentUser &&
    (currentUser.id === userId || currentUser._id === userId)
  ) {
    window.location.href = "profile.html";
    return;
  }

  window.location.href = `user.html?id=${userId}`;
}

function renderProfileAnswers(container, answers, level = 0) {
  const currentUser = getCurrentUser();

  answers.forEach((answer) => {
    const authorName =
      answer.author && typeof answer.author === "object"
        ? answer.author.username
        : "Ismeretlen felhasználó";

    const authorId =
      answer.author && typeof answer.author === "object"
        ? answer.author._id
        : null;

    const currentUserId = currentUser?._id || currentUser?.id;
    const isOwnAnswer = currentUserId && authorId === currentUserId;

    const wrapper = document.createElement("div");
    wrapper.className = "answer-item";
    wrapper.style.marginLeft = `${level * 20}px`;
    wrapper.style.marginTop = "12px";

    wrapper.innerHTML = `
      <p>
        <strong>
          ${
            authorId
              ? `<a href="#" onclick="goToUserProfile('${authorId}', event)">${authorName}</a>`
              : authorName
          }
        </strong>
        • ${new Date(answer.createdAt).toLocaleDateString("hu-HU")}
      </p>
      <p>${answer.text}</p>

      <div class="comment-actions">
        <button onclick="showProfileReplyBox('${answer._id}')">Válasz</button>
        ${isOwnAnswer
        ? `
              <button onclick="showProfileEditAnswerBox('${answer._id}', event)">Szerkesztés</button>
              <button onclick="deleteProfileAnswer('${answer._id}', event)">Törlés</button>
            `
        : ""
      }
      </div>

      <div id="profile-edit-answer-${answer._id}"></div>
      <div id="profile-reply-${answer._id}"></div>
    `;

    container.appendChild(wrapper);

    if (answer.replies && answer.replies.length > 0) {
      renderProfileAnswers(container, answer.replies, level + 1);
    }
  });
}

function showProfileReplyBox(answerId) {
  if (!localStorage.getItem("token")) {
    alert("Válaszoláshoz jelentkezz be!");
    return;
  }

  const container = document.getElementById(`profile-reply-${answerId}`);

  container.innerHTML = `
    <div class="comment-box">
      <textarea id="profileReplyText-${answerId}" placeholder="Válasz..."></textarea>
      <button onclick="submitProfileReply('${answerId}')">Küldés</button>
    </div>
  `;
}

async function submitProfileReply(parentId) {
  const text = document
    .getElementById(`profileReplyText-${parentId}`)
    .value.trim();

  if (!text) return;

  if (!localStorage.getItem("token")) {
    alert("Válaszoláshoz jelentkezz be!");
    return;
  }

  try {
    await apiRequest(`/posts/${currentProfilePostId}/answers`, "POST", {
      text,
      replyTo: parentId,
    });

    await openMyPost(currentProfilePostId);
  } catch (err) {
    alert(err.message || "Nem sikerült elküldeni a választ.");
  }
}

function showProfileEditAnswerBox(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const container = document.getElementById(`profile-edit-answer-${answerId}`);
  if (!container) return;

  container.innerHTML = `
    <div class="comment-box">
      <textarea id="profileEditAnswerText-${answerId}" placeholder="Szerkesztett válasz..."></textarea>
      <button onclick="saveProfileEditedAnswer('${answerId}')">Mentés</button>
      <button onclick="cancelProfileEditAnswer('${answerId}')">Mégse</button>
    </div>
  `;
}

function cancelProfileEditAnswer(answerId) {
  const container = document.getElementById(`profile-edit-answer-${answerId}`);
  if (container) container.innerHTML = "";
}

async function saveProfileEditedAnswer(answerId) {
  const text = document
    .getElementById(`profileEditAnswerText-${answerId}`)
    ?.value.trim();

  if (!text) {
    alert("A válasz nem lehet üres.");
    return;
  }

  try {
    await apiRequest(`/answers/${answerId}`, "PATCH", { text });
    await openMyPost(currentProfilePostId);
  } catch (err) {
    alert(err.message || "Nem sikerült módosítani a kommentet.");
  }
}

async function deleteProfileAnswer(answerId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const confirmed = confirm("Biztosan törölni szeretnéd ezt a kommentet?");
  if (!confirmed) return;

  try {
    await apiRequest(`/answers/${answerId}`, "DELETE");
    await openMyPost(currentProfilePostId);
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a kommentet.");
  }
}

function closeProfilePostModal(event) {
  if (!event || event.target.id === "profilePostModal") {
    document.getElementById("profilePostModal").style.display = "none";
  }
}

async function openMyPost(postId) {
  try {
    currentProfilePostId = postId;

    const postRes = await apiRequest(`/posts/${postId}`, "GET");
    const post = postRes.data.post;

    document.getElementById("profileModalTitle").innerText = post.title;
    document.getElementById("profileModalAuthor").innerText =
      `by ${getAuthorName(post)}`;
    document.getElementById("profileModalDesc").innerText = post.description;

    const commentsContainer = document.getElementById("profileModalComments");
    commentsContainer.innerHTML = "<h4>Comments:</h4><p>Betöltés...</p>";

    const answersRes = await apiRequest(`/posts/${postId}/answers`, "GET");
    const answers = answersRes.data.answers || [];

    commentsContainer.innerHTML = "<h4>Comments:</h4>";

    if (answers.length === 0) {
      commentsContainer.innerHTML +=
        "<p>Még nincsenek válaszok ehhez a poszthoz.</p>";
    } else {
      renderProfileAnswers(commentsContainer, answers, 0);
    }

    updateProfileCommentUI();

    document.getElementById("profilePostModal").style.display = "flex";
  } catch (err) {
    console.error(err);
    alert("Nem sikerült megnyitni a posztot.");
  }
}

function updateProfileCommentUI() {
  const token = localStorage.getItem("token");
  const box = document.getElementById("profileCommentBox");

  if (!box) return;

  if (!token) {
    box.innerHTML = "<p>Kommenteléshez jelentkezz be.</p>";
  } else {
    box.innerHTML = `
      <textarea id="profileNewCommentText" placeholder="Írj kommentet..."></textarea>
      <button onclick="submitProfileComment()">Küldés</button>
    `;
  }
}

async function submitProfileComment() {
  const text = document.getElementById("profileNewCommentText").value.trim();

  if (!text) return;

  if (!localStorage.getItem("token")) {
    alert("Kommenteléshez jelentkezz be!");
    return;
  }

  try {
    await apiRequest(`/posts/${currentProfilePostId}/answers`, "POST", {
      text,
    });

    document.getElementById("profileNewCommentText").value = "";
    await openMyPost(currentProfilePostId);
  } catch (err) {
    alert(err.message || "Nem sikerült elküldeni a kommentet.");
  }
}

async function deleteMyPost(postId) {
  const confirmed = confirm("Biztosan törölni szeretnéd ezt a posztot?");
  if (!confirmed) return;

  try {
    await apiRequest(`/posts/${postId}`, "DELETE");
    await loadUserPosts();
    alert("Poszt sikeresen törölve.");
  } catch (err) {
    alert(err.message || "Nem sikerült törölni a posztot.");
  }
}

function editMyPost(postId) {
  const post = userPosts.find((p) => p._id === postId);
  if (!post) return;

  currentEditingPostId = postId;

  document.getElementById("editPostTitle").value = post.title || "";
  document.getElementById("editPostDescription").value = post.description || "";
  document.getElementById("editPostError").textContent = "";

  document.getElementById("editPostModal").style.display = "flex";
}

function closeEditPostModal(event) {
  const modal = document.getElementById("editPostModal");

  if (!event || event.target === modal) {
    modal.style.display = "none";
    document.getElementById("editPostTitle").value = "";
    document.getElementById("editPostDescription").value = "";
    document.getElementById("editPostError").textContent = "";
    currentEditingPostId = null;
  }
}

async function saveEditedPost() {
  const title = document.getElementById("editPostTitle").value.trim();
  const description = document
    .getElementById("editPostDescription")
    .value.trim();
  const errorEl = document.getElementById("editPostError");

  if (!title || !description) {
    errorEl.textContent = "A cím és a leírás megadása kötelező.";
    return;
  }

  try {
    await apiRequest(`/posts/${currentEditingPostId}`, "PATCH", {
      title,
      description,
    });

    closeEditPostModal();
    await loadUserPosts();
    alert("Poszt sikeresen frissítve.");
  } catch (err) {
    errorEl.textContent = err.message || "Nem sikerült frissíteni a posztot.";
  }
}

// ====================== STARS BACKGROUND ======================
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
        speed: Math.random() * 0.3 + 0.1,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = document.documentElement.classList.contains("dark");

    stars.forEach((s) => {
      ctx.beginPath();
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.6)" : "rgb(74, 144, 226)";
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

// ====================== INIT ======================
window.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
    return;
  }

  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }

  updateIcon();
  renderNavbar();
  loadProfile();
});
