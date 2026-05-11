import { apiRequest } from "./api.js";

// Função para mostrar modal
function showModal(message) {
  document.getElementById("modal-message").textContent = message;
  document.getElementById("modal").style.display = "block";
  // Fechar automaticamente em 3 segundos
  setTimeout(() => {
    document.getElementById("modal").style.display = "none";
  }, 3000);
}
// Fechar modal
document.querySelector(".close").onclick = function () {
  document.getElementById("modal").style.display = "none";
};
window.onclick = function (event) {
  if (event.target == document.getElementById("modal")) {
    document.getElementById("modal").style.display = "none";
  }
};

// Função para mostrar toast de alerta
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

//login
document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    // Validação: campo vazio
    if (email === "") {
      showModal("Por favor, preencha o campo de E-mail");
      return;
    }

    if (password === "") {
      showModal("Por favor, preencha o campo de Senha");
      return;
    }

    // Validação: formato de email se parecer com email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    // Validação: senha com mínimo de 6 caracteres
    if (password.length < 6) {
      showModal("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    const login = {
      login: email,
      senha: password,
    };
    console.log(login);

    const { ok, dados } = await apiRequest("/loginAdmin", "POST", login);

    console.log(dados);

    // PRIMEIRO: trata erro
    if (!ok) {
      showModal("Login inválido: verifique suas credenciais");
      return;
    }

    if (!dados.user) {
      showModal("Erro inesperado na resposta do servidor");
      return;
    }

    if (dados.user.tipo_usuario !== "admin") {
      showModal("Acesso negado!");
      return;
    }

    localStorage.setItem("token", dados.access_token);
    window.location.href = "./../pages/adminHome.html";
    console.log(ok);
  });
