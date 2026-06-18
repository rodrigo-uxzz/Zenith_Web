import { apiRequest } from "./api.js";

// ─── ELEMENTOS ───────────────────────────────────────────────────────────────

const verifyModal      = document.getElementById("modalVerificacao");
const verifyCodeInput  = document.getElementById("verification-code");
const confirmCodeBtn   = document.getElementById("confirm-code-btn");
const closeVerifyModal = document.getElementById("close-verify-modal");

const esqueciModal    = document.getElementById("modalEsqueciSenha");
const emailRecuperacao = document.getElementById("emailRecuperacao");
const btnEnviarRecup  = document.getElementById("btnEnviarRecuperacao");
const closeEsqueciModal = document.getElementById("close-esqueci-senha");

const novaSenhaModal     = document.getElementById("modalNovaSenha");
const closeNovaSenha     = document.getElementById("close-nova-senha");
const btnEnviarNovaSenha = document.getElementById("btnEnviarNovaSenha");

const senhaAtualModal    = document.getElementById("modalSenhaAtualizada");
const closeSenhaAtual    = document.getElementById("close-senha-atualizada");
const btnFecharSenhaAtual = document.getElementById("btnFecharSenhaAtualizada");

// pendingEmail agora é só para recuperação de senha
let pendingEmail  = "";
let recoveryCode  = "";

// ─── TOAST ───────────────────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ─── TOGGLE SENHA ─────────────────────────────────────────────────────────────

document.querySelectorAll(".toggle-senha").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = document.getElementById(icon.getAttribute("data-target"));
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    icon.name = isPassword ? "eye-off-outline" : "eye-outline";
  });
});

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.getAttribute("data-target"));
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "Ocultar" : "Mostrar";
  });
});

// ─── MODAL VERIFICAÇÃO (só recuperação de senha) ──────────────────────────────

function openVerifyModal(email) {
  pendingEmail = email;
  verifyCodeInput.value = "";
  verifyModal.style.display = "flex";
}

if (closeVerifyModal) {
  closeVerifyModal.onclick = () => (verifyModal.style.display = "none");
}

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

  if (ok) {
    recoveryCode = code;
    verifyModal.style.display = "none";
    novaSenhaModal.style.display = "flex";
  } else {
    showToast(dados?.message || "Código inválido.");
  }
}

if (confirmCodeBtn) confirmCodeBtn.addEventListener("click", confirmCode);

// ─── MODAL ESQUECI SENHA ──────────────────────────────────────────────────────

document.querySelector(".esqueci")?.addEventListener("click", (e) => {
  e.preventDefault();
  emailRecuperacao.value = "";
  esqueciModal.style.display = "flex";
});

if (closeEsqueciModal) {
  closeEsqueciModal.onclick = () => (esqueciModal.style.display = "none");
}

if (btnEnviarRecup) {
  btnEnviarRecup.addEventListener("click", async () => {
    const email = emailRecuperacao.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      showToast("Digite um e-mail válido.");
      return;
    }

    const { ok, dados } = await apiRequest("/forgotPassword", "POST", { email });

    if (ok) {
      esqueciModal.style.display = "none";
      openVerifyModal(email);
    } else {
      showToast(dados?.message || "E-mail não encontrado.");
    }
  });
}

// ─── MODAL NOVA SENHA ─────────────────────────────────────────────────────────

if (closeNovaSenha) {
  closeNovaSenha.onclick = () => (novaSenhaModal.style.display = "none");
}

if (btnEnviarNovaSenha) {
  btnEnviarNovaSenha.addEventListener("click", async () => {
    const nova      = document.getElementById("novaSenha").value;
    const confirmar = document.getElementById("confirmarSenha").value;

    if (!nova || nova.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (nova !== confirmar) {
      showToast("As senhas não conferem.");
      return;
    }

    const { ok, dados } = await apiRequest("/resetPassword", "POST", {
      email: pendingEmail,
      code: recoveryCode,
      senha: nova,
      confirmar_senha: confirmar,
    });

    if (ok) {
      novaSenhaModal.style.display = "none";
      senhaAtualModal.style.display = "flex";
    } else {
      showToast(dados?.message || "Erro ao atualizar a senha.");
    }
  });
}

// ─── MODAL SENHA ATUALIZADA ───────────────────────────────────────────────────

if (closeSenhaAtual) {
  closeSenhaAtual.onclick = () => (senhaAtualModal.style.display = "none");
}

if (btnFecharSenhaAtual) {
  btnFecharSenhaAtual.addEventListener("click", () => {
    senhaAtualModal.style.display = "none";
  });
}

// ─── FECHAR MODAIS CLICANDO FORA ─────────────────────────────────────────────

window.addEventListener("click", (e) => {
  if (e.target === verifyModal)    verifyModal.style.display    = "none";
  if (e.target === esqueciModal)   esqueciModal.style.display   = "none";
  if (e.target === novaSenhaModal) novaSenhaModal.style.display = "none";
  if (e.target === senhaAtualModal) senhaAtualModal.style.display = "none";
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email)    return showToast("Preencha o campo de E-mail ou CRP.");
  if (!password) return showToast("Preencha o campo de Senha.");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const crpRegex   = /^CRP-\d{2}\/\d{5}$/;

  if (email.includes("@") && !emailRegex.test(email)) {
    return showToast("Insira um e-mail válido.");
  }
  if (!email.includes("@") && !crpRegex.test(email.toUpperCase())) {
    return showToast("Insira um CRP válido no formato CRP-XX/XXXXX.");
  }
  if (password.length < 6) {
    return showToast("A senha deve ter pelo menos 6 caracteres.");
  }

  const { ok, dados } = await apiRequest("/login", "POST", {
    login: email,
    senha: password,
  });

  if (!ok) {
    if (dados?.error === "Aguarde a verificação da conta") {
      showToast("Sua conta está em análise pelo administrador, aguarde.");
    } else {
      // "Email não verificado" não deve mais ocorrer — o cadastro já resolve isso
      showToast("Login inválido: verifique suas credenciais.");
    }
    return;
  }

  if (!dados.user) return showToast("Erro inesperado na resposta do servidor.");
  if (dados.user.tipo_usuario !== "psicologo") {
    return showToast("Login inválido: apenas psicólogos podem acessar.");
  }

  const usuarioLogado = dados.user || {};
  const psicologoId =
    usuarioLogado.id_psicologo ||
    usuarioLogado.psicologo?.id_psicologo ||
    usuarioLogado.psicologo?.id ||
    usuarioLogado.id ||
    "";

  localStorage.setItem("id_usuario",     dados.user.id_usuario);
  localStorage.setItem("token",          dados.access_token);
  localStorage.setItem("usuarioLogado",  JSON.stringify(usuarioLogado));
  localStorage.setItem("psicologoId",    String(psicologoId));

  window.location.href = "homeScreen.html";
});