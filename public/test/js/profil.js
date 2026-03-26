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


let userPosts = [];

async function loadProfile() {
    try {
        const res = await apiRequest("/users/me");
        const user = res.data.user;

        document.getElementById("email").value = user.email || "";
        document.getElementById("username").value = user.username || "";
        document.getElementById("school").value = user.school || "";

        loadUserPosts();
    } catch (err) {
        console.error(err);
    }
}

function togglePassword() {
    const input = document.getElementById("password");

    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

async function saveProfile() {
    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const school = document.getElementById("school").value;

    try {
        await apiRequest("/users/me", "PATCH", {
            email,
            username,
            password,
            school
        });

        alert("Profile updated!");
    } catch (err) {
        alert(err.message);
    }
}

/* PROFILE IMAGE */
document.getElementById("imageUpload").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("profileImage").src = e.target.result;
    };
    reader.readAsDataURL(file);
});

/* USER POSTS */

async function loadUserPosts() {
    const container = document.getElementById("userPosts");
    container.innerHTML = "Loading...";

    try {
        const res = await apiRequest("/posts/me");
        userPosts = res.data.posts;

        container.innerHTML = "";

        userPosts.forEach(post => {
            const div = document.createElement("div");
            div.className = "user-post";

            div.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.description}</p>

                <div class="post-actions">
                    <button onclick="editPost('${post._id}')">Edit</button>
                    <button onclick="deletePost('${post._id}')">Delete</button>
                </div>
            `;

            container.appendChild(div);
        });

    } catch (err) {
        container.innerHTML = "Error loading posts";
    }
}

async function deletePost(id) {
    if (!confirm("Delete this post?")) return;

    try {
        await apiRequest(`/posts/${id}`, "DELETE");
        loadUserPosts();
    } catch (err) {
        alert(err.message);
    }
}

function editPost(id) {
    const post = userPosts.find(p => p._id === id);

    const title = prompt("Edit title:", post.title);
    const description = prompt("Edit description:", post.description);

    if (!title) return;

    updatePost(id, title, description);
}

async function updatePost(id, title, description) {
    try {
        await apiRequest(`/posts/${id}`, "PATCH", {
            title,
            description
        });

        loadUserPosts();
    } catch (err) {
        alert(err.message);
    }
}

window.addEventListener("DOMContentLoaded", loadProfile);