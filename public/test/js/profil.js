/* DROPDOWN */
function toggleDropdown() {
  const d = document.getElementById("dropdown");
  d.style.display = d.style.display === "block" ? "none" : "block";
}

/* DARK MODE */
document.getElementById("darkToggle").addEventListener("change", () => {
  document.body.classList.toggle("dark");
});

const toggle = document.getElementById("darkToggle");

toggle.addEventListener("change", () => {
  if (toggle.checked) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark"); // mentés
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light"); // mentés
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("darkToggle").checked = true;
  }
});

  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }