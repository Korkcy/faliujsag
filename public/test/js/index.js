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
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Hiba történt.");
  }

  return result;
}

let posts = [];
let currentSort = "newest";

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

async function loadPosts(searchTerm = "") {
  const container = document.getElementById("posts");
  container.innerHTML = "<p>Betöltés...</p>";

  try {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    if (currentSort) {
      params.append("sort", currentSort);
    }

    // később paginationhez jól fog jönni
    params.append("page", "1");
    params.append("limit", "10");

    const endpoint = `/posts?${params.toString()}`;
    console.log("Lekért endpoint:", endpoint);

    const response = await apiRequest(endpoint, "GET");
    posts = response.data.posts || [];

    container.innerHTML = "";

    if (posts.length === 0) {
      container.innerHTML = "<p>Nincsenek még posztok.</p>";
      return;
    }

    posts.forEach((post) => {
      const div = document.createElement("div");
      div.className = "post";

      div.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.description}</p>
        <div class="post-meta">
          <span>👤 ${getAuthorName(post)}</span>
          <span>📅 ${formatDate(post.createdAt)}</span>
          <span>💬 ${post.answersCount || 0} replies</span>
          <span>⭐ ${post.avgRating?.toFixed(1) || "N/A"}</span>
          <span>👍 ${post.helpfulCount || 0}</span>
        </div>
      `;

      div.onclick = () => openModal(post);
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Hiba történt a posztok betöltésekor: ${err.message}</p>`;
  }
}

async function openModal(post) {
  document.getElementById("modal-title").innerText = post.title;
  document.getElementById("modal-author").innerText = `by ${getAuthorName(post)}`;
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
    console.error(err);
    comments.innerHTML = `<p>Hiba történt a válaszok betöltésekor: ${err.message}</p>`;
  }

  document.getElementById("modal").style.display = "flex";
}

function renderAnswers(container, answers, level = 0) {
  answers.forEach((answer) => {
    const authorName =
      answer.author && typeof answer.author === "object"
        ? answer.author.username
        : "Ismeretlen felhasználó";

    const wrapper = document.createElement("div");
    wrapper.className = "answer-item";
    wrapper.style.marginLeft = `${level * 20}px`;
    wrapper.style.marginTop = "12px";

    wrapper.innerHTML = `
  <p><strong>${authorName}</strong> • ${formatDate(answer.createdAt)}</p>
  <p>${answer.text}</p>

  <div class="comment-actions">
    <button onclick="showReplyBox('${answer._id}')">Válasz</button>
  </div>

  <div id="reply-${answer._id}"></div>
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

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.documentElement.classList.add("dark");

    const darkToggle = document.getElementById("darkToggle");
    if (darkToggle) darkToggle.checked = true;
  }

  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        loadPosts(searchInput.value);
      }
    });
  }

  loadPosts();
});

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

  const searchInput = document.getElementById("searchInput");
  const currentSearch = searchInput ? searchInput.value : "";

  loadPosts(currentSearch);
}

function logout() {
  localStorage.removeItem("token");
  alert("Sikeres kijelentkezés.");
  location.reload();
}

//komment
let currentPostId = null;

async function openModal(post) {
  currentPostId = post._id; // EZ FONTOS

  document.getElementById("modal-title").innerText = post.title;
  document.getElementById("modal-author").innerText = `by ${getAuthorName(post)}`;
  document.getElementById("modal-desc").innerText = post.description;

  const comments = document.getElementById("modal-comments");
  comments.innerHTML = "<h4>Comments:</h4><p>Betöltés...</p>";

  try {
    const response = await apiRequest(`/posts/${post._id}/answers`, "GET");
    const answers = response.data.answers || [];

    comments.innerHTML = "<h4>Comments:</h4>";

    if (answers.length === 0) {
      comments.innerHTML += "<p>Még nincsenek válaszok.</p>";
    } else {
      renderAnswers(comments, answers, 0);
    }
  } catch (err) {
    comments.innerHTML = `<p>Hiba: ${err.message}</p>`;
  }

  document.getElementById("modal").style.display = "flex";
}

//uj komment
async function submitComment() {
  const text = document.getElementById("newCommentText").value.trim();
  if (!text) return;

  await apiRequest(`/posts/${currentPostId}/answers`, "POST", {
    text
  });

  document.getElementById("newCommentText").value = "";

  openModal({ _id: currentPostId }); // reload
}

//reply box
function showReplyBox(answerId) {
  const container = document.getElementById(`reply-${answerId}`);

  container.innerHTML = `
    <div class="comment-box">
      <textarea id="replyText-${answerId}" placeholder="Válasz..."></textarea>
      <button onclick="submitReply('${answerId}')">Küldés</button>
    </div>
  `;
}

//reply kuldes
async function submitReply(parentId) {
  const text = document.getElementById(`replyText-${parentId}`).value.trim();
  if (!text) return;

  await apiRequest(`/posts/${currentPostId}/answers`, "POST", {
    text,
    parentId
  });

  openModal({ _id: currentPostId }); // reload
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

//ratingek
ratings: [
  {
    user: ObjectId,
    helpful: Boolean,
    score: Number // 1-10
  }
]

let selectedHelpful = null;

function ratePost(isHelpful) {
  selectedHelpful = isHelpful;

  document.getElementById("ratingMessage").textContent =
    isHelpful ? "👍 Hasznosnak jelölted" : "👎 Nem hasznosnak jelölted";
}

//ertekeles kuldese
async function submitRating() {
  const score = parseInt(document.getElementById("ratingScore").value);

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

    loadPosts(); // frissíti a listát
  } catch (err) {
    document.getElementById("ratingMessage").textContent = err.message;
  }
}

//EGYSZERI ERTEKELES
const alreadyRated = post.ratings.find(r => r.user == userId);

if (alreadyRated) {
  throw new Error("Már értékelted ezt a posztot!");
}

//atlag szamitas
post.avgRating =
  post.ratings.reduce((sum, r) => sum + r.score, 0) /
  post.ratings.length;

post.helpfulCount = post.ratings.filter(r => r.helpful).length;