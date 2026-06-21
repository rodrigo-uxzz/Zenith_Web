import { apiRequest } from "./api.js";

// ─── CAMPOS ──────────────────────────────────────────────────────────────────

const fields = {
  username: document.getElementById("username"),
  email: document.getElementById("email"),
  senha: document.getElementById("senha"),
  confirmarSenha: document.getElementById("confirmarSenha"),
  formacao: document.getElementById("formacao"),
  termos: document.getElementById("termos"),
};

// ─── MODAL DE VERIFICAÇÃO ─────────────────────────────────────────────────────

const verifyModal    = document.getElementById("modalVerificacao");
const verifyCodeInput = document.getElementById("verification-code");
const confirmCodeBtn  = document.getElementById("confirm-code-btn");
const closeVerifyModal = document.getElementById("close-verify-modal");

function openVerifyModal() {
  verifyCodeInput.value = "";
  verifyModal.style.display = "flex";
}

if (closeVerifyModal) {
  closeVerifyModal.onclick = () => (verifyModal.style.display = "none");
}

window.addEventListener("click", (e) => {
  if (e.target === verifyModal) verifyModal.style.display = "none";
});

// ─── TOAST ───────────────────────────────────────────────────────────────────

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  if (!toast || !toastMessage) return;
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ─── TOGGLE SENHA ─────────────────────────────────────────────────────────────

function setupPasswordToggle() {
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const input = document.getElementById(button.getAttribute("data-target"));
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Ocultar" : "Mostrar";
    });
  });
}

// ─── RESTAURAR VALORES ────────────────────────────────────────────────────────

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
  if (saved.confirmarSenha && fields.confirmarSenha) fields.confirmarSenha.value = saved.confirmarSenha;
  if (saved.formacao && fields.formacao) fields.formacao.value = saved.formacao;
  if (saved.termos === "true" && fields.termos) fields.termos.checked = true;
  if (saved.cadastroEpsi === "1") {
    const sim = document.getElementById("epsi-sim");
    if (sim) sim.checked = true;
  } else if (saved.cadastroEpsi === "0") {
    const nao = document.getElementById("epsi-nao");
    if (nao) nao.checked = true;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function setInputError(input, hasError) {
  if (!input) return;
  input.classList.toggle("input-error", hasError);
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

function setLoading(botao, carregando) {
    if (!botao) return;
    if (carregando) {
        botao.disabled = true;
        botao.dataset.textoOriginal = botao.innerHTML;
        botao.innerHTML = `<span class="spinner"></span>`;
    } else {
        botao.disabled = false;
        botao.innerHTML = botao.dataset.textoOriginal || botao.innerHTML;
    }
}

// ─── PASSO 1: VALIDAR E ENVIAR E-MAIL ────────────────────────────────────────
// Chamado ao clicar em "Criar conta". Não cria a conta ainda —
// apenas valida os campos e dispara o código de verificação.

async function criarConta() {
  const username       = document.getElementById("username").value.trim();
  const email          = document.getElementById("email").value.trim();
  const senha          = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const cadastroEpsi   = document.querySelector('input[name="cadastroEpsi"]:checked');
  const formacao       = document.getElementById("formacao").value;
  const termos         = document.getElementById("termos").checked;
  const emailRegex     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Marca erros visuais
  setInputError(fields.username, !username);
  setInputError(fields.email, !email || !emailRegex.test(email));
  setInputError(fields.senha, !senha || senha.length < 6);
  setInputError(fields.confirmarSenha, !confirmarSenha || confirmarSenha !== senha);
  setInputError(fields.formacao, !formacao);

  if (!username) return showToast("Digite um nome de usuário.");
  if (!email || !emailRegex.test(email)) return showToast("Digite um e-mail válido.");
  if (!senha || senha.length < 6) return showToast("A senha deve ter pelo menos 6 caracteres.");
  if (!confirmarSenha || confirmarSenha !== senha) return showToast("As senhas não conferem.");
  if (!cadastroEpsi) return showToast("Selecione se possui cadastro no e-psi.");
  if (!formacao) return showToast("Selecione seu grau de formação.");
  if (!termos) return showToast("Aceite os termos para continuar.");

  // Salva no localStorage para usar no passo 2
  localStorage.setItem("username", username);
  localStorage.setItem("email", email);
  localStorage.setItem("senha", senha);
  localStorage.setItem("confirmarSenha", confirmarSenha);
  localStorage.setItem("cadastroEpsi", cadastroEpsi.value);
  localStorage.setItem("formacao", formacao);
  localStorage.setItem("termos", String(termos));

  // Dispara o envio do código de verificação
  const criarContaBtn = document.getElementById("criarConta");
  setLoading(criarContaBtn, true);

  const { ok, dados } = await apiRequest("/sendVerificationEmail", "POST", { email });

  setLoading(criarContaBtn, false);

  if (!ok) {
    showToast(dados?.message || "Erro ao enviar o código. Tente novamente.");
    return;
  }

  showToast("Código enviado para o seu e-mail!");
  openVerifyModal();
}

// ─── PASSO 2: CONFIRMAR CÓDIGO E CRIAR CONTA ─────────────────────────────────
// Só aqui a conta é de fato criada, enviando o código junto com os dados.

async function confirmarCodigo() {
  const code = verifyCodeInput.value.trim();
  if (!code) {
    showToast("Digite o código recebido.");
    return;
  }

  const nome           = localStorage.getItem("nome")     || "";
  const telefone       = localStorage.getItem("telefone") || "";
  const dataNascimento = localStorage.getItem("data")     || "";
  const genero         = localStorage.getItem("genero")   || "";
  const cpf            = localStorage.getItem("cpf")      || "";
  const crp            = localStorage.getItem("crp")      || "";
  const username       = localStorage.getItem("username") || "";
  const email          = localStorage.getItem("email")    || "";
  const senha          = localStorage.getItem("senha")    || "";
  const confirmarSenha = localStorage.getItem("confirmarSenha") || "";
  const cadastroEpsi   = localStorage.getItem("cadastroEpsi") === "1" ? 1 : 0;
  const formacao       = (localStorage.getItem("formacao") || "").toUpperCase();
  const termos         = localStorage.getItem("termos") === "true";

  const formData = new FormData();
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
  formData.append("cadastroEpsi", cadastroEpsi);
  formData.append("cadastro_psi", cadastroEpsi);
  formData.append("formacao", formacao);
  formData.append("formacaoProfissional", formacao);
  formData.append("termos_aceitos", termos ? 1 : 0);
  formData.append("termosAceitos", termos ? 1 : 0);
  formData.append("code", code);

  const fotoBase64 = localStorage.getItem("foto");
  if (fotoBase64) {
    const blob = await fetch(fotoBase64).then((r) => r.blob());
    formData.append("foto", blob, "foto.png");
  }

  setLoading(confirmCodeBtn, true);

  const { ok, dados } = await apiRequest("/registerPsicologo", "POST", formData);

  setLoading(confirmCodeBtn, false);

  if (ok) {
    verifyModal.style.display = "none";
    showToast("Conta criada com sucesso! Aguarde a análise do administrador.");
    ["nome","telefone","data","genero","cpf","crp","username","email",
     "senha","confirmarSenha","cadastroEpsi","formacao","termos","foto"]
      .forEach((k) => localStorage.removeItem(k));
    setTimeout(() => { window.location.href = "loginScreen.html"; }, 1500);
  } else {
    showToast(getErrorMessage(dados));
  }
}

// ─── BOTÃO CONFIRMAR CÓDIGO ───────────────────────────────────────────────────

if (confirmCodeBtn) confirmCodeBtn.addEventListener("click", confirmarCodigo);

// ─── BOTÕES VOLTAR / CRIAR CONTA ─────────────────────────────────────────────

function setupButtonHandlers() {
  const botaoVoltar  = document.getElementById("botaoVoltar");
  const criarContaBtn = document.getElementById("criarConta");
  if (botaoVoltar) {
    botaoVoltar.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "criarScreen.html";
    });
  }
  if (criarContaBtn) {
    criarContaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      criarConta();
    });
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
  setupPasswordToggle();
  setupButtonHandlers();
  restoreFormValues();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}