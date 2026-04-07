import { apiRequest } from "./api.js";

  // Função para mostrar modal
  function showModal(message) {
      document.getElementById('modal-message').textContent = message;
      document.getElementById('modal').style.display = 'block';
  }
  // Fechar modal
  document.querySelector('.close').onclick = function() {
      document.getElementById('modal').style.display = 'none';
  }
  window.onclick = function(event) {
      if (event.target == document.getElementById('modal')) {
          document.getElementById('modal').style.display = 'none';
      }
  }

//login
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

   if (email === '') {
       showModal('Por favor, preencha o campo de E-mail ou CRP');
       return;
   }
   
   if (password === '') {
       showModal('Por favor, preencha o campo de Senha');
       return;
   }
    const login = {
      login: email,
      senha: password,
    };
    console.log(login);

    const { ok, dados } = await apiRequest("/login", "POST", login);

    console.log(dados);

    if (dados.user.tipo_usuario !== "psicologo") {
      alert("login invalido");
    } else {
      if (ok) {
        localStorage.setItem("token", dados.access_token);

        window.location.href = "homeScreen.html";
      } else {
        if (result.error === "Aguarde verificação da conta") {
          alert("SUA CONTA ESTA EM ANÁLISE PELO ADMINISTRADOR, AGUARDE");
        } else {
          alert("LOGIN INVALIDO");
        }
      }
    }
    console.log(ok);
  });
