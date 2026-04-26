import { apiRequest } from "./api.js";

// Variável para armazenar todas as sessões
let todasSessoes = [];
let filtroAtual = "todas";
let buscaPaciente = "";
let filtroData = "";

// Modal de logout
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");

  if (openModalBtn) {
    openModalBtn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.style.display = "flex";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async function () {
      try {
        const { ok, dados } = await apiRequest("/logout", "POST");
        if (!ok) {
          console.warn("Erro ao deslogar da API", dados);
        }
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
      localStorage.removeItem("token");
      window.location.href = "./../pages/loginScreen.html";
    });
  }

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Configurar filtros
  configurarFiltros();
  
  // Configurar listeners de busca
  configurarBusca();
  
  // Carregar histórico de sessões
  carregarHistoricoSessoes();
});

function configurarBusca() {
  const inputBuscar = document.getElementById("buscarPaciente");
  const inputData = document.getElementById("filtrarData");
  
  if (inputBuscar) {
    inputBuscar.addEventListener("input", function() {
      buscaPaciente = this.value.toLowerCase();
      filtrarSessoes();
    });
  }
  
  if (inputData) {
    inputData.addEventListener("change", function() {
      filtroData = this.value;
      filtrarSessoes();
    });
  }
}

function configurarFiltros() {
  const botoesFiltro = document.querySelectorAll(".btnFiltro");
  
  botoesFiltro.forEach(botao => {
    botao.addEventListener("click", function() {
      // Remove classe ativa de todos os filtros
      document.querySelectorAll(".btnFiltro").forEach(btn => {
        btn.classList.remove("filtro-ativo");
      });
      // Adiciona classe ativa ao botão clicado
      this.classList.add("filtro-ativo");
      
      // Atualiza o filtro atual
      filtroAtual = this.dataset.filtro;
      filtrarSessoes();
    });
  });
}

async function carregarHistoricoSessoes() {
  const container = document.getElementById("listaSessoes");
  if (!container) return;

  container.innerHTML = '<div class="semSessoes">Carregando...</div>';

  try {
    // Tentar buscar do dia de hoje
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString("en-CA");
    
    const { ok, dados } = await apiRequest(`/sessoesPendentes?data=${dataFormatada}`, "GET");
    
    if (!ok) {
      throw new Error(dados?.error || "Erro na API");
    }
    
    let sessoes = [];
    
    if (dados.sessoes && dados.sessoes.length > 0) {
      dados.sessoes.forEach(item => {
        if (item.sessao && item.sessao.id_sessao) {
          sessoes.push({
            ...item.sessao,
            data_hora: item.hora_inicio,
            data_original: dataFormatada
          });
        }
      });
    }
    
    // Armazenar todas as sessões
    todasSessoes = sessoes;
    
    // Aplicar filtro inicial
    filtrarSessoes();

  } catch (error) {
    console.error("Erro ao carregar histórico:", error.message);
    container.innerHTML = '<div class="semSessoes">Erro ao carregar sessões. Tente novamente mais tarde.</div>';
  }
}


function filtrarSessoes() {
  const container = document.getElementById("listaSessoes");
  if (!container) return;

  let sessoesFiltradas = todasSessoes;

  // Filtrar por status
  if (filtroAtual !== "todas") {
    sessoesFiltradas = sessoesFiltradas.filter(sessao => {
      const status = (sessao.status_sessao || sessao.status || "").toLowerCase();
      return status.includes(filtroAtual.substring(0, 4));
    });
  }

  // Filtrar por nome de paciente
  if (buscaPaciente) {
    sessoesFiltradas = sessoesFiltradas.filter(sessao => {
      const nome = (sessao.paciente?.usuario?.nome || "").toLowerCase();
      return nome.includes(buscaPaciente);
    });
  }

  // Filtrar por data
  if (filtroData) {
    sessoesFiltradas = sessoesFiltradas.filter(sessao => {
      const dataSessao = new Date(sessao.data_hora || sessao.data);
      const dataFormatada = dataSessao.toISOString().split("T")[0];
      return dataFormatada === filtroData;
    });
  }

  // Ordenar por data (mais recente primeiro)
  sessoesFiltradas.sort((a, b) => {
    const dataA = new Date(a.data_hora || a.data);
    const dataB = new Date(b.data_hora || b.data);
    return dataB - dataA;
  });

  if (sessoesFiltradas.length === 0) {
    container.innerHTML = '<div class="semSessoes">Nenhuma sessão encontrada</div>';
    return;
  }

  container.innerHTML = "";

  sessoesFiltradas.forEach(sessao => {
    const card = criarCardSessao(sessao);
    container.appendChild(card);
  });
}

function criarCardSessao(sessao) {
  const card = document.createElement("div");
  card.classList.add("card-sessao");

  // Dados da sessão
  const nome = sessao.paciente?.usuario?.nome || "Paciente";
  const data = new Date(sessao.data_hora || sessao.data);
  const dataFormatada = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const horaFormatada = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
  
  const status = sessao.status_sessao || sessao.status || "agendada";
  const observacao = sessao.observacao || sessao.tipo_sessao || "Sessão de acompanhamento";
  
  // Determinar ícone e cor do status
  let statusIcone = "";
  let statusCor = "";
  let statusTexto = "";
  let statusInfo = "";

  switch (status.toLowerCase()) {
    case "realizada":
      statusIcone = "🟢";
      statusCor = "status-realizada";
      statusTexto = "Realizada";
      statusInfo = "Sessão concluída";
      break;
    case "cancelada":
      statusIcone = "🔴";
      statusCor = "status-cancelada";
      statusTexto = "Cancelada";
      statusInfo = sessao.motivo_cancelamento || "Paciente não compareceu";
      break;
    case "reagendada":
    case "remarcada":
      statusIcone = "🟡";
      statusCor = "status-reagendada";
      statusTexto = "Remarcada";
      const novaData = sessao.nova_data ? new Date(sessao.nova_data) : null;
      statusInfo = novaData ? `Remarcada para ${novaData.toLocaleDateString("pt-BR")}` : "Aguardando nova data";
      break;
    default:
      statusIcone = "⚪";
      statusCor = "status-agendada";
      statusTexto = "Agendada";
      statusInfo = "Aguardando";
  }

  card.innerHTML = `
    <div class="card-sessao-icone">
      <span>👤</span>
    </div>
    <div class="card-sessao-info">
      <div class="card-sessao-nome">${nome}</div>
      <div class="card-sessao-detalhes">
        <span class="card-sessao-data">📅 ${dataFormatada}</span>
        <span class="card-sessao-hora">🕒 ${horaFormatada}</span>
      </div>
      <div class="card-sessao-observacao">💬 ${observacao}</div>
      <div class="card-sessao-info-extra">${statusInfo}</div>
    </div>
    <div class="card-sessao-status ${statusCor}">
      <span class="status-icone">${statusIcone}</span>
      <span class="status-texto">${statusTexto}</span>
    </div>
  `;

  return card;
}