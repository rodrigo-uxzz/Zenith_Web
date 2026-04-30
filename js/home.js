import { apiRequest } from "./api.js";

let idSessaoRecusar = null;
let recusarModal = null;

// Função para mostrar toast de alerta
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

// Modal de logout
document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");
  const recusarModal = document.getElementById("recusar-modal");
  const closeRecusarModal = document.getElementById("close-recusar-modal");
  const btnVoltarRecusar = document.getElementById("btn-voltar-recusar");
  const btnConfirmarRecusar = document.getElementById("btn-confirmar-recusar");
  const motivoRecusar = document.getElementById("motivo-recusar");

  // fechar
  if (closeRecusarModal) {
    closeRecusarModal.addEventListener("click", () => {
      recusarModal.style.display = "none";
    });
  }

  if (btnVoltarRecusar) {
    btnVoltarRecusar.addEventListener("click", () => {
      recusarModal.style.display = "none";
    });
  }

  // confirmar recusa
  if (btnConfirmarRecusar) {
    btnConfirmarRecusar.addEventListener("click", async () => {
      const motivo = motivoRecusar.value.trim();

      if (!motivo) {
        showToast("Informe o motivo da recusa");
        return;
      }

      try {
        const { ok, dados } = await apiRequest(
          `/recusarSessao/${idSessaoRecusar}`,
          "POST",
          { motivo },
        );

        if (ok) {
          showToast("Solicitação recusada com sucesso!");
          recusarModal.style.display = "none";
          carregarNotificacoes();
        } else {
          showToast(dados?.error || "Erro ao recusar");
        }
      } catch (error) {
        console.error(error);
        showToast("Erro ao recusar");
      }
    });
  }

  // Abrir modal
  if (openModalBtn) {
    openModalBtn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.style.display = "flex";
    });
  }

  // Fechar modal
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

      localStorage.removeItem("token");
      window.location.href = "./../pages/loginScreen.html";
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }

    if (event.target === recusarModal) {
      recusarModal.style.display = "none";
    }
  });

  consultasHoje();
  carregarNotificacoes();
});

// Botão ver agenda
const verAgenda = document.getElementById("verAgenda");

if (verAgenda) {
  verAgenda.addEventListener("click", function () {
    window.location.href = "./../pages/agendaScreen.html";
  });
}

// ===============================
// NOTIFICAÇÕES
// ===============================

async function carregarNotificacoes() {
  const container = document.getElementById("central-notificacoes");

  if (!container) return;

  container.innerHTML = `
      <div class="sem-notificacoes">
        Carregando...
      </div>
    `;

  try {
    const { ok, dados } = await apiRequest("/sessoesPendentes", "GET");

    if (!ok) {
      throw new Error(dados?.error || "Erro ao buscar notificações");
    }

    const notificacoes = [
      ...(dados.pendentes || []),
      ...(dados.cancelamentos || []),
      ...(dados.reagendamentos || []),
    ];

    notificacoes.sort((a, b) => {
      const dataA = new Date(`${a.data_sessao} ${a.hora_inicio}`);
      const dataB = new Date(`${b.data_sessao} ${b.hora_inicio}`);

      return dataB - dataA;
    });

    container.innerHTML = "";

    notificacoes.forEach((sessao) => {
      const nome = sessao.paciente?.usuario?.nome || "Paciente";

      const data = sessao.data_sessao || "--/--/----";
      const hora = sessao.hora_inicio || "--:--";
      const status = sessao.status_sessao || "";

      let textoTipo = "";

      if (status === "pendente") {
        textoTipo = "solicitou consulta";
      } else if (status === "cancelamento_solicitado") {
        textoTipo = "solicitou cancelamento";
      } else if (status === "reagendamento_solicitado") {
        textoTipo = "solicitou reagendamento";
      } else {
        textoTipo = "possui atualização";
      }

      const div = document.createElement("div");
      div.classList.add("notificacao-item");
      let infoExtra = "";

      if (status === "reagendamento_solicitado") {
        const novaData = sessao.data_solicitada || "--/--/----";
        const novaHora = sessao.hora_solicitada || "--:--";

        infoExtra = `
    <span class="notificacao-novo-horario">
    <span class="icone">
    <ion-icon name="repeat-outline"></ion-icon>
    </span>
      Solicitado para: ${novaData} às ${novaHora}
    </span>
  `;
      }

      div.innerHTML = `
          <div class="notificacao-conteudo">
            <strong>${nome} ${textoTipo}</strong>

            <span class="notificacao-data">
              ${data} às ${hora}
            </span>

            ${infoExtra}
          </div>

          <div class="notificacao-acoes">
            <button 
              class="btn-aceitar" 
              data-id="${sessao.id_sessao}">
              Aceitar
            </button>

            <button 
              class="btn-recusar" 
              data-id="${sessao.id_sessao}">
              Recusar
            </button>
          </div>
        `;

      container.appendChild(div);
    });

    // botão aceitar
    container.querySelectorAll(".btn-aceitar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await aprovarSessao(id);
      });
    });

    // botão recusar
    container.querySelectorAll(".btn-recusar").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await recusarSessao(id);
      });
    });
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);

    container.innerHTML = `
        <div class="sem-notificacoes">
          Erro ao carregar notificações
        </div>
      `;
  }
}

// Aprovar sessão
async function aprovarSessao(id) {
  try {
    const { ok, dados } = await apiRequest(`/aprovarSessao/${id}`, "POST");

    if (ok) {
      showToast("Solicitação aprovada com sucesso!");
      carregarNotificacoes();
    } else {
      showToast(dados?.error || "Erro ao aprovar solicitação");
    }
  } catch (error) {
    console.error(error);
    showToast("Erro ao aprovar solicitação");
  }
}

// Recusar sessão
function recusarSessao(id) {
  idSessaoRecusar = id;

  const modal = document.getElementById("recusar-modal");
  const textarea = document.getElementById("motivo-recusar");

  if (textarea) textarea.value = "";

  if (modal) modal.style.display = "flex";
}

// ===============================
// CONSULTAS DE HOJE
// ===============================

async function consultasHoje() {
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toISOString().split("T")[0];

  try {
    const { dados } = await apiRequest(
      `/consultasDoDia?data=${dataFormatada}`,
      "GET",
    );

    const sessoes = dados.sessoes || [];

    const count = sessoes.filter(
      (s) => s.status_sessao !== "disponivel",
    ).length;

    document.getElementById("consultasHoje").innerText = count;
  } catch (error) {
    console.error("Erro ao carregar consultas:", error);
  }
}
