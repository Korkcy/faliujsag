async function loadPost() {
  const p = await apiRequest(`/posts/${postId.value}`);

  post.innerHTML = `
    <h3>${p.title}</h3>
    <p>${p.description}</p>
  `;
}