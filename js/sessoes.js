import { apiRequest } from "./api.js";

let todasSessoes = [];
let filtroAtual = "todas";
let buscaPaciente = "";
let filtroData = "";
let sessaoAberta = null;

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", function () {
  configurarLogout();
  configurarFiltros();
  configurarBusca();
  configurarModalSessao();
  carregarHistoricoSessoes();
});

/* =========================
   LOGOUT
========================= */

function configurarLogout() {
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
        await apiRequest("/logout", "POST");
      } catch (error) {
        console.error("Erro no logout:", error);
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
}

/* =========================
   FILTROS
========================= */

function configurarBusca() {
  const inputBuscar = document.getElementById("buscarPaciente");
  const inputData = document.getElementById("filtrarData");

  if (inputBuscar) {
    inputBuscar.addEventListener("input", function () {
      buscaPaciente = this.value.toLowerCase().trim();
      filtrarSessoes();
    });
  }

  if (inputData) {
    inputData.addEventListener("change", function () {
      filtroData = this.value;
      filtrarSessoes();
    });
  }
}

function configurarFiltros() {
  const botoesFiltro = document.querySelectorAll(".filtros-status .btnFiltro");

  botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", function () {
      // remove classe ativa de todos
      botoesFiltro.forEach((btn) => {
        btn.classList.remove("filtro-ativo");
      });

      // adiciona no clicado
      this.classList.add("filtro-ativo");

      // IMPORTANTE:
      // seu HTML precisa ter data-filtro
      filtroAtual = this.getAttribute("data-filtro");

      console.log("Filtro selecionado:", filtroAtual);

      filtrarSessoes();
    });
  });
}

function configurarModalSessao() {
  const modal = document.getElementById("modal-sessao");
  const closeBtn = document.getElementById("close-modal-sessao");
  const fecharBtn = document.getElementById("btn-fechar-sessao");
  const editarBtn = document.getElementById("btn-editar-sessao");

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      modal.style.display = "none";
      sessaoAberta = null;
    });
  }

  if (fecharBtn) {
    fecharBtn.addEventListener("click", function () {
      modal.style.display = "none";
      sessaoAberta = null;
    });
  }

  if (editarBtn) {
    editarBtn.addEventListener("click", function () {
      // Implementar lógica de edição futura
      console.log("Editar sessão:", sessaoAberta);
      // window.location.href = "./editarSessao.html?id=" + sessaoAberta.id;
    });
  }

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      sessaoAberta = null;
    }
  });
}


/* =========================
   CARREGAR HISTÓRICO
========================= */

async function carregarHistoricoSessoes() {
  const container = document.getElementById("listaSessoes");

  if (!container) return;

  container.innerHTML = `
    <div class="semSessoes">
      Carregando sessões...
    </div>
  `;

  try {
    const { ok, dados } = await apiRequest(
      "/psicologoHistorico",
      "GET"
    );

    console.log("RETORNO API:", ok, dados);

    if (!ok) {
      throw new Error(
        dados?.error || "Erro ao buscar histórico"
      );
    }

    // seu Laravel retorna:
    // {
    //   realizadas: [],
    //   cancelamentos: []
    // }

    todasSessoes = [
      ...(dados.realizadas || []),
      ...(dados.cancelamentos || [])
    ];

    console.log("SESSÕES TRATADAS:", todasSessoes);

    if (!todasSessoes.length) {
      container.innerHTML = `
        <div class="semSessoes">
          Nenhuma sessão encontrada
        </div>
      `;
      return;
    }

    filtrarSessoes();

  } catch (error) {
    console.error(
      "Erro ao carregar histórico:",
      error
    );

    container.innerHTML = `
      <div class="semSessoes">
        Erro ao carregar sessões
      </div>
    `;
  }
}


/* =========================
   FILTRAR
========================= */

function filtrarSessoes() {
  const container = document.getElementById("listaSessoes");
  if (!container) return;

  let sessoesFiltradas = [...todasSessoes];

  /* filtro por status */

  if (filtroAtual !== "todas") {
    sessoesFiltradas = sessoesFiltradas.filter((sessao) => {
      const status = (
        sessao.status_sessao || ""
      ).toLowerCase();

      if (filtroAtual === "realizadas") {
        return status === "realizada";
      }

      if (filtroAtual === "canceladas") {
        return status === "cancelada";
      }

      if (filtroAtual === "reagendadas") {
        return (
          status === "reagendamento_solicitado" ||
          status === "reagendada"
        );
      }

      return true;
    });
  }

  /* filtro por nome */

  if (buscaPaciente) {
    sessoesFiltradas = sessoesFiltradas.filter((sessao) => {
      const nome = (
        sessao.paciente?.usuario?.name ||
        sessao.paciente?.usuario?.nome ||
        ""
      ).toLowerCase();

      return nome.includes(buscaPaciente);
    });
  }

  /* filtro por data */

  if (filtroData) {
    sessoesFiltradas = sessoesFiltradas.filter((sessao) => {
      const dataSessao = (
        sessao.data_sessao || ""
      ).substring(0, 10);

      return dataSessao === filtroData;
    });
  }

  /* ordenação */

  sessoesFiltradas.sort((a, b) => {
    const dataA = new Date(
      `${a.data_sessao} ${a.hora_inicio}`
    );

    const dataB = new Date(
      `${b.data_sessao} ${b.hora_inicio}`
    );

    return dataB - dataA;
  });

  renderizarSessoes(sessoesFiltradas);
}

/* =========================
   RENDERIZAR
========================= */

function renderizarSessoes(sessoes) {
  const container = document.getElementById("listaSessoes");
  if (!container) return;

  if (!sessoes.length) {
    container.innerHTML = `
      <div class="semSessoes">
        Nenhuma sessão encontrada
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  sessoes.forEach((sessao) => {
    const card = criarCardSessao(sessao);
    container.appendChild(card);
  });
}

/* =========================
   CARD
========================= */

function criarCardSessao(sessao) {
  const card = document.createElement("div");
  card.classList.add("card-sessao");

  const nome =
    sessao.paciente?.usuario?.name ||
    sessao.paciente?.usuario?.nome ||
    "Paciente";

  const dataObj = new Date(
    `${sessao.data_sessao} ${sessao.hora_inicio}`
  );

  const dataFormatada = dataObj.toLocaleDateString("pt-BR");

  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const status = (
    sessao.status_sessao || "agendada"
  ).toLowerCase();

  let statusTexto = "Agendada";
  let statusClasse = "status-agendada";

  if (status === "realizada") {
    statusTexto = "Realizada";
    statusClasse = "status-realizada";
  }

  if (status === "cancelada") {
    statusTexto = "Cancelada";
    statusClasse = "status-cancelada";
  }

  if (
    status === "reagendamento_solicitado" ||
    status === "reagendada"
  ) {
    statusTexto = "Reagendada";
    statusClasse = "status-reagendada";
  }

  card.innerHTML = `
    <div class="card-sessao-icone">
      <div class="iconConsulta">
          <span class="icone"><ion-icon name="person-outline"></ion-icon></span>
      </div>
    </div>

    <div class="card-sessao-info">
      <div class="card-sessao-nome">
        ${nome}
      </div>

      <div class="card-sessao-detalhes">
        <span>
          <div class="card-icon">
                  <ion-icon name="calendar-clear-outline"></ion-icon>
                  ${dataFormatada}
          </div>
        </span>
        <span>
            <div class="card-icon">
                <ion-icon name="time-outline"></ion-icon>
                ${horaFormatada}
            </div>
        </span>
      </div>
    </div>

    <div class="card-sessao-status ${statusClasse}">
      <span>${statusTexto}</span>
    </div>
  `;

  card.addEventListener("click", function () {
    abrirModalSessao(sessao);
  });

  return card;
}

function abrirModalSessao(sessao) {
  sessaoAberta = sessao;
  const modal = document.getElementById("modal-sessao");
  if (!modal) return;

  const pacienteNome =
    sessao.paciente?.usuario?.name ||
    sessao.paciente?.usuario?.nome ||
    "Paciente não informado";

  const profissionalNome =
    sessao.psicologo?.usuario?.name ||
    sessao.psicologo?.usuario?.nome ||
    sessao.psicologo?.nome ||
    sessao.usuario?.name ||
    sessao.usuario?.nome ||
    "Profissional não informado";

  const dataObj = new Date(`${sessao.data_sessao} ${sessao.hora_inicio}`);
  const dataFormatada = isNaN(dataObj.getTime())
    ? "-"
    : dataObj.toLocaleDateString("pt-BR");

  const horaFormatada = isNaN(dataObj.getTime())
    ? "-"
    : dataObj.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });

  const horaFim = sessao.hora_fim
    ? sessao.hora_fim
    : sessao.hora_final || "-";

  const tipo =
    sessao.tipo ||
    sessao.tipo_sessao ||
    sessao.modalidade ||
    sessao.especialidade ||
    "Consulta";

  const local =
    sessao.local ||
    sessao.sala ||
    sessao.endereco ||
    "Não informado";

  const observacoes =
    sessao.observacoes ||
    sessao.observacao ||
    sessao.notas ||
    sessao.descricao ||
    "Sem observações.";

  const statusBruto = (sessao.status_sessao || "").toLowerCase();
  let statusTexto = "Agendada";

  if (statusBruto === "realizada") {
    statusTexto = "Realizada";
  } else if (statusBruto === "cancelada") {
    statusTexto = "Cancelada";
  } else if (
    statusBruto === "reagendamento_solicitado" ||
    statusBruto === "reagendada"
  ) {
    statusTexto = "Reagendada";
  }

  const horaRange = horaFim && horaFim !== "-" ? `${horaFormatada} - ${horaFim}` : horaFormatada;

  const titleElement = document.getElementById("sessao-modal-name");
  const statusElement = document.getElementById("sessao-modal-status");
  const pacienteElement = document.getElementById("sessao-modal-paciente");
  const profissionalElement = document.getElementById("sessao-modal-profissional");
  const dataElement = document.getElementById("sessao-modal-data");
  const horaElement = document.getElementById("sessao-modal-hora");
  const tipoElement = document.getElementById("sessao-modal-tipo");
  const localElement = document.getElementById("sessao-modal-local");
  const observacoesElement = document.getElementById("sessao-modal-observacoes");

  if (titleElement) titleElement.textContent = `Sessão de ${pacienteNome}`;
  if (statusElement) statusElement.textContent = statusTexto;
  if (pacienteElement) pacienteElement.textContent = pacienteNome;
  if (profissionalElement) profissionalElement.textContent = profissionalNome;
  if (dataElement) dataElement.textContent = dataFormatada;
  if (horaElement) horaElement.textContent = horaRange;
  if (tipoElement) tipoElement.textContent = tipo;
  if (localElement) localElement.textContent = local;
  if (observacoesElement) observacoesElement.textContent = observacoes;

  modal.style.display = "flex";
}
