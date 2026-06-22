import { apiRequest } from "./api.js";

// ───── HELPER DE LOADING ─────────────────────────────────────────────────────

function setLoading(botao, carregando, spinnerDark = false) {
  if (!botao) return;

  if (carregando) {
    botao.disabled = true;
    botao.dataset.textoOriginal = botao.innerHTML;
    botao.innerHTML = `<span class="spinner${spinnerDark ? " spinner-dark" : ""}"></span>`;
  } else {
    botao.disabled = false;
    botao.innerHTML = botao.dataset.textoOriginal || botao.innerHTML;
  }
}

// ─── ELEMENTOS ───────────────────────────────────────────────────────────────

const verifyModal = document.getElementById("modalVerificacao");
const verifyCodeInput = document.getElementById("verification-code");
const confirmCodeBtn = document.getElementById("confirm-code-btn");
const closeVerifyModal = document.getElementById("close-verify-modal");

const esqueciModal = document.getElementById("modalEsqueciSenha");
const emailRecuperacao = document.getElementById("emailRecuperacao");
const btnEnviarRecup = document.getElementById("btnEnviarRecuperacao");
const closeEsqueciModal = document.getElementById("close-esqueci-senha");

const novaSenhaModal = document.getElementById("modalNovaSenha");
const closeNovaSenha = document.getElementById("close-nova-senha");
const btnEnviarNovaSenha = document.getElementById("btnEnviarNovaSenha");

const senhaAtualModal = document.getElementById("modalSenhaAtualizada");
const closeSenhaAtual = document.getElementById("close-senha-atualizada");
const btnFecharSenhaAtual = document.getElementById("btnFecharSenhaAtualizada");

let pendingEmail = "";
let recoveryCode = "";

// ─── TOAST ───────────────────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ─── TOGGLE SENHA ─────────────────────────────────────────────────────────────

document.querySelectorAll(".toggle-senha").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = document.getElementById(icon.dataset.target);

    if (!input) return;

    const mostrar = input.type === "password";

    input.type = mostrar ? "text" : "password";
    icon.name = mostrar ? "eye-off-outline" : "eye-outline";
  });
});

document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);

    if (!input) return;

    const mostrar = input.type === "password";

    input.type = mostrar ? "text" : "password";
    btn.textContent = mostrar ? "Ocultar" : "Mostrar";
  });
});

// ─── MODAL VERIFICAÇÃO ────────────────────────────────────────────────────────

function openVerifyModal(email) {
  pendingEmail = email;
  verifyCodeInput.value = "";
  verifyModal.style.display = "flex";
}

closeVerifyModal?.addEventListener("click", () => {
  verifyModal.style.display = "none";
});

async function confirmCode() {
  const code = verifyCodeInput.value.trim();

  if (!code) {
    showToast("Digite o código recebido.");
    return;
  }

  const { ok, dados } = await apiRequest("/verifyResetCode", "POST", {
    email: pendingEmail,
    code,
  });

  if (!ok) {
    showToast(dados?.message || "Código inválido.");
    return;
  }

  recoveryCode = code;

  verifyModal.style.display = "none";
  novaSenhaModal.style.display = "flex";
}

confirmCodeBtn?.addEventListener("click", confirmCode);

// ─── ESQUECI SENHA ────────────────────────────────────────────────────────────

document.querySelector(".esqueci")?.addEventListener("click", (e) => {
  e.preventDefault();

  emailRecuperacao.value = "";

  esqueciModal.style.display = "flex";
});

closeEsqueciModal?.addEventListener("click", () => {
  esqueciModal.style.display = "none";
});

btnEnviarRecup?.addEventListener("click", async () => {
  const email = emailRecuperacao.value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    showToast("Digite um e-mail válido.");
    return;
  }

  setLoading(btnEnviarRecup, true, true);

  const { ok, dados } = await apiRequest("/forgotPassword", "POST", {
    email,
  });

  setLoading(btnEnviarRecup, false, true);

  if (!ok) {
    showToast(dados?.message || "E-mail não encontrado.");
    return;
  }

  pendingEmail = email;

  esqueciModal.style.display = "none";

  openVerifyModal(email);
});

// ─── NOVA SENHA ───────────────────────────────────────────────────────────────

closeNovaSenha?.addEventListener("click", () => {
  novaSenhaModal.style.display = "none";
});

btnEnviarNovaSenha?.addEventListener("click", async () => {
  const nova = document.getElementById("novaSenha").value;
  const confirmar = document.getElementById("confirmarSenha").value;

  if (nova.length < 6) {
    showToast("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (nova !== confirmar) {
    showToast("As senhas não conferem.");
    return;
  }

  setLoading(btnEnviarNovaSenha, true, true);

  const { ok, dados } = await apiRequest("/resetPassword", "POST", {
    email: pendingEmail,
    password: nova,
  });

  setLoading(btnEnviarNovaSenha, false, true);

  if (!ok) {
    showToast(dados?.message || "Erro ao atualizar a senha.");
    return;
  }

  novaSenhaModal.style.display = "none";
  senhaAtualModal.style.display = "flex";
});

// ─── SENHA ATUALIZADA ─────────────────────────────────────────────────────────

closeSenhaAtual?.addEventListener("click", () => {
  senhaAtualModal.style.display = "none";
});

btnFecharSenhaAtual?.addEventListener("click", () => {
  senhaAtualModal.style.display = "none";
});

// ─── FECHAR MODAIS ────────────────────────────────────────────────────────────

window.addEventListener("click", (e) => {
  if (e.target === verifyModal) verifyModal.style.display = "none";
  if (e.target === esqueciModal) esqueciModal.style.display = "none";
  if (e.target === novaSenhaModal) novaSenhaModal.style.display = "none";
  if (e.target === senhaAtualModal) senhaAtualModal.style.display = "none";
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email) {
    showToast("Preencha o campo de E-mail ou CRP.");
    return;
  }

  if (!password) {
    showToast("Preencha o campo de Senha.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const crpRegex = /^CRP-\d{2}\/\d{5}$/;

  if (email.includes("@") && !emailRegex.test(email)) {
    showToast("Insira um e-mail válido.");
    return;
  }

  if (!email.includes("@") && !crpRegex.test(email.toUpperCase())) {
    showToast("Insira um CRP válido no formato CRP-XX/XXXXX.");
    return;
  }

  if (password.length < 6) {
    showToast("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  const btnEntrar = document.querySelector(".botaoE");

  setLoading(btnEntrar, true);

  const { ok, dados } = await apiRequest("/login", "POST", {
    login: email,
    senha: password,
  });

  setLoading(btnEntrar, false);

  if (!ok) {
    if (dados?.error === "Aguarde a verificação da conta") {
      showToast("Sua conta está em análise pelo administrador, aguarde.");
    } else if (dados?.error === "Email não verificado") {
      openVerifyModal(email);
    } else {
      showToast("Login inválido: verifique suas credenciais.");
    }

    return;
  }

  if (!dados.user) {
    showToast("Erro inesperado na resposta do servidor.");
    return;
  }

  if (dados.user.tipo_usuario !== "psicologo") {
    showToast("Login inválido: apenas psicólogos podem acessar.");
    return;
  }

  const usuarioLogado = dados.user;

  const psicologoId =
    usuarioLogado.id_psicologo ||
    usuarioLogado.psicologo?.id_psicologo ||
    usuarioLogado.psicologo?.id ||
    usuarioLogado.id ||
    "";

  localStorage.setItem("id_usuario", usuarioLogado.id_usuario);
  localStorage.setItem("token", dados.access_token);
  localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
  localStorage.setItem("psicologoId", String(psicologoId));

  window.location.href = "homeScreen.html";
});