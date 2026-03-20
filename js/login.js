import { apiRequest } from "./api.js";

//login
document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === "") {
      alert("Por favor, preencha o campo de E-mail ou CRP");
      return;
    }

    if (password === "") {
      alert("Por favor, preencha o campo de Senha");
      return;
    }

    const login = {
      login: email,
      senha: password,
    };
    console.log(login);

    const {ok,dados} = await apiRequest("/login", "POST", login);

    console.log(dados);

    if (ok) {
      localStorage.setItem("token", dados.access_token);

      // Se passou nas validações, redireciona
      window.location.href = "homeScreen.html";
    } else {
      if (result.error === "Aguarde verificação da conta") {
        alert("SUA CONTA ESTA EM ANÁLISE PELO ADMINISTRADOR, AGUARDE");
      } else {
        alert("LOGIN INVALIDO");
      }
    }
  });
