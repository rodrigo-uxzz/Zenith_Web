import { apiRequest } from "./api.js";

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

// Função centralizada para aplicar botões conforme status — usada em TODOS os modais
function aplicarBotoesStatus(status) {
  const actionsContainer = document.querySelector(".consulta-modal-actions");
  const modalHeader = document.querySelector(".consulta-modal-header");
  if (!actionsContainer || !modalHeader) return;

  const acaoPendente = actionsContainer.querySelector(".acao-pendente");
  const acaoAgendada = actionsContainer.querySelector(".acao-agendada");
  const btnEditarHeader = modalHeader.querySelector(".btnEditar");
  const btnReagendarBtn = actionsContainer.querySelector(".btnReagendar");
  const btnRealizadaBtn = actionsContainer.querySelector(".btnRealizada");
  const btnCanceladaBtn = actionsContainer.querySelector(".btnCancelada");

  // Esconde tudo primeiro
  [
    acaoPendente,
    acaoAgendada,
    btnEditarHeader,
    btnReagendarBtn,
    btnRealizadaBtn,
    btnCanceladaBtn,
  ].forEach((el) => {
    if (el) el.style.display = "none";
  });

  const s = status.toLowerCase();

  // Apenas solicitações VINDAS DO PACIENTE precisam de aprovação do psicólogo
  if (
    s.includes("pendente") ||
    s === "cancelamento_solicitado" ||
    s === "reagendamento_solicitado"
  ) {
    if (acaoPendente) acaoPendente.style.display = "flex";

  // Solicitações feitas PELO psicólogo: ele já agiu, aguarda o paciente — sem botões de ação
  } else if (s === "cancelamentopsicologo" || s === "reagendamentopsicologo") {
    // Nenhuma ação disponível, apenas visualização

  } else if (s === "agendada") {
    if (acaoAgendada) acaoAgendada.style.display = "flex";
    if (btnReagendarBtn) btnReagendarBtn.style.display = "block";
    if (btnRealizadaBtn) btnRealizadaBtn.style.display = "block";
    if (btnCanceladaBtn) btnCanceladaBtn.style.display = "block";
    if (btnEditarHeader) btnEditarHeader.style.display = "block";
  }
  // realizada, cancelada, recusada e qualquer outro: sem ação
}

// Modal de logout
document.addEventListener("DOMContentLoaded", function () {
  atualizarData();
  configurarFiltrosVisualizacao();
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
      if (!idSessao) {
        showToast("ID da sessão não encontrado");
        return;
      }
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
  if (modoVisualizacao === "semanal") {
    dataAtual.setDate(dataAtual.getDate() + 7);
    atualizarHeaderSemanal();
    carregarSemana();
  } else {
    dataAtual.setDate(dataAtual.getDate() + 1);
    atualizarData();
  }
}

function voltarDia() {
  if (modoVisualizacao === "semanal") {
    dataAtual.setDate(dataAtual.getDate() - 7);
    atualizarHeaderSemanal();
    carregarSemana();
  } else {
    dataAtual.setDate(dataAtual.getDate() - 1);
    atualizarData();
  }
}

function atualizarHeaderSemanal() {
  const dataCarbon = new Date(dataAtual);

  const diaSemana = dataCarbon.getDay();
  const inicioSemana = new Date(dataCarbon);
  inicioSemana.setDate(dataCarbon.getDate() - diaSemana);

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);

  const diaInicio = inicioSemana.getDate().toString().padStart(2, "0");
  const diaFim = fimSemana.getDate().toString().padStart(2, "0");

  const mes = fimSemana.toLocaleDateString("pt-BR", { month: "long" });
  const ano = fimSemana.getFullYear();

  document.getElementById("dia").innerText =
    `${diaInicio} - ${diaFim} de ${mes} de ${ano}`;
  document.getElementById("dia2").innerText =
    `${diaInicio} - ${diaFim} de ${mes} de ${ano}`;
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

        conteudo.dataset.id = item.sessao?.id_sessao;

        let status =
          item.sessao?.status || item.sessao?.status_sessao || "agendada";
        status = status.toLowerCase().trim();

        if (!status || status === "null" || status === "undefined") {
          status = "agendada";
        }

        conteudo.dataset.status = status;

        const nome = item.sessao?.paciente?.usuario?.nome || "Paciente";

        const isRealizada = status.includes("realiz");
        const isPendente = status.includes("pendente");
        // Verificar se é cancelamento solicitado (pendente de aprovação) - paciente OU psicólogo
        const isCancelamentoSolicitado = status === "cancelamento_solicitado"; // só paciente
        
        const isCancelamentoPsicologo = status === "cancelamentopsicologo"; // só psicólogo

        const isReagendadaPaciente = status.includes(
          "reagendamento_solicitado",
        ); // só paciente

        const isReagendadaPsicologo = status === "reagendamentopsicologo"; // só psicólogo
        conteudo.classList.remove("consultaCard");
        if (isRealizada) {
          conteudo.classList.add("consultaRealizada");
        } else if (isPendente) {
          conteudo.classList.add("consultaPendente");
        } else if (isCancelamentoPsicologo || isReagendadaPsicologo) {
          conteudo.classList.add("consultaPendente"); // amarelo
        } else if (isCancelamentoSolicitado) {
          conteudo.classList.add("consultaCancelamentoSolicitado"); // vermelho
        } else if (isReagendadaPaciente) {
          conteudo.classList.add("consultaReagendamentoSolicitado"); // azul
        } else {
          conteudo.classList.add("consultaCard");
        }

        let statusTexto = status.charAt(0).toUpperCase() + status.slice(1);
        let statusBadgeClasse = status;

        if (status === "cancelamentopsicologo") {
          statusTexto = "Aguardando Cancelamento";
          statusBadgeClasse = "aguardando-cancelamento";
        } else if (status === "reagendamentopsicologo") {
          statusTexto = "Aguardando Reagendamento";
          statusBadgeClasse = "aguardando-reagendamento";
        } else if (status.includes("cancelamento_solicitado")) {
          statusTexto = "Cancelamento Solicitado";
        } else if (status.includes("cancel")) {
          statusTexto = "Cancelada";
        } else if (status.includes("reagend") || status.includes("remarc")) {
          statusTexto = "Reagendamento Solicitado";
        }
        conteudo.style.position = "relative";
        conteudo.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <strong>${nome}</strong>
            <span>${item.hora_inicio.slice(0, 2) + "h"}</span>
          </div>
          <span 
            class="status-badge status-${statusBadgeClasse}"
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

  // Passa ID e status
  consultaModal.dataset.id = button.dataset.id;
  consultaModal.dataset.status = button.dataset.status || "agendada";

  document.getElementById("consulta-modal-nome").textContent = nome;
  document.getElementById("consulta-modal-data").textContent = data;
  document.getElementById("consulta-modal-horario").textContent = horario;

  // Link será preenchido pelo detalhesConsulta ao clicar
  const consultaLink = document.getElementById("consulta-modal-link");
  consultaLink.href = "#";
  consultaLink.textContent = "Carregando...";

  document.getElementById("consulta-modal-observacao").textContent =
    "Carregando...";

  const status = (button.dataset.status || "agendada").toLowerCase();
  aplicarBotoesStatus(status);

  if (actionsContainer && modalHeader) {
    const acaoPendente = actionsContainer.querySelector(".acao-pendente");
    const acaoAgendada = actionsContainer.querySelector(".acao-agendada");
    const btnEditar = modalHeader.querySelector(".btnEditar");
    const btnReagendar = actionsContainer.querySelector(".btnReagendar");
    const btnRealizada = actionsContainer.querySelector(".btnRealizada");
    const btnCancelada = actionsContainer.querySelector(".btnCancelada");

    if (acaoPendente) acaoPendente.style.display = "none";
    if (acaoAgendada) acaoAgendada.style.display = "none";
    if (btnEditar) btnEditar.style.display = "none";
    if (btnReagendar) btnReagendar.style.display = "none";
    if (btnRealizada) btnRealizada.style.display = "none";
    if (btnCancelada) btnCancelada.style.display = "none";

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
  if (event.target === consultaModal) consultaModal.style.display = "none";
  if (event.target === reagendarModal) reagendarModal.style.display = "none";
  if (event.target === editarModal) editarModal.style.display = "none";
  if (event.target === horarioModal) horarioModal.style.display = "none";
  if (event.target === confirmModal) confirmModal.style.display = "none";
  if (event.target === statusModal) statusModal.style.display = "none";
  if (event.target === cancelarModal) cancelarModal.style.display = "none";
});

const reagendarModal = document.getElementById("reagendar-modal");
const closeReagendarModal = document.getElementById("close-reagendar-modal");
const btnVoltarReagendar = document.getElementById("btn-voltar-reagendar");
const btnSalvarReagendar = document.getElementById("btn-salvar-reagendar");
const btnCancelar = document.querySelector(".btnCancelada");
const reagendarDate = document.getElementById("reagendar-date");
const reagendarTime = document.getElementById("reagendar-time");

// ══════════════════════════════════════════════════════════════════
//  PATCH — Modal Reagendar com seletor de data + horários disponíveis
//  Substitui o bloco existente que inicializa btnReagendar no agenda.js
// ══════════════════════════════════════════════════════════════════

// Estado interno do reagendamento
const reagendarState = {
  dataSelecionada: new Date(), // objeto Date da data exibida
  horarioSelecionado: null, // string "HH:MM"
  idSessao: null,
  idPsicologo: null, // preenchido ao abrir o modal
};

// ── Helpers de data ──────────────────────────────────────────────

function toLocalISO(date) {
  // "YYYY-MM-DD" sem conversão de timezone
  return date.toLocaleDateString("en-CA");
}

function nomeDiaSemana(date) {
  return date.toLocaleDateString("pt-BR", { weekday: "long" });
}

function nomeDiaMes(date) {
  const dia = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
  // "18 de maio" → "18 De Maio"
  return dia.replace(/ de /i, " De ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Abrir modal ───────────────────────────────────────────────────

async function abrirReagendarModal() {
  // Fecha modal de detalhes
  if (consultaModal) consultaModal.style.display = "none";

  // Data inicial = data atual da consulta (ou hoje)
  const dataTexto =
    document.getElementById("consulta-modal-data")?.textContent || "";
  reagendarState.dataSelecionada = parsePtBRDate(dataTexto) || new Date();
  reagendarState.horarioSelecionado = null;
  reagendarState.idSessao = consultaModal?.dataset?.id || null;

  // Tenta pegar idPsicologo do localStorage ou dataset
  reagendarState.idPsicologo = localStorage.getItem("id_psicologo") || null;

  atualizarHeaderReagendar();
  await carregarHorariosReagendar();

  if (reagendarModal) reagendarModal.style.display = "flex";
}

function parsePtBRDate(texto) {
  // Espera algo como "segunda-feira, 22 de junho de 2026"
  const meses = {
    janeiro: 0,
    fevereiro: 1,
    março: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11,
  };
  const match = texto.match(/(\d{1,2}) de (\w+) de (\d{4})/i);
  if (!match) return null;
  const [, dia, mesStr, ano] = match;
  const mes = meses[mesStr.toLowerCase()];
  if (mes === undefined) return null;
  return new Date(Number(ano), mes, Number(dia));
}

// ── Header (dia da semana + data) ─────────────────────────────────

function atualizarHeaderReagendar() {
  const d = reagendarState.dataSelecionada;
  document.getElementById("reagendar-dia-semana").textContent = nomeDiaSemana(
    d,
  ).replace(/\b\w/g, (c) => c.toUpperCase());
  document.getElementById("reagendar-dia-numero").textContent = nomeDiaMes(d);
}

// ── Carregar horários disponíveis ─────────────────────────────────

async function carregarHorariosReagendar() {
  const grid = document.getElementById("reagendar-horarios-grid");
  const feedbackEl = document.getElementById("reagendar-selecionado");
  if (!grid) return;

  grid.innerHTML = `<div class="reagendar-loading">Carregando horários...</div>`;
  if (feedbackEl) feedbackEl.style.display = "none";
  reagendarState.horarioSelecionado = null;

  const data = toLocalISO(reagendarState.dataSelecionada);
  const idSessao = reagendarState.idSessao;

  // Tenta buscar id_psicologo se não tiver ainda
  if (!reagendarState.idPsicologo) {
    try {
      const { ok, dados } = await apiRequest("/perfil");
      if (ok && dados?.psicologo?.id_psicologo) {
        reagendarState.idPsicologo = dados.psicologo.id_psicologo;
        localStorage.setItem("id_psicologo", reagendarState.idPsicologo);
      }
    } catch (_) {}
  }

  const idPsicologo = reagendarState.idPsicologo;

  if (!idPsicologo) {
    grid.innerHTML = `<div class="reagendar-sem-horarios">Não foi possível identificar o psicólogo.</div>`;
    return;
  }

  try {
    const url = `/horariosDisponiveis/${idPsicologo}?data=${data}${idSessao ? `&id_sessao=${idSessao}` : ""}`;
    const { ok, dados } = await apiRequest(url);

    if (!ok || !Array.isArray(dados) || dados.length === 0) {
      grid.innerHTML = `<div class="reagendar-sem-horarios">Nenhum horário disponível neste dia.</div>`;
      return;
    }

    grid.innerHTML = "";
    dados.forEach((hora) => {
      const btn = document.createElement("button");
      btn.className = "reagendar-slot";
      btn.textContent = hora;
      btn.addEventListener("click", () =>
        selecionarHorarioReagendar(hora, btn),
      );
      grid.appendChild(btn);
    });
  } catch (err) {
    console.error("Erro ao carregar horários:", err);
    grid.innerHTML = `<div class="reagendar-sem-horarios">Erro ao carregar horários.</div>`;
  }
}

// ── Selecionar horário ────────────────────────────────────────────

function selecionarHorarioReagendar(hora, btnEl) {
  // Remove seleção anterior
  document
    .querySelectorAll(".reagendar-slot.selected")
    .forEach((b) => b.classList.remove("selected"));
  btnEl.classList.add("selected");
  reagendarState.horarioSelecionado = hora;

  const feedbackEl = document.getElementById("reagendar-selecionado");
  const feedbackTexto = document.getElementById("reagendar-selecionado-texto");
  if (feedbackEl && feedbackTexto) {
    feedbackTexto.textContent = `${hora} selecionado`;
    feedbackEl.style.display = "flex";
  }
}

// ── Navegação de dias ─────────────────────────────────────────────

document
  .getElementById("reagendar-prev-dia")
  ?.addEventListener("click", async () => {
    reagendarState.dataSelecionada.setDate(
      reagendarState.dataSelecionada.getDate() - 1,
    );
    atualizarHeaderReagendar();
    await carregarHorariosReagendar();
  });

document
  .getElementById("reagendar-next-dia")
  ?.addEventListener("click", async () => {
    reagendarState.dataSelecionada.setDate(
      reagendarState.dataSelecionada.getDate() + 1,
    );
    atualizarHeaderReagendar();
    await carregarHorariosReagendar();
  });

// ── Abrir via botão Reagendar ─────────────────────────────────────

const btnReagendar = document.querySelector(".btnReagendar");
if (btnReagendar) {
  btnReagendar.addEventListener("click", function () {
    abrirReagendarModal();
  });
}

// ── Fechar modal ──────────────────────────────────────────────────

document
  .getElementById("close-reagendar-modal")
  ?.addEventListener("click", () => {
    if (reagendarModal) reagendarModal.style.display = "none";
  });

document
  .getElementById("btn-voltar-reagendar")
  ?.addEventListener("click", () => {
    if (reagendarModal) reagendarModal.style.display = "none";
    if (consultaModal) consultaModal.style.display = "flex";
  });

// ── Salvar reagendamento ──────────────────────────────────────────

document
  .getElementById("btn-salvar-reagendar")
  ?.addEventListener("click", async function () {
    const id = reagendarState.idSessao;
    const data = toLocalISO(reagendarState.dataSelecionada);
    const hora = reagendarState.horarioSelecionado;

    if (!data || !hora) {
      showToast("Selecione um horário disponível");
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
      if (modoVisualizacao === "semanal") {
        carregarSemana();
      } else {
        atualizarData();
      }
    } catch (error) {
      console.error(error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor");
    }
  });

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

    try {
      const { ok, dados } = await apiRequest(`/sessaoRealizada/${id}`, "POST");
      if (!ok) {
        showStatusModal("Erro", dados?.error || "Erro na operação");
        return;
      }
      consultaModal.style.display = "none";
      showStatusModal(
        "Consulta realizada",
        "A consulta foi marcada como realizada.",
      );
      if (modoVisualizacao === "semanal") {
        carregarSemana();
      } else {
        atualizarData();
      }
    } catch (error) {
      console.error(error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor");
    }
  });
}

function atualizarDataForceRealizada(id) {
  const botoes = document.querySelectorAll(".botaoConsulta");
  botoes.forEach((botao) => {
    if (botao.dataset.id == id) {
      botao.classList.remove("consultaCard");
      botao.classList.add("consultaRealizada");
      const badge = botao.querySelector(".status-badge");
      if (badge) {
        badge.classList.remove("status-agendada");
        badge.classList.add("status-realizada");
        badge.textContent = "realizada";
      }
      botao.dataset.status = "realizada";
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
      if (modoVisualizacao === "semanal") {
        carregarSemana();
      } else {
        atualizarData();
      }
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
      if (modoVisualizacao === "semanal") {
        carregarSemana();
      } else {
        atualizarData();
      }
    } catch (error) {
      console.error(error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor");
    }
  });
}

if (btnSalvarEditar) {
  btnSalvarEditar.addEventListener("click", async function () {
    const link = editarLink.value.trim();
    const observacoes = editarObservacoes.value.trim();
    const id = consultaModal.dataset.id;

    if (!id) {
      showToast("ID da sessão não encontrado");
      return;
    }

    try {
      // Salva o link específico da sessão na API
      if (link) {
        const { ok, dados } = await apiRequest(`/link/sessao/${id}`, "PUT", {
          link_sessao: link,
        });

        if (!ok) {
          showToast(dados?.error || "Erro ao salvar link");
          return;
        }
      }

      // Atualiza o modal de detalhes visualmente
      const consultaLink = document.getElementById("consulta-modal-link");
      if (link) {
        consultaLink.href = link;
        consultaLink.textContent = "Abrir link externo";
      } else {
        consultaLink.href = "#";
        consultaLink.textContent = "Sem link";
      }

      document.getElementById("consulta-modal-observacao").textContent =
        observacoes || "Sem observações";

      editarModal.style.display = "none";
      consultaModal.style.display = "flex";
      showToast("✅ Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showToast("Erro ao salvar alterações");
    }
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

// Listener da lista diária — busca detalhes da API e aplica botões corretos
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
    document.getElementById("consulta-valor").textContent = "";
    document.getElementById("consulta-modal-observacao").textContent = "";

    // Esconde todos os botões enquanto carrega
    aplicarBotoesStatus("__carregando__");

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
      document.getElementById("consulta-valor").textContent =
        `R$ ${Number(sessao.valor).toFixed(2).replace(".", ",")}`;
      document.getElementById("consulta-modal-observacao").textContent =
        sessao.anotacoes || "Sem observações";

      const consultaLink = document.getElementById("consulta-modal-link");
      if (dados.link) {
        consultaLink.href = dados.link;
        consultaLink.textContent = "Abrir link externo";
      } else {
        consultaLink.href = "#";
        consultaLink.textContent = "Sem link cadastrado";
      }

      consultaModal.dataset.status = sessao.status_sessao;

      consultaModal.style.display = "flex";
      console.log(dados);

      if (sessao.status === "realizada") {
        document.querySelector(".btnReagendar").style.display = "inline-block";
        document.querySelector(".btnRealizada").style.display = "none";
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da consulta:", error);
    }
  });

const inputPreco = document.getElementById("preco_sessao");

if (inputPreco) {
  inputPreco.value = "0,00";

  inputPreco.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length === 0) {
      e.target.value = "0,00";
      return;
    }
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    valor = valor.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    e.target.value = valor;
  });

  inputPreco.addEventListener("blur", function () {
    if (
      inputPreco.value.trim() === "" ||
      inputPreco.value === "0" ||
      inputPreco.value === ","
    ) {
      inputPreco.value = "0,00";
    }
  });
}

document
  .getElementById("btn-salvar-horario")
  .addEventListener("click", async function () {
    const precoSessao = document
      .getElementById("preco_sessao")
      .value.replace(/\./g, "")
      .replace(",", ".");

    const dias = document.querySelectorAll(".horario-row");
    let agendas = [];

    dias.forEach((dia, index) => {
      const checkbox = dia.querySelector("input[type='checkbox']");
      const inputs = dia.querySelectorAll("input[type='time']");
      if (checkbox && checkbox.checked) {
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
      preco_sessao: precoSessao,
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

// MODO SEMANAL

let modoVisualizacao = "diario";

const DIAS_ORDEM = [1, 2, 3, 4, 5, 6, 0];

function configurarFiltrosVisualizacao() {
  const botoes = document.querySelectorAll(".filtros-bar .btn-filtro");
  botoes.forEach((botao) => {
    botao.addEventListener("click", function () {
      botoes.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const texto = this.textContent.trim().toLowerCase();
      modoVisualizacao = texto === "semanal" ? "semanal" : "diario";
      alternarVisualizacao();
    });
  });
}

function alternarVisualizacao() {
  const listaHorarios = document.getElementById("listaHorarios");
  const gradeWrapper = document.getElementById("gradeSemanalWrapper");

  if (modoVisualizacao === "semanal") {
    listaHorarios.style.display = "none";
    gradeWrapper.style.display = "block";
    atualizarHeaderSemanal();
    carregarSemana();
  } else {
    listaHorarios.style.display = "block";
    gradeWrapper.style.display = "none";
    atualizarData();
  }
}

async function carregarSemana() {
  const gradeContainer = document.getElementById("gradeSemanal");
  gradeContainer.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:#999;">Carregando semana...</div>`;

  try {
    const dataFormatada = dataAtual.toLocaleDateString("en-CA");
    const { ok, dados } = await apiRequest(
      `/psicologo/agenda/semanal?data=${dataFormatada}&t=${Date.now()}`,
    );

    if (!ok || !dados.semana) {
      gradeContainer.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:#999;">Erro ao carregar a semana</div>`;
      return;
    }

    renderizarGradeSemanal(dados.semana);
  } catch (error) {
    console.error("Erro ao carregar semana:", error);
    gradeContainer.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:#999;">Erro ao carregar a semana</div>`;
  }
}

function renderizarGradeSemanal(semana) {
  const gradeContainer = document.getElementById("gradeSemanal");
  gradeContainer.innerHTML = "";

  const diasPorWeekday = {};
  semana.forEach((dia) => {
    const dataObj = new Date(dia.data + "T00:00:00");
    diasPorWeekday[dataObj.getDay()] = { ...dia, dataObj };
  });

  const diasOrdenados = DIAS_ORDEM.map((wd) => diasPorWeekday[wd]).filter(
    Boolean,
  );

  const horariosSet = new Set();
  diasOrdenados.forEach((dia) => {
    dia.sessoes.forEach((s) => horariosSet.add(s.hora_inicio.slice(0, 5)));
  });
  const horarios = Array.from(horariosSet).sort();

  if (horarios.length === 0) {
    gradeContainer.innerHTML = `<div style="grid-column:1/-1; padding:40px; text-align:center; color:#999;">Nenhum horário configurado para esta semana</div>`;
    return;
  }

  const mapaPorDia = diasOrdenados.map((dia) => {
    const mapa = {};
    dia.sessoes.forEach((s) => {
      mapa[s.hora_inicio.slice(0, 5)] = s;
    });
    return mapa;
  });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Cabeçalho
  const cabecalhoVazio = document.createElement("div");
  cabecalhoVazio.classList.add("gradeCabecalho", "gradeCabecalhoHora");
  gradeContainer.appendChild(cabecalhoVazio);

  diasOrdenados.forEach((dia) => {
    const cab = document.createElement("div");
    cab.classList.add("gradeCabecalho");

    const ehHoje = dia.dataObj.toDateString() === hoje.toDateString();
    if (ehHoje) cab.classList.add("diaHoje");

    const nomeDiaAbrev = dia.weekday.split("-")[0].slice(0, 3);
    const dataFormatada = dia.dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    cab.innerHTML = `
      <span class="diaNome">${nomeDiaAbrev}</span>
      <span class="diaData">${dataFormatada}</span>
    `;
    gradeContainer.appendChild(cab);
  });

  // Linhas de horário
  horarios.forEach((hora) => {
    const labelHora = document.createElement("div");
    labelHora.classList.add("gradeHoraLabel");
    labelHora.textContent = hora;
    gradeContainer.appendChild(labelHora);

    diasOrdenados.forEach((dia, indexDia) => {
      const celula = document.createElement("div");
      celula.classList.add("gradeCelula");

      const item = mapaPorDia[indexDia][hora];

      if (!item) {
        celula.innerHTML = `<div class="gradeDisponivel"></div>`;
      } else if (item.tipo === "evento") {
        const isAlmoco = item.slug === "almoco";
        const nomeEvento = isAlmoco
          ? "🍽 Almoço"
          : "📌 " + (item.evento?.nome || "Bloqueado");
        const classeExtra = isAlmoco ? "gradeBloqueadoAlmoco" : "";
        celula.innerHTML = `<div class="gradeBloqueado ${classeExtra}">${nomeEvento}</div>`;
      } else if (item.sessao) {
        const status = (item.status_sessao || "agendada").toLowerCase();
        const nome = item.sessao?.paciente?.usuario?.nome || "Paciente";

        const btn = document.createElement("button");
        btn.classList.add("gradeCard", `grade-${status}`);
        btn.dataset.id = item.sessao.id_sessao;
        btn.dataset.status = status;
        btn.innerHTML = `
          <strong>${nome}</strong>
          <span>${hora}</span>
        `;
        celula.appendChild(btn);
      } else {
        celula.innerHTML = `<div class="gradeDisponivel"></div>`;
      }

      gradeContainer.appendChild(celula);
    });
  });

  gradeContainer.style.gridTemplateColumns = `80px repeat(${diasOrdenados.length}, minmax(140px, 1fr))`;
}

// Clique nos cards da grade semanal
document
  .getElementById("gradeSemanal")
  ?.addEventListener("click", async function (event) {
    const button = event.target.closest(".gradeCard");
    if (!button) return;

    const id = button.dataset.id;
    if (!id) return;

    consultaModal.dataset.id = id;
    consultaModal.style.display = "flex";

    document.getElementById("consulta-modal-nome").textContent =
      "Carregando...";
    document.getElementById("consulta-modal-data").textContent = "";
    document.getElementById("consulta-modal-horario").textContent = "";
    document.getElementById("consulta-valor").textContent = "";
    document.getElementById("consulta-modal-observacao").textContent = "";

    // Esconde todos os botões enquanto carrega
    aplicarBotoesStatus("__carregando__");

    try {
      const { ok, dados } = await apiRequest(`/detalhesConsulta/${id}`);

      if (!ok) {
        showStatusModal(
          "Erro",
          "Não foi possível carregar os detalhes da consulta.",
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
      console.log("STATUS:", sessao.status);
      console.log("SESSAO COMPLETA:", JSON.stringify(sessao));

      document.getElementById("consulta-modal-nome").textContent =
        sessao?.paciente?.usuario?.nome || "Paciente";
      document.getElementById("consulta-modal-data").textContent = formatarData(
        sessao.data_sessao,
      );
      document.getElementById("consulta-modal-horario").textContent =
        sessao.hora_inicio.slice(0, 5) + " - " + sessao.hora_fim.slice(0, 5);
      document.getElementById("consulta-valor").textContent =
        `R$ ${Number(sessao.valor).toFixed(2).replace(".", ",")}`;
      document.getElementById("consulta-modal-observacao").textContent =
        sessao.anotacoes || "Sem observações";

      const status = (
        sessao.status_sessao ||
        sessao.status ||
        "agendada"
      ).toLowerCase();
      consultaModal.dataset.status = status;

      aplicarBotoesStatus(status);
    } catch (error) {
      console.error("Erro ao carregar detalhes da consulta:", error);
      showStatusModal("Erro", "Erro ao comunicar com o servidor.");
    }
  });

configurarFiltrosVisualizacao();
