/* THEME */
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

window.addEventListener("DOMContentLoaded", updateIcon);

/* PASSWORD SHOW */
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

/* REGISTER (placeholder) */
function register() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  const error = document.getElementById("error");

  if (!username || !email || !password || !confirm) {
    error.textContent = "Minden mezőt tölts ki!";
    return;
  }

  if (password !== confirm) {
    error.textContent = "Passwords do not match";
    return;
  }

  error.textContent = "";

  alert("Registered (placeholder)");

  // TODO: backend API
}

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