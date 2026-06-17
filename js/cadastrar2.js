import { apiRequest } from "./api.js";

const fields = {
  username: document.getElementById("username"),
  email: document.getElementById("email"),
  senha: document.getElementById("senha"),
  confirmarSenha: document.getElementById("confirmarSenha"),
  formacao: document.getElementById("formacao"),
  termos: document.getElementById("termos"),
};

function setInputError(input, hasError) {
  if (!input) return;
  input.classList.toggle("input-error", hasError);
}

function setupPasswordToggle() {
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const targetId = button.getAttribute("data-target");
      const input = document.getElementById(targetId);

      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Ocultar" : "Mostrar";
    });
  });
}

function restoreFormValues() {
  const saved = {
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
    senha: localStorage.getItem("senha"),
    confirmarSenha: localStorage.getItem("confirmarSenha"),
    formacao: localStorage.getItem("formacao"),
    termos: localStorage.getItem("termos"),
    cadastroEpsi: localStorage.getItem("cadastroEpsi"),
  };

  if (saved.username && fields.username) fields.username.value = saved.username;
  if (saved.email && fields.email) fields.email.value = saved.email;
  if (saved.senha && fields.senha) fields.senha.value = saved.senha;
  if (saved.confirmarSenha && fields.confirmarSenha)
    fields.confirmarSenha.value = saved.confirmarSenha;
  if (saved.formacao && fields.formacao) fields.formacao.value = saved.formacao;
  if (saved.termos === "true" && fields.termos) fields.termos.checked = true;

  const radio = saved.cadastroEpsi;
  if (radio === "1") {
    const sim = document.getElementById("epsi-sim");
    if (sim) sim.checked = true;
  } else if (radio === "0") {
    const nao = document.getElementById("epsi-nao");
    if (nao) nao.checked = true;
  }
}

function setupButtonHandlers() {
  const botaoVoltar = document.getElementById("botaoVoltar");
  const criarContaBtn = document.getElementById("criarConta");

  if (botaoVoltar) {
    botaoVoltar.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      voltarTela1();
    });
  }

  if (criarContaBtn) {
    criarContaBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      criarConta();
    });
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function getErrorMessage(dados) {
  if (!dados) return "Erro ao cadastrar. Tente novamente.";
  if (typeof dados === "string") return dados;
  if (dados.message) return dados.message;
  if (dados.error) return dados.error;
  if (dados.detail) return dados.detail;
  if (dados.errors) {
    const mensagens = Object.values(dados.errors).flat();
    if (mensagens.length) return mensagens.join(" ");
  }
  return "Erro ao cadastrar. Tente novamente.";
}

function initCadastro2() {
  setupPasswordToggle();
  setupButtonHandlers();
  restoreFormValues();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCadastro2);
} else {
  initCadastro2();
}

// Função pra voltar pra tela 1
function voltarTela1() {
  window.location.href = "criarScreen.html";
}

// Função pra criar conta
async function criarConta() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const cadastroEpsi = document.querySelector(
    'input[name="cadastroEpsi"]:checked'
  );
  const formacao = document.getElementById("formacao").value;
  const termos = document.getElementById("termos").checked;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  setInputError(fields.username, !username);
  setInputError(fields.email, !email || !emailRegex.test(email));
  setInputError(fields.senha, !senha || senha.length < 6);
  setInputError(fields.confirmarSenha, !confirmarSenha || confirmarSenha !== senha);
  setInputError(fields.formacao, !formacao);

  if (!username) {
    showToast("Digite um nome de usuário.");
    return;
  }
  if (!email || !emailRegex.test(email)) {
    showToast("Digite um e-mail válido.");
    return;
  }
  if (!senha || senha.length < 6) {
    showToast("A senha deve ter pelo menos 6 caracteres.");
    return;
  }
  if (!confirmarSenha || confirmarSenha !== senha) {
    showToast("As senhas não conferem.");
    return;
  }
  if (!cadastroEpsi) {
    showToast("Selecione se possui cadastro no e-psi.");
    return;
  }
  if (!formacao) {
    showToast("Selecione seu grau de formação.");
    return;
  }
  if (!termos) {
    showToast("Aceite os termos para continuar.");
    return;
  }

  localStorage.setItem("username", username);
  localStorage.setItem("email", email);
  localStorage.setItem("senha", senha);
  localStorage.setItem("confirmarSenha", confirmarSenha);
  localStorage.setItem("cadastroEpsi", cadastroEpsi.value);
  localStorage.setItem("formacao", formacao);
  localStorage.setItem("termos", String(termos));

  // salvando no banco de dados
  // Criar FormData para enviar arquivo e dados
  const formData = new FormData();

  // Adicionar dados do formulário
  const nome = localStorage.getItem("nome") || "";
  const telefone = localStorage.getItem("telefone") || "";
  const dataNascimento = localStorage.getItem("data") || "";
  const genero = localStorage.getItem("genero") || "";
  const cpf = localStorage.getItem("cpf") || "";
  const crp = localStorage.getItem("crp") || "";
  const cadastroEpsiValue =
    localStorage.getItem("cadastroEpsi") === "1" ? 1 : 0;
  const formacaoValue = (localStorage.getItem("formacao") || "").toUpperCase();

  formData.append("nome", nome);
  formData.append("telefone", telefone);
  formData.append("data_nascimento", dataNascimento);
  formData.append("dataNascimento", dataNascimento);
  formData.append("genero", genero?.toUpperCase());
  formData.append("cpf", cpf);
  formData.append("crp", crp);
  formData.append("username", username);
  formData.append("nome_usuario", username);
  formData.append("email", email);
  formData.append("senha", senha);
  formData.append("confirmarSenha", confirmarSenha);
  formData.append("cadastroEpsi", cadastroEpsiValue);
  formData.append("cadastro_psi", cadastroEpsiValue);
  formData.append("formacao", formacaoValue);
  formData.append("formacaoProfissional", formacaoValue);
  formData.append("termos_aceitos", termos ? 1 : 0);
  formData.append("termosAceitos", termos ? 1 : 0);

  // Adicionar foto se existir
  const fotoBase64 = localStorage.getItem("foto");

  if (fotoBase64) {
    const blob = await fetch(fotoBase64).then((r) => r.blob());
    formData.append("foto", blob, "foto.png");
  }

  console.log(formData);

  const { ok, dados } = await apiRequest(
    "/registerPsicologo",
    "POST",
    formData,
  );

  console.log(dados);
  if (ok) {
    console.log(dados);

    showToast("Conta criada com sucesso! Enviando código de verificação...");

    localStorage.setItem("pendingVerifyEmail", email);

    setTimeout(() => {
      window.location.href = "loginScreen.html";
    }, 1500);
  } else {
    console.error(dados);
    showToast(getErrorMessage(dados));
  }
}
