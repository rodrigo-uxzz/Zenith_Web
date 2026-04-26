import { apiRequest } from "./api.js";

// Modal de logout
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");

  // Abrir modal
  if (openModalBtn) {
    openModalBtn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.style.display = "flex";
    });
  }

  // Fechar modal ao clicar em cancelar
  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  // Confirmar logout
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

      // Limpar token e redirecionar
      localStorage.removeItem("token");
      window.location.href = "./../pages/loginScreen.html";
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

// consultasHoje function
document.addEventListener("DOMContentLoaded", function () {
  consultasHoje();
  carregarNotificacoes();
});

document.getElementById("verAgenda").addEventListener("click", function () {
  window.location.href = "./../pages/agendaScreen.html";
});

async function carregarNotificacoes() {
  const container = document.getElementById("central-notificacoes");
  if (!container) return;

  container.innerHTML = "<div class='sem-notificacoes'>Carregando...</div>";

  try {
    const { ok, dados } = await apiRequest("/solicitacoes?status=pendente", "GET");

    if (!ok) {
      throw new Error(dados?.error || "Erro na API");
    }

    if (!dados.solicitacoes || dados.solicitacoes.length === 0) {
      container.innerHTML = "<div class='sem-notificacoes'>Nenhuma notificação no momento</div>";
      return;
    }

    container.innerHTML = "";

    dados.solicitacoes.forEach((solicitacao) => {
      const nome = solicitacao.paciente?.usuario?.nome || "Paciente";
      const data = new Date(solicitacao.data_hora);
      const dataFormatada = data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const horaFormatada = data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const tipoNotificacao = solicitacao.tipo || "consulta";
      let textoTipo = "";
      if (tipoNotificacao === "remarcacao") {
        textoTipo = "pediu remarcação";
      } else {
        textoTipo = "solicitou consulta";
      }

      const div = document.createElement("div");
      div.classList.add("notificacao-item");
      div.innerHTML = `
        <div class="notificacao-conteudo">
          <strong>${nome} ${textoTipo}</strong>
          <span class="notificacao-data">${dataFormatada} às ${horaFormatada}</span>
        </div>
        <div class="notificacao-acoes">
          <button class="btn-aceitar" data-id="${solicitacao.id_solicitacao}">Aceitar</button>
          <button class="btn-recusar" data-id="${solicitacao.id_solicitacao}">Recusar</button>
        </div>
      `;

      container.appendChild(div);
    });

    // Adicionar event listeners aos botões
    container.querySelectorAll(".btn-aceitar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await responderSolicitacao(id, "aceita");
      });
    });

    container.querySelectorAll(".btn-recusar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await responderSolicitacao(id, "recusada");
      });
    });

  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
    container.innerHTML = "<div class='sem-notificacoes'>Nenhuma notificação no momento</div>";
  }
}

async function responderSolicitacao(id, resposta) {
  try {
    const { ok, dados } = await apiRequest(`/solicitacoes/${id}`, "PUT", { status: resposta });

    if (ok) {
      alert(resposta === "aceita" ? "Consulta aceita!" : "Consulta recusada.");
      carregarNotificacoes();
    } else {
      alert(dados?.error || "Erro ao processar solicitação");
    }
  } catch (error) {
    console.error("Erro ao responder solicitação:", error);
    alert("Erro ao processar solicitação");
  }
}

async function consultasHoje() {
  let dataAtual = new Date();

  const dataFormatada = dataAtual.toISOString().split("T")[0];

  const { dados, ok } = await apiRequest(
    `/consultasDoDia?data=${dataFormatada}`,
  );

  const hoje = new Date();

  let count = 0;

  if (dataAtual.toDateString() === hoje.toDateString()) {
    const sessoes = dados.sessoes || [];

    count = sessoes.filter((s) => s.status_sessao !== "disponivel").length;
  }

  document.getElementById("consultasHoje").innerText = count;
}
