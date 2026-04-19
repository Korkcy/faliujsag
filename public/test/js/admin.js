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

function isAdmin() {
    const token = localStorage.getItem("token");
    const currentUser = getCurrentUser();

    return !!token && currentUser?.role === "admin";
}

function formatDate(dateString) {
    if (!dateString) return "Ismeretlen dátum";
    return new Date(dateString).toLocaleDateString("hu-HU");
}

function getRatingSummary(post) {
    const average =
        post.ratingsAverage !== null && post.ratingsAverage !== undefined
            ? post.ratingsAverage.toFixed(1)
            : "Nincs";

    const helpful =
        post.helpfulPercentage !== null && post.helpfulPercentage !== undefined
            ? `${post.helpfulPercentage}%`
            : "0%";

    const quantity = post.ratingsQuantity || 0;

    return `⭐ ${average} • 👍 ${helpful} hasznos (${quantity} értékelés)`;
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

function toggleDropdown() {
    const dropdown = document.getElementById("dropdown");
    if (!dropdown) return;

    dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
}

function logout() {
    if (!confirm("Biztosan ki szeretnél jelentkezni?")) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

async function adminDeletePost(postId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const confirmed = confirm("Biztosan törölni szeretnéd ezt a posztot?");
    if (!confirmed) return;

    try {
        await apiRequest(`/posts/${postId}`, "DELETE");

        adminPosts = adminPosts.filter((post) => post._id !== postId);
        renderAdminContent();
    } catch (err) {
        alert(err.message || "Nem sikerült törölni a posztot.");
    }
}

async function adminDeleteAnswer(answerId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const confirmed = confirm("Biztosan törölni szeretnéd ezt a kommentet?");
    if (!confirmed) return;

    try {
        await apiRequest(`/answers/${answerId}`, "DELETE");

        adminComments = adminComments.filter((answer) => answer._id !== answerId);
        renderAdminContent();
    } catch (err) {
        alert(err.message || "Nem sikerült törölni a kommentet.");
    }
}

async function adminBanUser(userId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const confirmed = confirm("Biztosan ki szeretnéd tiltani ezt a felhasználót?");
    if (!confirmed) return;

    try {
        await apiRequest(`/users/${userId}/ban`, "PATCH");

        adminUsers = adminUsers.map((user) =>
            user._id === userId ? { ...user, isBanned: true } : user
        );

        renderAdminContent();
    } catch (err) {
        alert(err.message || "Nem sikerült kitiltani a felhasználót.");
    }
}

async function adminUnbanUser(userId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const confirmed = confirm("Biztosan fel szeretnéd oldani a kitiltást?");
    if (!confirmed) return;

    try {
        await apiRequest(`/users/${userId}/unban`, "PATCH");

        adminUsers = adminUsers.map((user) =>
            user._id === userId ? { ...user, isBanned: false } : user
        );

        renderAdminContent();
    } catch (err) {
        alert(err.message || "Nem sikerült feloldani a kitiltást.");
    }
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
          <br>
          <a href="admin.html">Admin</a>
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

/* =========================
   ADMIN STATE
========================= */

let adminPosts = [];
let adminComments = [];
let adminUsers = [];
let adminUserSearchTerm = "";

let currentAdminView = "posts";
let currentAdminPage = 1;
let totalAdminPages = 1;
const ADMIN_ITEMS_PER_PAGE = 5;

/* =========================
   TAB KEZELÉS
========================= */

function setAdminView(view) {
    currentAdminView = view;
    currentAdminPage = 1;
    updateAdminTabs();
    updateAdminSearchVisibility();
    loadAdminContent();
}

function updateAdminTabs() {
    const tabs = document.querySelectorAll(".admin-tab");
    tabs.forEach((tab) => tab.classList.remove("active"));

    const viewToIndex = {
        posts: 0,
        comments: 1,
        users: 2
    };

    const activeTab = tabs[viewToIndex[currentAdminView]];
    if (activeTab) activeTab.classList.add("active");
}

function updateAdminSearchVisibility() {
    const searchRow = document.getElementById("adminUserSearchRow");
    if (!searchRow) return;

    searchRow.style.display = currentAdminView === "users" ? "block" : "none";
}

function goToPreviousAdminPage() {
    if (currentAdminPage > 1) {
        currentAdminPage--;
        renderAdminContent();
    }
}

function goToNextAdminPage() {
    if (currentAdminPage < totalAdminPages) {
        currentAdminPage++;
        renderAdminContent();
    }
}

/* =========================
   ADATBETÖLTÉS
========================= */

async function loadAdminContent() {
    const container = document.getElementById("adminContent");
    if (!container) return;

    container.innerHTML = "Betöltés...";

    try {
        // JELENLEG UI-VÁZ:
        // backend endpointokat a következő körben kötjük rá

        if (currentAdminView === "posts") {
            const res = await apiRequest("/posts?limit=1000&sort=newest");
            adminPosts = res.data.posts || [];
        } else if (currentAdminView === "comments") {
            const res = await apiRequest("/answers");
            adminComments = res.data.answers || [];
        } else if (currentAdminView === "users") {
            const query = adminUserSearchTerm.trim()
                ? `/users?search=${encodeURIComponent(adminUserSearchTerm.trim())}`
                : "/users";

            const res = await apiRequest(query);
            adminUsers = res.data.users || [];
        }

        renderAdminContent();
    } catch (err) {
        console.error(err);
        container.innerHTML = "Hiba az admin tartalom betöltésekor";
    }
}

/* =========================
   RENDER
========================= */

function renderAdminContent() {
    const container = document.getElementById("adminContent");
    const pageInfo = document.getElementById("adminPageInfo");
    const prevBtn = document.getElementById("adminPrevPageBtn");
    const nextBtn = document.getElementById("adminNextPageBtn");

    if (!container) return;

    let items = [];

    if (currentAdminView === "posts") {
        items = adminPosts;
    } else if (currentAdminView === "comments") {
        items = adminComments;
    } else if (currentAdminView === "users") {
        items = adminUsers;
    }

    totalAdminPages = Math.max(1, Math.ceil(items.length / ADMIN_ITEMS_PER_PAGE));

    if (currentAdminPage > totalAdminPages) {
        currentAdminPage = totalAdminPages;
    }

    const startIndex = (currentAdminPage - 1) * ADMIN_ITEMS_PER_PAGE;
    const paginatedItems = items.slice(startIndex, startIndex + ADMIN_ITEMS_PER_PAGE);

    container.innerHTML = "";

    if (paginatedItems.length === 0) {
        if (currentAdminView === "posts") {
            container.innerHTML = `<p class="admin-empty">Még nincs betölthető admin posztlista.</p>`;
        } else if (currentAdminView === "comments") {
            container.innerHTML = `<p class="admin-empty">A komment admin nézet backendje még nincs bekötve.</p>`;
        } else {
            container.innerHTML = `<p class="admin-empty">A felhasználó admin nézet backendje még nincs bekötve.</p>`;
        }
    } else {
        paginatedItems.forEach((item) => {
            const div = document.createElement("div");
            div.className =
                currentAdminView === "posts"
                    ? "admin-post-card"
                    : currentAdminView === "comments"
                        ? "admin-comment-card"
                        : "admin-user-card";

            if (currentAdminView === "posts") {
                const authorName =
                    item.author && typeof item.author === "object"
                        ? item.author.username || "Ismeretlen felhasználó"
                        : "Ismeretlen felhasználó";

                div.innerHTML = `
  <div class="admin-post-top">
    <h3>${item.title || ""}</h3>

    <button
      type="button"
      class="admin-delete-btn"
      onclick="adminDeletePost('${item._id}', event)"
    >
      🔨
    </button>
  </div>

  <p>${item.description || ""}</p>

  <div class="admin-post-meta">
    <div class="admin-post-meta-left">
      <span>👤 ${authorName}</span>
      <span>📅 ${formatDate(item.createdAt)}</span>
      <span>💬 ${item.answersCount || 0} replies</span>
    </div>

    <div class="admin-post-meta-right">
      ${getRatingSummary(item)}
    </div>
  </div>
`;
            } else if (currentAdminView === "comments") {
                const authorName =
                    item.author && typeof item.author === "object"
                        ? item.author.username || "Ismeretlen felhasználó"
                        : "Ismeretlen felhasználó";

                const postTitle =
                    item.post && typeof item.post === "object"
                        ? item.post.title || "Ismeretlen poszt"
                        : "Ismeretlen poszt";

                div.innerHTML = `
      <div class="admin-comment-top">
        <h3>${postTitle}</h3>

        <button
          type="button"
          class="admin-delete-btn"
          onclick="adminDeleteAnswer('${item._id}', event)"
        >
          🔨
        </button>
      </div>

      <p>${item.text || ""}</p>

      <div class="admin-comment-meta">
        <span>👤 ${authorName}</span>
        <span>📅 ${formatDate(item.createdAt)}</span>
      </div>
    `;
            } else if (currentAdminView === "users") {
                div.innerHTML = `
  <div class="admin-post-top">
    <h3>${item.username || "Ismeretlen felhasználó"}</h3>

    ${item.role !== "admin"
                        ? item.isBanned
                            ? `
            <button
              type="button"
              class="admin-unban-btn"
              onclick="adminUnbanUser('${item._id}', event)"
              title="Kitiltás feloldása"
            >
              😇
            </button>
          `
                            : `
            <button
              type="button"
              class="admin-delete-btn"
              onclick="adminBanUser('${item._id}', event)"
              title="Kitiltás"
            >
              🔨
            </button>
          `
                        : ""
                    }
  </div>

  <p>${item.email || ""}</p>

  <div class="admin-post-meta">
    <div class="admin-post-meta-left">
      <span>🏫 ${item.school || "Nincs megadva"}</span>
      <span>🛡️ ${item.role || "user"}</span>
    </div>

    <div class="admin-post-meta-right">
      ${item.isBanned
                        ? `<span style="color:#e74c3c; font-weight:bold;">Kitiltva</span>`
                        : `<span>Aktív</span>`
                    }
    </div>
  </div>
`;
            }

            container.appendChild(div);
        });
    }

    pageInfo.textContent = `${currentAdminPage} / ${totalAdminPages}`;
    prevBtn.disabled = currentAdminPage <= 1;
    nextBtn.disabled = currentAdminPage >= totalAdminPages;
}

/* =========================
   HÁTTÉR
========================= */

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

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem("token")) {
        window.location.href = "login.html";
        return;
    }

    if (localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark");
    }

    await syncCurrentUser();

    if (!isAdmin()) {
        window.location.href = "index.html";
        return;
    }

    updateIcon();
    renderNavbar();

    const prevBtn = document.getElementById("adminPrevPageBtn");
    const nextBtn = document.getElementById("adminNextPageBtn");

    if (prevBtn) {
        prevBtn.addEventListener("click", goToPreviousAdminPage);
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", goToNextAdminPage);
    }

    const adminUserSearchInput = document.getElementById("adminUserSearchInput");

    if (adminUserSearchInput) {
        adminUserSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                adminUserSearchTerm = adminUserSearchInput.value.trim();
                currentAdminPage = 1;
                loadAdminContent();
            }
        });
    }

    updateAdminTabs();
    loadAdminContent();
    updateAdminSearchVisibility();
});