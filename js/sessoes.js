import { apiRequest } from "./api.js";

let todasSessoes = [];
let filtroAtual = "todas";
let buscaPaciente = "";
let filtroData = "";

/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", function () {
  configurarLogout();
  configurarFiltros();
  configurarBusca();
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
  let statusIcone = "⚪";

  if (status === "realizada") {
    statusTexto = "Realizada";
    statusClasse = "status-realizada";
    statusIcone = "🟢";
  }

  if (status === "cancelada") {
    statusTexto = "Cancelada";
    statusClasse = "status-cancelada";
    statusIcone = "🔴";
  }

  if (
    status === "reagendamento_solicitado" ||
    status === "reagendada"
  ) {
    statusTexto = "Reagendada";
    statusClasse = "status-reagendada";
    statusIcone = "🟡";
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
      <span>${statusIcone}</span>
      <span>${statusTexto}</span>
    </div>
  `;

  return card;
}
