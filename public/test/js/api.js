const API_URL = 'http://localhost:3000/api/v1';

async function apiRequest(endpoint, method = 'GET', data) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(API_URL + endpoint, options);
  return res.json();
}