const posts = [
    {
        title: "First post",
        author: "User1",
        desc: "Ez egy teszt poszt",
        comments: ["Nice!", "Cool"]
    },
    {
        title: "Second post",
        author: "User2",
        desc: "Another post",
        comments: ["Wow", "Amazing"]
    }
];

function loadPosts() {
    const container = document.getElementById("posts");
    container.innerHTML = "";

    posts.forEach((p, i) => {
        const div = document.createElement("div");
        div.className = "post";
        div.innerHTML = `
  <h3>${p.title}</h3>
  <p>${p.desc}</p>
  <div class="post-meta">
    <span>👤 ${p.author}</span>
    <span>📅 2026</span>
    <span>💬 ${p.comments.length} replies</span>
  </div>
`;
        div.onclick = () => openModal(i);
        container.appendChild(div);
    });
}

function openModal(i) {
    const p = posts[i];

    document.getElementById("modal-title").innerText = p.title;
    document.getElementById("modal-author").innerText = "by " + p.author;
    document.getElementById("modal-desc").innerText = p.desc;

    const comments = document.getElementById("modal-comments");
    comments.innerHTML = "<h4>Comments:</h4>";
    p.comments.forEach(c => {
        comments.innerHTML += `<p>- ${c}</p>`;
    });

    document.getElementById("modal").style.display = "flex";
}

function closeModal(e) {
    if (e.target.id === "modal") {
        document.getElementById("modal").style.display = "none";
    }
}

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

//modal

// Create Modal megnyitása
function openCreateModal() {
    document.getElementById('createModal').style.display = 'flex';
    document.getElementById('postTitle').focus();
}

// Create Modal bezárása
function closeCreateModal(event) {
    const modal = document.getElementById('createModal');
    
    // Ha a háttérre kattintottunk vagy a Back gombra
    if (!event || event.target === modal) {
        modal.style.display = 'none';
        
        // űrlap törlése
        document.getElementById('postTitle').value = '';
        document.getElementById('postDescription').value = '';
        document.getElementById('createError').textContent = '';
    }
}

// Új poszt létrehozása (itt majd a saját logikádat írd bele)
function createPost() {
    const title = document.getElementById('postTitle').value.trim();
    const desc = document.getElementById('postDescription').value.trim();
    const errorEl = document.getElementById('createError');

    if (!title) {
        errorEl.textContent = "A cím megadása kötelező!";
        return;
    }

    // Itt később majd elküldöd a szervernek...
    console.log("Új kérdés:", { title, desc });

    alert("Kérdés sikeresen létrehozva! (később szerveres rész jön)");
    
    closeCreateModal();
}

loadPosts();

