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

/* PASSWORD SHOW */
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

//regisztracio
async function register() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const school = document.getElementById("school").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  const error = document.getElementById("error");

  if (!username || !email || !school || !password || !confirm) {
    error.textContent = "Töltsd ki mindegyik mezőt!";
    return;
  }

  if (password !== confirm) {
    error.textContent = "A jelszavak nem egyeznek!";
    return;
  }

  error.textContent = "";

  try {
    const response = await apiRequest("/auth/signup", "POST", {
      username,
      email,
      school,
      password,
      passwordConfirm: confirm
    });

    // token mentése
    if (response.token) {
      localStorage.setItem("token", response.token);
    }

    // user adatok mentése opcionálisan
    if (response.data && response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    // siker után főoldal
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    error.textContent = err.message;
  }
}

//CSILLAGOK
const canvas = document.getElementById("stars");
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

  stars.forEach(s => {
    ctx.beginPath();
    ctx.fillStyle = isDark
      ? "rgba(255,255,255,0.6)"
      : "rgb(74 144 226)";
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


//DARKMODE
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");

  updateIcon();
}

function updateIcon() {
  const icon = document.getElementById("icon");
  const isDark = document.documentElement.classList.contains("dark");

  icon.textContent = isDark ? "🌙" : "☀️";
}

window.addEventListener("DOMContentLoaded", () => {
  updateIcon();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      register();
    }
  });
});