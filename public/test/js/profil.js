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
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
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

    // Események hozzáadása
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

// ====================== PROFILE FUNCTIONS ======================
async function loadProfile() {
  try {
    const res = await apiRequest("/users/me");
    const user = res.data?.user || res.user;

    document.getElementById("email").value = user.email || "";
    document.getElementById("username").value = user.username || "";
    document.getElementById("school").value = user.school || "";
    loadUserPosts();
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

function togglePassword() {
  const input = document.getElementById("password");
  if (input) {
    input.type = input.type === "password" ? "text" : "password";
  }
}

async function saveProfile() {
  const email = document.getElementById("email").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const school = document.getElementById("school").value.trim();

  try {
    await apiRequest("/users/me", "PATCH", { email, username, password, school });
    alert("Profil sikeresen frissítve!");
  } catch (err) {
    alert(err.message || "Hiba történt a mentés során.");
  }
}

// User posts (maradhat a régi, ha működik)
let userPosts = [];

async function loadUserPosts() {
  const container = document.getElementById("userPosts");
  if (!container) return;
  container.innerHTML = "Betöltés...";

  try {
    const res = await apiRequest("/posts/me");
    userPosts = res.data?.posts || [];

    container.innerHTML = "";

    userPosts.forEach(post => {
      const div = document.createElement("div");
      div.className = "user-post";
      div.innerHTML = `
        <h3>${post.title || ''}</h3>
        <p>${post.description || ''}</p>
        <div class="post-actions">
          <button onclick="editPost('${post._id}')">Edit</button>
          <button onclick="deletePost('${post._id}')">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = "Hiba a posztok betöltésekor";
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

// ====================== INIT ======================
window.addEventListener("DOMContentLoaded", () => {
  // Theme betöltése
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
  updateIcon();

  // Navbar
  renderNavbar();

  // Profile
  loadProfile();

  // Canvas
  resizeCanvas();
  createStars();
  drawStars();

  window.addEventListener("resize", () => {
    resizeCanvas();
    createStars();
  });
});