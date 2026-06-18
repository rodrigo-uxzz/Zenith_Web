import { apiRequest } from "./api.js";
import Echo from "https://esm.sh/laravel-echo@1.16.1";
import Pusher from "https://esm.sh/pusher-js@8.4.0";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = "http://127.0.0.1:8000";
const REVERB_HOST = "localhost";
const REVERB_PORT = 8080;

const token = localStorage.getItem("token");
const idUsuario = Number(localStorage.getItem("id_usuario"));

// ─── Echo ─────────────────────────────────────────────────────────────────────

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: "umtpyei4valoddezddtm",
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  wssPort: 443,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
  authEndpoint: `${API_URL}/api/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  },
});

// ─── Estado ───────────────────────────────────────────────────────────────────

let idChatAtivo = null;
let canalAtivo = null;

// ─── Elementos DOM ────────────────────────────────────────────────────────────

const listaConvEl = document.getElementById("conv-list");
const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input-mensagem");
const btnSend = document.getElementById("btn-send");
const headerNome = document.getElementById("header-nome");
const headerStatus = document.getElementById("header-status");
const headerAvatar = document.getElementById("header-avatar");
const inputPesqEl = document.getElementById("input-pesquisa");

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  carregarPacientes();
  configurarEnvio();
  configurarPesquisa();
  configurarLogout();
});

// ─── Lista de pacientes ───────────────────────────────────────────────────────

let todosPacientes = []; // guarda para filtrar na pesquisa

async function carregarPacientes() {
  const res = await apiRequest("/listarPacientes", "GET");
  if (!res.ok) return;

  todosPacientes = res.dados.pacientes;
  renderizarLista(todosPacientes);
}

function renderizarLista(pacientes) {
  listaConvEl.innerHTML = "";

  if (!pacientes.length) {
    listaConvEl.innerHTML = `<li style="padding:16px;color:#888;font-size:.82rem">Nenhum paciente encontrado.</li>`;
    return;
  }

  pacientes.forEach((user) => {
    const nome = user.nome ?? "Paciente";
    const inic = iniciais2(nome);
    const idPac = user.paciente?.id_paciente;

    const li = document.createElement("li");
    li.className = "conv-item";
    li.dataset.usuario = user.id_usuario;
    li.dataset.paciente = idPac;
    li.innerHTML = `
            <div class="avatar">${inic}</div>
            <div class="conv-info">
                <div class="conv-name">${nome}</div>
                <div class="conv-preview" id="preview-${idPac}">...</div>
            </div>
            <span class="conv-time" id="time-${idPac}"></span>
        `;
    li.addEventListener("click", () => abrirChat(idPac, nome, inic));
    listaConvEl.appendChild(li);
  });
}

// ─── Pesquisa ─────────────────────────────────────────────────────────────────

function configurarPesquisa() {
  inputPesqEl?.addEventListener("input", () => {
    const termo = inputPesqEl.value.toLowerCase().trim();
    const filtrados = todosPacientes.filter((u) =>
      u.nome?.toLowerCase().includes(termo),
    );
    renderizarLista(filtrados);
  });
}

// ─── Abrir chat ───────────────────────────────────────────────────────────────

async function abrirChat(idPaciente, nomePaciente, iniciais) {
  // Desconecta canal anterior
  if (canalAtivo && idChatAtivo) {
    echo.leave(`chat.${idChatAtivo}`);
    canalAtivo = null;
  }

  // Atualiza header
  headerNome.textContent = nomePaciente;
  headerAvatar.textContent = iniciais;
  headerStatus.textContent = "carregando...";

  // Destaca item na lista
  document
    .querySelectorAll(".conv-item")
    .forEach((el) =>
      el.classList.toggle("active", el.dataset.paciente == idPaciente),
    );

  // Busca o id_psicologo do usuário logado
  const resPerfil = await apiRequest("/perfil", "GET");
  const idPsicologo = resPerfil.dados?.psicologo?.id_psicologo;

  if (!idPsicologo) {
    headerStatus.textContent = "Erro ao carregar";
    return;
  }

  // Inicia ou recupera o chat
  const resChat = await apiRequest("/chat/iniciar", "POST", {
    id_paciente: idPaciente,
    id_psicologo: idPsicologo,
  });

  if (!resChat.ok) {
    headerStatus.textContent = "Erro ao abrir chat";
    return;
  }

  idChatAtivo = resChat.dados.chat.id_chat;

  // Carrega histórico e marca como lido
  await Promise.all([
    carregarHistorico(idChatAtivo),
    marcarComoLida(idChatAtivo),
  ]);

  // Conecta no canal
  conectarCanal(idChatAtivo, idPaciente);
}

// ─── Histórico ────────────────────────────────────────────────────────────────

async function carregarHistorico(idChat) {
  messagesEl.innerHTML = "";

  const res = await apiRequest(`/chat/historico/${idChat}`, "GET");
  if (!res.ok) return;

  const mensagens = res.dados;

  if (!mensagens.length) {
    messagesEl.innerHTML = `<p style="text-align:center;color:#888;margin-top:2rem;font-size:.82rem">Nenhuma mensagem ainda. Diga olá!</p>`;
    headerStatus.textContent = "Online";
    return;
  }

  let dataAtual = "";
  mensagens.forEach((msg) => {
    const dataMsg = formatarData(msg.data_envio);
    if (dataMsg !== dataAtual) {
      dataAtual = dataMsg;
      messagesEl.appendChild(criarDivider(dataMsg));
    }
    messagesEl.appendChild(criarBolha(msg));
  });

  // Atualiza preview da última mensagem na lista
  const ultima = mensagens[mensagens.length - 1];
  atualizarPreview(idChat, ultima.conteudo, ultima.data_envio);

  scrollBottom();
  headerStatus.textContent = "Online";
}

// ─── Canal Echo ───────────────────────────────────────────────────────────────

function conectarCanal(idChat, idPaciente) {
  canalAtivo = echo.private(`chat.${idChat}`);

  console.log("Canal conectado:", `chat.${idChat}`);

  canalAtivo.listen(".MensagemEnviada", (e) => {
    console.log("MensagemEnviada recebida:", e);
    if (document.querySelector(`[data-msg="${e.id_mensagem}"]`)) return;

    messagesEl.appendChild(criarBolha(e));
    scrollBottom();
    atualizarPreview(idChat, e.conteudo, e.data_envio);
    marcarComoLida(idChat);
  });

  canalAtivo.listen(".MensagemLida", (e) => {
    console.log("MensagemLida recebida:", e);
    if (e.id_usuario !== idUsuario) {
      document.querySelectorAll(".msg-row.sent .check-icon").forEach((el) => {
        el.classList.add("lida");
      });
      headerStatus.textContent = "Visto agora";
    }
  });   
}

// ─── Enviar ───────────────────────────────────────────────────────────────────

function configurarEnvio() {
  btnSend?.addEventListener("click", enviar);
  inputEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  });
}

async function enviar() {
  const conteudo = inputEl.value.trim();
  if (!conteudo || !idChatAtivo) return;
  inputEl.value = "";

  const msgTemp = {
    id_mensagem: Date.now(),
    id_remetente: idUsuario,
    conteudo,
    data_envio: new Date().toISOString(),
    status_mensagem: "enviada",
  };

  const bolha = criarBolha(msgTemp);
  messagesEl.appendChild(bolha);
  scrollBottom();

  const res = await apiRequest("/chat/enviar", "POST", {
    id_chat: idChatAtivo,
    conteudo,
  });

  if (res.ok) {
    const msgReal = res.dados.mensagem;
    bolha.dataset.msg = msgReal.id_mensagem;
    // Não chama atualizarPreview aqui por enquanto
  } else {
    console.log("erro ao enviar, removendo bolha");
    bolha.remove();
    alert("Erro ao enviar mensagem.");
  }
}

// ─── Marcar como lida ─────────────────────────────────────────────────────────

async function marcarComoLida(idChat) {
  await apiRequest(`/chat/visualizar/${idChat}`, "PATCH");
}

// ─── DOM builders ─────────────────────────────────────────────────────────────

function criarBolha(msg) {
  const sou = msg.id_remetente === idUsuario;
  const row = document.createElement("div");
  row.className = `msg-row ${sou ? "sent" : "recv"}`;
  row.dataset.msg = msg.id_mensagem;

  const checkHtml = sou
    ? `
        <svg class="check-icon ${msg.status_mensagem === "lida" ? "lida" : ""}"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
        </svg>`
    : "";

  row.innerHTML = `
        <div class="bubble">
            ${escapeHtml(msg.conteudo)}
            <div class="bubble-meta">
                <span class="bubble-time">${formatarHorario(msg.data_envio)}</span>
                ${checkHtml}
            </div>
        </div>
    `;
  return row;
}

function criarDivider(texto) {
  const div = document.createElement("div");
  div.className = "day-divider";
  div.textContent = texto;
  return div;
}

function atualizarPreview(idChat, conteudo, dataEnvio) {
  // Busca pelo item do paciente cujo chat corresponde
  const item = document.querySelector(`.conv-item.active`);
  if (!item) return;
  const idPac = item.dataset.paciente;
  const prev = document.getElementById(`preview-${idPac}`);
  const time = document.getElementById(`time-${idPac}`);
  if (prev)
    prev.textContent =
      conteudo.length > 35 ? conteudo.slice(0, 35) + "..." : conteudo;
  if (time) time.textContent = formatarHorario(dataEnvio);
  listaConvEl.prepend(item);
}

// ─── Logout ───────────────────────────────────────────────────────────────────

function configurarLogout() {
  const btnOpen = document.getElementById("open-Modal-logout");
  const modal = document.getElementById("modal-logout");
  const btnCancel = document.getElementById("btn-cancel-logout");
  const btnConfirm = document.getElementById("btn-confirm-logout");

  btnOpen?.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "flex";
  });
  btnCancel?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  btnConfirm?.addEventListener("click", async () => {
    await apiRequest("/logout", "POST");
    localStorage.clear();
    window.location.href = "loginScreen.html";
  });
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function iniciais2(nome) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatarHorario(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarData(iso) {
  const d = new Date(iso),
    hoje = new Date(),
    ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
