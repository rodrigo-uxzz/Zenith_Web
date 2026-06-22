const API_URL = "http://127.0.0.1:8000/api";

export async function apiRequest(endPoint, method = "GET", dados = null) {
  const token = localStorage.getItem("token");

  const options = {
    method: method,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      Accept: "application/json",
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
  const contentType = response.headers.get("content-type") || "";
  const isJson =
    contentType.includes("application/json") || contentType.includes("+json");

  let result;

  if (!text) {
    result = { error: "Resposta vazia do servidor" };
  } else if (isJson) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { error: "Resposta inválida do servidor", raw: text };
    }
  } else {
    result = { error: "Resposta inválida do servidor", raw: text };
  }

  const payloadOk =
    result && typeof result === "object" && "ok" in result ? result.ok : true;
  const payloadSuccess =
    result && typeof result === "object" && "success" in result
      ? result.success
      : true;
  const payloadHasError =
    Boolean(result?.error) || result?.success === false || result?.ok === false;

  return {
    ok:
      response.ok &&
      payloadOk !== false &&
      payloadSuccess !== false &&
      !payloadHasError,
    status: response.status,
    dados: result,
  };
}
