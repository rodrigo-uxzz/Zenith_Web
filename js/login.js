import { apiRequest } from "./api.js";

  // Função para mostrar modal
  function showModal(message) {
      document.getElementById('modal-message').textContent = message;
      document.getElementById('modal').style.display = 'block';
      // Fechar automaticamente em 3 segundos
      setTimeout(() => {
          document.getElementById('modal').style.display = 'none';
      }, 3000);
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

  // Função para mostrar toast de alerta
  function showToast(message) {
      const toast = document.getElementById('toast');
      const toastMessage = document.getElementById('toast-message');
      toastMessage.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
          toast.classList.remove('show');
      }, 3000);
  }

//login
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validação: campo vazio
    if (email === '') {
        showModal('Por favor, preencha o campo de E-mail ou CRP');
        return;
    }
    
    if (password === '') {
        showModal('Por favor, preencha o campo de Senha');
        return;
    }

    // Validação: formato de email se parecer com email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const crpRegex = /^CRP-\d{2}\/\d{5}$/; // Exemplo: CRP-01/12345

    if (email.includes('@')) {
        // Se tem @, validar como email
        if (!emailRegex.test(email)) {
            showModal('Por favor, insira um e-mail válido');
            return;
        }
    } else {
        // Se não tem @, validar como CRP
        if (!crpRegex.test(email.toUpperCase())) {
            showModal('Por favor, insira um CRP válido no formato CRP-XX/XXXXX');
            return;
        }
    }

    // Validação: senha com mínimo de 6 caracteres
    if (password.length < 6) {
        showModal('A senha deve ter pelo menos 6 caracteres');
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
      showModal("Login inválido: apenas psicólogos podem acessar");
    } else {
      if (ok) {
        localStorage.setItem("token", dados.access_token);
        window.location.href = "homeScreen.html";
      } else {
        if (dados.error === "Aguarde verificação da conta") {
          showModal("Sua conta está em análise pelo administrador, aguarde");
        } else {
          showModal("Login inválido: verifique suas credenciais");
        }
      }
    }
    console.log(ok);
  });
