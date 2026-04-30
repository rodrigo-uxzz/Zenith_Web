const API_URL = "http://127.0.0.1:8000/api";

export async function apiRequest(endPoint, method = "GET", dados = null) {
  const token = localStorage.getItem("token");

  const options = {
    method: method,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  };

  if (token) {
    options.headers["Authorization"] = "Bearer " + token;
  }

  if (dados instanceof FormData) {
    options.body = dados;
  } else if (dados) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(dados);
  }

  const response = await fetch(API_URL + endPoint, options);

  const text = await response.text();

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    console.error("Resposta não é JSON:", text);
    result = { error: "Resposta inválida do servidor", raw: text };
  }

  return {
    ok: response.ok,
    dados: result,
  };
}
