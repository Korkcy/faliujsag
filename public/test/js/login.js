const API_BASE = "/api/v1";

// ====================== DARK MODE ======================
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

// ====================== PASSWORD TOGGLE ======================
function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

// ====================== API HELPER ======================
async function apiRequest(endpoint, method = "GET", data = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (data) {
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

// ====================== LOGIN ======================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("error");

  errorEl.textContent = "";

  if (!email || !password) {
    errorEl.textContent = "Kérlek töltsd ki mindkét mezőt!";
    return;
  }

  try {
    const response = await apiRequest("/auth/login", "POST", { email, password });

    // Token és felhasználó mentése
    if (response.token) {
      localStorage.setItem("token", response.token);
    }
    if (response.user) {
      localStorage.setItem("user", JSON.stringify(response.user));
    } else if (response.data?.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    // Sikeres bejelentkezés → átirányítás
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    errorEl.textContent = err.message || "Hibás email vagy jelszó.";
  }
}

// ====================== CSILLAGOK ANIMÁCIÓ ======================
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
  updateIcon();

  // Enter billentyűvel is lehessen bejelentkezni
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });

  // Canvas inicializálás
  resizeCanvas();
  createStars();
  drawStars();

  window.addEventListener("resize", () => {
    resizeCanvas();
    createStars();
  });
});