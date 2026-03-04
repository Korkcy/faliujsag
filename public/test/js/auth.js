async function register() {
  const data = {
    username: username.value,
    email: email.value,
    password: password.value
  };

  const res = await apiRequest('/auth/register', 'POST', data);
  alert(JSON.stringify(res));
}

async function login() {
  const res = await apiRequest('/auth/login', 'POST', {
    email: email.value,
    password: password.value
  });

  alert(JSON.stringify(res));
}