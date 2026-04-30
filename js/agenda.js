import { apiRequest } from "./api.js";

// Botões do modal de pendente (definidos fora para uso global)
let btnAceitarConsulta, btnRecusarConsulta;

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

  // Inicializar botões do modal
  btnAceitarConsulta = document.getElementById("btn-aceitar-consulta");
  btnRecusarConsulta = document.getElementById("btn-recusar-consulta");

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

  // Delegação de eventos para botões criados dinamicamente
  const listaHorarios = document.getElementById("listaHorarios");
  if (listaHorarios) {
    listaHorarios.addEventListener("click", function (e) {
      const button = e.target.closest(".botaoConsulta");
      if (button) {
        showConsultaModal(button);
      }
    });
  }

  // Event listeners para botões de aceitar e recusar
  if (btnAceitarConsulta) {
    btnAceitarConsulta.addEventListener("click", async function () {
      const idSessao = consultaModal.dataset.id;
      if (!idSessao) {
        showToast("ID da sessão não encontrado");
        return;
      }

      try {
        const { ok, dados } = await apiRequest(
          `/aprovarSessao/${idSessao}`,
          "POST",
        );

        if (ok) {
          showToast("Solicitação aprovada com sucesso!");
          consultaModal.style.display = "none";
          atualizarData();
        } else {
          showToast(dados?.error || "Erro ao aprovar solicitação");
        }
      } catch (error) {
        console.error(error);
        showToast("Erro ao aprovar solicitação");
      }
    });
  }

  if (btnRecusarConsulta) {
    btnRecusarConsulta.addEventListener("click", async function () {
      const idSessao = consultaModal.dataset.id;
      const statusSessao = consultaModal.dataset.status || "";
      if (!idSessao) {
        showToast("ID da sessão não encontrado");
        return;
      }

      // Sempre abrir modal de cancelamento quando houver botão de recusar
      consultaModal.style.display = "none";
      if (cancelarModal) {
        cancelarModal.dataset.mode = "recusar";
        motivoCancelamento.value = "";
        const modalTitle = cancelarModal.querySelector("h2");
        const modalText = cancelarModal.querySelector("p");
        if (modalTitle) modalTitle.textContent = "Recusar solicitação";
        if (modalText) modalText.textContent = "Informe o motivo da recusa:";
        cancelarModal.style.display = "flex";
      }
    });
  }
});

let dataAtual = new Date();

document.getElementById("avancarDia").addEventListener("click", avancarDia);
document.getElementById("voltarDia").addEventListener("click", voltarDia);

function avancarDia() {
  dataAtual.setDate(dataAtual.getDate() + 1);
  atualizarData();
}

function voltarDia() {
  dataAtual.setDate(dataAtual.getDate() - 1);
  atualizarData();
}

async function atualizarData() {
  try {
    const dataFormatada = dataAtual.toLocaleDateString("en-CA");

    const hoje = new Date();
    let textoData = "";
    let textoData2 = "";

    if (dataAtual.toDateString() === hoje.toDateString()) {
      textoData = "Hoje";
      textoData2 = dataAtual.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } else {
      textoData = dataAtual.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      textoData2 = dataAtual.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }

    document.getElementById("dia").innerText = textoData;
    document.getElementById("dia2").innerText = textoData2;

    const { dados, ok } = await apiRequest(
      `/consultasDoDia?data=${dataFormatada}&t=${Date.now()}`,
    );

    console.log("=== DADOS COMPLETOS DA API ===");
    console.log(JSON.stringify(dados, null, 2));

    const container = document.getElementById("listaHorarios");
    container.innerHTML = "";

    const sessoes = dados.sessoes || [];

    if (!ok || !dados.sessoes || dados.sessoes.length === 0) {
      container.innerHTML = `<div class="semConsultas">Dia sem consultas</div>`;
      return;
    }

    sessoes.forEach((item) => {
      console.log("=== ITEM COMPLETO ===");
      console.log(JSON.stringify(item, null, 2));
      console.log("Status sessão:", item.status_sessao);
      console.log("Sessão:", item.sessao);
      console.log("Sessão status:", item.sessao?.status);

      const linha = document.createElement("div");
      linha.classList.add("linhaHorario");

      const horaDiv = document.createElement("div");
      horaDiv.classList.add("hora");
      horaDiv.innerText = item.hora_inicio.slice(0, 5);

      let conteudo;

      if (item.tipo === "evento") {
        if (item.slug === "almoco") {
          conteudo = document.createElement("div");
          conteudo.classList.add("horarioAlmoco");
          conteudo.innerText = "🍽 Horário de almoço";
        } else {
          conteudo = document.createElement("div");
          conteudo.classList.add("horarioAlmoco");
          conteudo.innerText = "📌 " + (item.evento?.nome || "Evento");
        }
      } else if (item.sessao && item.sessao.id_sessao) {
        conteudo = document.createElement("button");
        conteudo.classList.add("consultaCard", "botaoConsulta");

        // consulta status - com tratamento de erro
        conteudo.dataset.id = item.sessao?.id_sessao;

        // Tratamento de erro robusto para o status
        let status =
          item.sessao?.status || item.sessao?.status_sessao || "agendada";

        // Normalizar status para evitar problemas
        status = status.toLowerCase().trim();

        // Verificar se o status é válido
        const statusValidos = [
          "agendada",
          "pendente",
          "realizada",
          "cancelada",
          "reagendada",
          "remarcada",
        ];
        const isStatusValido = statusValidos.some((s) => status.includes(s));

        if (!isStatusValido && item.sessao?.status) {
          console.warn("Status inválido recebido da API:", item.sessao.status);
        }

        // Se status for vazio ou inválido, usar agendada como padrão
        if (!status || status === "null" || status === "undefined") {
          status = "agendada";
        }

        conteudo.dataset.status = status;

        const nome = item.sessao?.paciente?.usuario?.nome || "Paciente";

        console.log("Status da sessão:", status);

        // Verificar se é realizada (aceita variações)
        const isRealizada = status.includes("realiz");
        // Verificar se é pendente
        const isPendente = status.includes("pendente");
        // Verificar se é cancelamento solicitado (pendente de aprovação)
        const isCancelamentoSolicitado =
          status.includes("cancelamento_solicitado") ||
          status === "cancelamento_solicitado";
        // Verificar se é cancelada (já aprovada)
        const isCancelada =
          status.includes("cancel") && !isCancelamentoSolicitado;
        // Verificar se é reagendamento (pendente de aprovação)
        const isReagendada =
          status.includes("reagend") || status.includes("remarc");

        // Aplicar classe conforme o status
        conteudo.classList.remove("consultaCard");
        if (isRealizada) {
          conteudo.classList.add("consultaRealizada");
        } else if (isPendente) {
          conteudo.classList.add("consultaPendente");
        } else if (isCancelamentoSolicitado) {
          conteudo.classList.add("consultaCancelamentoSolicitado");
        } else if (isCancelada) {
          conteudo.classList.add("consultaCancelada");
        } else if (isReagendada) {
          conteudo.classList.add("consultaReagendamentoSolicitado");
        } else {
          conteudo.classList.add("consultaCard");
        }

        // Formatar texto do status para exibição
        let statusTexto = status.charAt(0).toUpperCase() + status.slice(1);
        if (status.includes("cancelamento_solicitado"))
          statusTexto = "Cancelamento Solicitado";
        else if (status.includes("cancel")) statusTexto = "Cancelada";
        else if (status.includes("reagend") || status.includes("remarc"))
          statusTexto = "Reagendamento Solicitado";

        conteudo.style.position = "relative";

        conteudo.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <strong>${nome}</strong>
            <span>${item.hora_inicio.slice(0, 2) + "h"}</span>
          </div>

          <span 
            class="status-badge status-${status}"
            style="
              position: absolute;
              right: 16px;
              top: 50%;
              transform: translateY(-50%);
              margin: 0;
              white-space: nowrap;
            "
          >
            ${statusTexto}
          </span>
        `;
      } else {
        conteudo = document.createElement("div");
        conteudo.classList.add("horarioLivre");
        conteudo.innerText = "Horário disponível";
      }

      linha.appendChild(horaDiv);
      linha.appendChild(conteudo);

      container.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao atualizar agenda:", error);
  }
}

const cancelarModal = document.getElementById("cancelar-modal");
const closeCancelarModal = document.getElementById("close-cancelar-modal");
const btnVoltarCancelar = document.getElementById("btn-voltar-cancelar");
const btnConfirmarCancelamento = document.getElementById(
  "btn-confirmar-cancelamento",
);
const motivoCancelamento = document.getElementById("motivo-cancelamento");

const consultaButtons = document.querySelectorAll(".botaoConsulta");
const consultaModal = document.getElementById("consulta-modal");
const closeConsultaModal = document.getElementById("close-consulta-modal");
const btnEditar = document.querySelector(".btnEditar");
const editarModal = document.getElementById("editar-modal");
const closeEditarModal = document.getElementById("close-editar-modal");
const editarLink = document.getElementById("editar-link");
const editarObservacoes = document.getElementById("editar-observacoes");
const btnCancelarEditar = document.getElementById("btn-cancelar-editar");
const btnSalvarEditar = document.getElementById("btn-salvar-editar");
const btnConfigHorario = document.getElementById("btn-config-horario");
const btnSessoes = document.getElementById("btn-sessoes");
const horarioModal = document.getElementById("horario-modal");
const closeHorarioModal = document.getElementById("close-horario-modal");
const btnVoltarHorario = document.getElementById("btn-voltar-horario");
// const btnSalvarHorario = document.getElementById("btn-salvar-horario");
const confirmModal = document.getElementById("confirm-modal");
const closeConfirmModal = document.getElementById("close-confirm-modal");
const btnVoltarConfirm = document.getElementById("btn-voltar-confirm");
const btnConfirmAction = document.getElementById("btn-confirm-action");
const confirmDoneModal = document.getElementById("confirm-done-modal");
const closeConfirmDoneModal = document.getElementById(
  "close-confirm-done-modal",
);
const btnVoltarConfirmDone = document.getElementById("btn-voltar-confirm-done");
const btnConfirmDoneAction = document.getElementById("btn-confirm-done-action");
const btnRealizada = document.querySelector(".btnRealizada");
const statusModal = document.getElementById("status-modal");
const closeStatusModal = document.getElementById("close-status-modal");
const statusModalTitle = document.getElementById("status-modal-title");
const statusModalText = document.getElementById("status-modal-text");
const statusModalOk = document.getElementById("status-modal-ok");

function hideModal(modal) {
  if (modal) modal.style.display = "none";
}

function closeAllModalsExcept(activeModal) {
  [
    consultaModal,
    reagendarModal,
    editarModal,
    horarioModal,
    confirmModal,
    confirmDoneModal,
    statusModal,
  ].forEach(function (modal) {
    if (modal && modal !== activeModal) {
      modal.style.display = "none";
    }
  });
}

function showStatusModal(title, message) {
  closeAllModalsExcept(statusModal);
  if (statusModalTitle) statusModalTitle.textContent = title;
  if (statusModalText) statusModalText.textContent = message;
  if (statusModal) statusModal.style.display = "flex";
}

function showConsultaModal(button) {
  closeAllModalsExcept(consultaModal);
  const nome = button.querySelector("strong")?.textContent || "Consulta";
  const horarioTexto = button.querySelector("span")?.textContent || "";
  const horario = parseHorario(horarioTexto);
  const data = document.querySelector(".dataAgenda")?.textContent || "";
  const link = `https://zoom.us/`; // Substitua pelo link real se disponível

  // Passar ID e status da sessão para o modal
  consultaModal.dataset.id = button.dataset.id;
  consultaModal.dataset.status = button.dataset.status || "agendada";

  document.getElementById("consulta-modal-nome").textContent = nome;
  document.getElementById("consulta-modal-data").textContent = data;
  document.getElementById("consulta-modal-horario").textContent = horario;
  const consultaLink = document.getElementById("consulta-modal-link");
  consultaLink.href = link;
  consultaLink.textContent = "Abrir link externo";
  document.getElementById("consulta-modal-observacao").textContent =
    "Primeira consulta";

  // Ajustar botões conforme o status
  const status = (button.dataset.status || "agendada").toLowerCase();
  const actionsContainer = document.querySelector(".consulta-modal-actions");
  const modalHeader = document.querySelector(".consulta-modal-header");

  if (actionsContainer && modalHeader) {
    const acaoPendente = actionsContainer.querySelector(".acao-pendente");
    const acaoAgendada = actionsContainer.querySelector(".acao-agendada");
    const btnEditar = modalHeader.querySelector(".btnEditar");
    const btnReagendar = actionsContainer.querySelector(".btnReagendar");
    const btnRealizada = actionsContainer.querySelector(".btnRealizada");
    const btnCancelada = actionsContainer.querySelector(".btnCancelada");

    // ESCONDE TUDO PRIMEIRO
    if (acaoPendente) acaoPendente.style.display = "none";
    if (acaoAgendada) acaoAgendada.style.display = "none";
    if (btnEditar) btnEditar.style.display = "none";
    if (btnReagendar) btnReagendar.style.display = "none";
    if (btnRealizada) btnRealizada.style.display = "none";
    if (btnCancelada) btnCancelada.style.display = "none";

    // MOSTRAR BOTÕES CONFORME O STATUS
    if (
      status.includes("pendente") ||
      status.includes("cancelamento_solicitado") ||
      status.includes("reagendamento_solicitado")
    ) {
      if (acaoPendente) acaoPendente.style.display = "flex";
    } else if (status === "agendada") {
      if (acaoAgendada) acaoAgendada.style.display = "flex";

      if (btnReagendar) btnReagendar.style.display = "block";
      if (btnRealizada) btnRealizada.style.display = "block";
      if (btnCancelada) btnCancelada.style.display = "block";

      // APENAS AGENDADA TEM BOTÃO DE EDITAR
      if (btnEditar) btnEditar.style.display = "block";
    }

    consultaModal.style.display = "flex";
  }
}

function showEditarModal() {
  const link = document.getElementById("consulta-modal-link").href || "";
  const observacoes =
    document.getElementById("consulta-modal-observacao").textContent || "";

  editarLink.value = link === "#" ? "" : link;
  editarObservacoes.value = observacoes;

  consultaModal.style.display = "none";
  editarModal.style.display = "flex";
}

function formatDateInput(dataTexto) {
  const partes = dataTexto.split(",");
  if (partes.length < 2) return "";
  const textoData = partes[1].trim();
  const partesData = textoData.split(" de ");
  if (partesData.length !== 3) return "";
  const [dia, mes, ano] = partesData;
  const meses = {
    janeiro: "01",
    fevereiro: "02",
    março: "03",
    abril: "04",
    maio: "05",
    junho: "06",
    julho: "07",
    agosto: "08",
    setembro: "09",
    outubro: "10",
    novembro: "11",
    dezembro: "12",
  };
  const mesNumero = meses[mes.toLowerCase()];
  if (!mesNumero) return "";
  return `${ano}-${mesNumero}-${dia.padStart(2, "0")}`;
}

function parseHorario(horarioTexto) {
  const texto = horarioTexto.replace("h", "").trim();
  const partes = texto.split(":");
  const hora = partes[0].padStart(2, "0");
  const minuto = partes[1] ? partes[1].padEnd(2, "0") : "00";
  const horaNumero = Number(hora);
  if (Number.isNaN(horaNumero)) return "";
  const fimHora = horaNumero + 1;
  const fim = `${fimHora.toString().padStart(2, "0")}:${minuto}`;
  return `${hora}:${minuto} - ${fim}`;
}

if (closeConsultaModal) {
  closeConsultaModal.addEventListener("click", function () {
    consultaModal.style.display = "none";
  });
}

if (btnEditar) {
  btnEditar.addEventListener("click", function () {
    showEditarModal();
  });
}

if (closeEditarModal) {
  closeEditarModal.addEventListener("click", function () {
    editarModal.style.display = "none";
  });
}

if (btnCancelarEditar) {
  btnCancelarEditar.addEventListener("click", function () {
    editarModal.style.display = "none";
    consultaModal.style.display = "flex";
  });
}

if (btnConfigHorario) {
  btnConfigHorario.addEventListener("click", function () {
    closeAllModalsExcept(horarioModal);
    horarioModal.style.display = "flex";
  });
}

if (btnSessoes) {
  btnSessoes.addEventListener("click", function () {
    window.location.href = "././sessoes.html";
  });
}

if (closeHorarioModal) {
  closeHorarioModal.addEventListener("click", function () {
    horarioModal.style.display = "none";
  });
}

if (btnVoltarHorario) {
  btnVoltarHorario.addEventListener("click", function () {
    horarioModal.style.display = "none";
  });
}

window.addEventListener("click", function (event) {
  if (event.target === consultaModal) {
    consultaModal.style.display = "none";
  }

  if (event.target === reagendarModal) {
    reagendarModal.style.display = "none";
  }

  if (event.target === editarModal) {
    editarModal.style.display = "none";
  }

  if (event.target === horarioModal) {
    horarioModal.style.display = "none";
  }

  if (event.target === confirmModal) {
    confirmModal.style.display = "none";
  }

  if (event.target === statusModal) {
    statusModal.style.display = "none";
  }

  if (event.target === cancelarModal) {
    cancelarModal.style.display = "none";
  }
});

const reagendarModal = document.getElementById("reagendar-modal");
const closeReagendarModal = document.getElementById("close-reagendar-modal");
const btnVoltarReagendar = document.getElementById("btn-voltar-reagendar");
const btnSalvarReagendar = document.getElementById("btn-salvar-reagendar");
const btnCancelar = document.querySelector(".btnCancelada");
const reagendarDate = document.getElementById("reagendar-date");
const reagendarTime = document.getElementById("reagendar-time");

const btnReagendar = document.querySelector(".btnReagendar");
if (btnReagendar) {
  btnReagendar.addEventListener("click", function () {
    if (consultaModal.dataset.status === "realizada") {
      showEditarModal();
    } else {
      const dataAtual = document.getElementById(
        "consulta-modal-data",
      ).textContent;
      const horarioAtual = document.getElementById(
        "consulta-modal-horario",
      ).textContent;
      if (reagendarDate) {
        // converte a data exibida no modal para o formato yyyy-MM-dd se possível
        const partes = dataAtual.split(",");
        if (partes.length > 1) {
          const inventarioData = partes[1].trim().split(" de ");
          if (inventarioData.length === 3) {
            const [dia, mes, ano] = inventarioData;
            const meses = {
              janeiro: "01",
              fevereiro: "02",
              março: "03",
              abril: "04",
              maio: "05",
              junho: "06",
              julho: "07",
              agosto: "08",
              setembro: "09",
              outubro: "10",
              novembro: "11",
              dezembro: "12",
            };
            const mesNumero = meses[mes.toLowerCase()];
            if (mesNumero) {
              reagendarDate.value = `${ano}-${mesNumero}-${dia.padStart(2, "0")}`;
            }
          }
        }
      }
      if (reagendarTime) {
        const horario = horarioAtual.split(" - ")[0];
        reagendarTime.value = horario;
      }
      consultaModal.style.display = "none";
      reagendarModal.style.display = "flex";
    }
  });
}

if (closeReagendarModal) {
  closeReagendarModal.addEventListener("click", function () {
    reagendarModal.style.display = "none";
  });
}

if (closeStatusModal) {
  closeStatusModal.addEventListener("click", function () {
    if (statusModal) statusModal.style.display = "none";
  });
}

if (btnVoltarReagendar) {
  btnVoltarReagendar.addEventListener("click", function () {
    reagendarModal.style.display = "none";
    consultaModal.style.display = "flex";
  });
}

let confirmType = "cancel";

function showConfirmModal(type) {
  confirmType = type;
  if (type === "cancel") {
    confirmModal.style.display = "flex";
  } else if (type === "done") {
    confirmDoneModal.style.display = "flex";
  }
}

if (btnCancelar) {
  btnCancelar.addEventListener("click", function () {
    cancelarModal.dataset.mode = "cancel";
    motivoCancelamento.value = "";
    const modalTitle = cancelarModal.querySelector("h2");
    const modalText = cancelarModal.querySelector("p");
    if (modalTitle) modalTitle.textContent = "Cancelar consulta";
    if (modalText) modalText.textContent = "Informe o motivo do cancelamento:";
    consultaModal.style.display = "none";
    cancelarModal.style.display = "flex";
  });
}

if (closeCancelarModal) {
  closeCancelarModal.addEventListener("click", () => {
    cancelarModal.style.display = "none";
  });
}

if (btnVoltarCancelar) {
  btnVoltarCancelar.addEventListener("click", () => {
    cancelarModal.style.display = "none";
    consultaModal.style.display = "flex";
  });
}

if (btnRealizada) {
  btnRealizada.addEventListener("click", function () {
    showConfirmModal("done");
  });
}

if (closeConfirmModal) {
  closeConfirmModal.addEventListener("click", function () {
    confirmModal.style.display = "none";
  });
}

if (btnVoltarConfirm) {
  btnVoltarConfirm.addEventListener("click", function () {
    confirmModal.style.display = "none";
  });
}

if (closeConfirmDoneModal) {
  closeConfirmDoneModal.addEventListener("click", function () {
    confirmDoneModal.style.display = "none";
  });
}

if (btnVoltarConfirmDone) {
  btnVoltarConfirmDone.addEventListener("click", function () {
    confirmDoneModal.style.display = "none";
  });
}

if (btnConfirmDoneAction) {
  btnConfirmDoneAction.addEventListener("click", async function () {
    confirmDoneModal.style.display = "none";

    const id = consultaModal.dataset.id;

    if (!id) {
      showStatusModal("Erro", "ID da sessão não encontrado");
      return;
    }

    console.log("Marcando sessão como realizada, ID:", id);

    try {
      const { ok, dados } = await apiRequest(`/sessaoRealizada/${id}`, "POST");

      console.log("Resposta da API:", ok, dados);

      if (!ok) {
        showStatusModal("Erro", dados?.error || "Erro na operação");
        return;
      }

      consultaModal.style.display = "none";

      showStatusModal(
        "Consulta realizada",
        "A consulta foi marcada como realizada.",
      );

      // Forçar atualização visual imediata
      atualizarDataForceRealizada(id);
    } catch (error) {
      console.error(error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor");
    }
  });
}

// Função para forçar visualmente como realizada
function atualizarDataForceRealizada(id) {
  const botoes = document.querySelectorAll(".botaoConsulta");
  botoes.forEach((botao) => {
    if (botao.dataset.id == id) {
      botao.classList.remove("consultaCard");
      botao.classList.add("consultaRealizada");

      // Atualizar o badge de status
      const badge = botao.querySelector(".status-badge");
      if (badge) {
        badge.classList.remove("status-agendada");
        badge.classList.add("status-realizada");
        badge.textContent = "realizada";
      }

      // Atualizar dataset
      botao.dataset.status = "realizada";

      console.log("Atualização visual forçada para ID:", id);
    }
  });
}

if (btnConfirmarCancelamento) {
  btnConfirmarCancelamento.addEventListener("click", async function () {
    const id = consultaModal.dataset.id;
    const motivo = motivoCancelamento.value.trim();
    const modo = cancelarModal.dataset.mode || "cancel";

    if (!motivo) {
      showToast(
        modo === "recusar"
          ? "Informe o motivo da recusa"
          : "Informe o motivo do cancelamento",
      );
      return;
    }

    try {
      const endpoint =
        modo === "recusar" ? `/recusarSessao/${id}` : `/cancelarSessao/${id}`;
      const { ok, dados } = await apiRequest(endpoint, "POST", {
        motivo: motivo,
      });

      if (!ok) {
        showStatusModal(
          "Erro",
          dados?.error ||
            (modo === "recusar"
              ? "Erro ao recusar solicitação"
              : "Erro ao cancelar"),
        );
        return;
      }

      cancelarModal.style.display = "none";
      cancelarModal.dataset.mode = "cancel";

      showStatusModal(
        modo === "recusar"
          ? "Solicitação recusada com sucesso!"
          : "Sessão cancelada!",
      );

      atualizarData();
    } catch (error) {
      console.error(error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor");
    }
  });
}

if (statusModalOk) {
  statusModalOk.addEventListener("click", function () {
    if (statusModal) statusModal.style.display = "none";
  });
}

if (btnSalvarReagendar) {
  btnSalvarReagendar.addEventListener("click", async function () {
    const id = consultaModal.dataset.id;
    const data = reagendarDate.value;
    const hora = reagendarTime.value;

    if (!data || !hora) {
      showToast("Preencha data e horário");
      return;
    }

    try {
      const { ok, dados } = await apiRequest(`/reagendarSessao/${id}`, "POST", {
        nova_data: data,
        nova_hora: hora,
      });

      if (!ok) {
        showStatusModal("Erro", dados?.error || "Erro ao reagendar");
        return;
      }

      reagendarModal.style.display = "none";

      showStatusModal(
        "Consulta reagendada",
        "A consulta foi reagendada com sucesso.",
      );

      atualizarData();
    } catch (error) {
      console.error(error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor");
    }
  });
}

if (btnSalvarEditar) {
  btnSalvarEditar.addEventListener("click", function () {
    const link = editarLink.value.trim() || "#";
    const observacoes = editarObservacoes.value.trim();

    const consultaLink = document.getElementById("consulta-modal-link");
    consultaLink.href = link;
    consultaLink.textContent = link !== "#" ? "Abrir link externo" : "Sem link";

    document.getElementById("consulta-modal-observacao").textContent =
      observacoes || "Sem observações";

    editarModal.style.display = "none";
    consultaModal.style.display = "flex";
  });
}

function formatDateDisplay(value) {
  if (!value) return "";
  const [ano, mes, dia] = value.split("-");
  const meses = {
    "01": "janeiro",
    "02": "fevereiro",
    "03": "março",
    "04": "abril",
    "05": "maio",
    "06": "junho",
    "07": "julho",
    "08": "agosto",
    "09": "setembro",
    10: "outubro",
    11: "novembro",
    12: "dezembro",
  };
  return `terça-feira, ${dia} de ${meses[mes] || ""} de ${ano}`;
}

function formatHorarioEnd(horario) {
  if (!horario) return "";
  const [hora, minuto] = horario.split(":");
  const horaNumero = Number(hora);
  if (Number.isNaN(horaNumero)) return horario;
  const fimHora = horaNumero + 1;
  return `${hora}:${minuto} - ${fimHora.toString().padStart(2, "0")}:${minuto}`;
}

document
  .getElementById("listaHorarios")
  .addEventListener("click", async function (event) {
    const button = event.target.closest(".botaoConsulta");
    if (!button) return;

    const id = button.dataset.id;
    consultaModal.dataset.id = id;

    consultaModal.style.display = "flex";

    document.getElementById("consulta-modal-nome").textContent =
      "Carregando...";
    document.getElementById("consulta-modal-data").textContent = "";
    document.getElementById("consulta-modal-horario").textContent = "";
    document.getElementById("consulta-modal-observacao").textContent = "";
    try {
      const { ok, dados } = await apiRequest(`/detalhesConsulta/${id}`);

      if (!ok) {
        console.error("Erro ao buscar detalhes da consulta:", dados);
        showStatusModal(
          "Erro",
          "Não foi possível carregar os detalhes da consulta. Tente novamente mais tarde.",
        );
        return;
      }

      function formatarData(data) {
        return new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      const sessao = dados.sessao;

      document.getElementById("consulta-modal-nome").textContent =
        sessao?.paciente?.usuario?.nome || "Paciente";

      document.getElementById("consulta-modal-data").textContent = formatarData(
        sessao.data_sessao,
      );

      document.getElementById("consulta-modal-horario").textContent =
        sessao.hora_inicio.slice(0, 5) + " - " + sessao.hora_fim.slice(0, 5);

      document.getElementById("consulta-modal-observacao").textContent =
        sessao.observacoes || "Sem observações";

      consultaModal.style.display = "flex";
      console.log(dados);

      consultaModal.dataset.status = sessao.status;
      if (sessao.status === "realizada") {
        document.querySelector(".btnReagendar").style.display = "inline-block";
        document.querySelector(".btnRealizada").style.display = "none";
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da consulta:", error);
    }

    if (!button) return;
  });

document
  .getElementById("btn-salvar-horario")
  .addEventListener("click", async function () {
    const dias = document.querySelectorAll(".horario-row");
    let agendas = [];

    dias.forEach((dia, index) => {
      const checkbox = dia.querySelector("input[type='checkbox']");
      const inputs = dia.querySelectorAll("input[type='time']");

      if (checkbox && checkbox.checked) {
        // Se for domingo (index 6), definir dia_semana como 0
        const diaSemana = index === 6 ? 0 : index + 1;

        agendas.push({
          dia_semana: diaSemana,
          hora_inicio: inputs[0].value,
          hora_fim: inputs[1].value,
        });
      }
    });

    if (agendas.length === 0) {
      showStatusModal(
        "Atenção",
        "Selecione pelo menos um dia e horário para configurar a agenda.",
      );
      return;
    }

    const { ok, dados } = await apiRequest("/configurarAgenda", "POST", {
      agendas: agendas,
    });

    if (!ok) {
      console.error("Erro ao salvar agenda:", dados);
      showStatusModal(
        "Erro",
        "Não foi possível salvar a agenda. Tente novamente mais tarde.",
      );
      return;
    }

    const almocoInicio = document.getElementById("almoco-inicio").value;
    const almocoFim = document.getElementById("almoco-fim").value;

    if (almocoInicio && almocoFim) {
      const { ok: okAlmoco, dados: dadosAlmoco } = await apiRequest(
        "/marcarEvento",
        "POST",
        {
          slug: "almoco",
          hora_inicio: almocoInicio,
          hora_fim: almocoFim,
        },
      );

      if (!okAlmoco) {
        console.error("Erro ao salvar horário de almoço:", dadosAlmoco);
        showStatusModal("Erro", "Não foi possível salvar o horário de almoço.");
        return;
      }
    }

    horarioModal.style.display = "none";
    showStatusModal(
      "Horários salvos",
      "A configuração de horários foi atualizada com sucesso.",
    );
    window.location.reload();
  });

window.onload = atualizarData;
