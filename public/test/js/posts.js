async function createPost() {
  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  if (!title || !description) {
    alert('Minden mezőt ki kell tölteni!');
    return;
  }

  const postData = {
    title,
    description,
    author: "65a1f8e9c2f9b4e9d2a12345" // létező User ObjectId
  };

  try {
    const response = await apiRequest('/posts', 'POST', postData);
    console.log(response);
    alert('Poszt sikeresen létrehozva!');
    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
  } catch (err) {
    console.error(err);
    alert('Hiba történt a poszt létrehozásakor: ' + err.message);
  }
  await loadPosts();
}

async function loadPosts() {
  console.log('loadPosts clicked');

  const postsDiv = document.getElementById('posts');

  try {
    const response = await apiRequest('/posts', 'GET');
    console.log(response);

    postsDiv.innerHTML = ''; // törli a korábbi listát

    if (!response.data || response.data.posts.length === 0) {
      postsDiv.innerHTML = '<p>Nincsenek még posztok.</p>';
      return;
    }

    // posztok kirajzolása
    response.data.posts.forEach(p => {
      const div = document.createElement('div');
      div.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <p>Hasznosság: ${p.ratingsAverage || 0} | Válaszok: ${p.answersCount} | Megtekintve: ${p.viewsCount}</p>
        <hr>
      `;
      postsDiv.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    postsDiv.innerHTML = '<p>Hiba történt a posztok betöltésekor.</p>';
  }
}