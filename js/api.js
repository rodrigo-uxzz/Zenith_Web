const API_URL = "http://127.0.0.1:8000/api";

async function apiRequest(endPoint, method = "GET", dados = null) {
  const token = localStorage.getItem("token");

  const options = {
    method: method,
    headers: {
      "Content-Type": "application./json",
    },
  };

  if (token) {
    options.headers["Authorization"] = "Bearer" + token;
  }

  if (dados) {
    options.body = JSON.stringify(dados);
  }

  const response = await fetch(API_URL, endPoint, options);

  const result = response.json();

  return {
    ok: response.ok,
    dados: result,
  };
}
