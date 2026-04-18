import { apiRequest } from "./api.js";

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
      textoData2 = "Hoje";
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
      `/consultasDoDia?data=${dataFormatada}`,
    );

    const container = document.getElementById("listaHorarios");
    container.innerHTML = "";

    const sessoes = dados.sessoes || [];

    if (!ok || !dados.sessoes || dados.sessoes.length === 0) {
      container.innerHTML = `<div class="semConsultas">Dia sem consultas</div>`;
      return;
    }

    sessoes.forEach((item) => {
      console.log(item);

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
      } else if (item.status_sessao !== "disponivel" && item.sessao) {
        conteudo = document.createElement("button");
        conteudo.classList.add("consultaCard", "botaoConsulta");

        conteudo.dataset.id = item.sessao?.id_sessao;

        const nome = item.sessao?.paciente?.usuario?.nome || "Paciente";

        conteudo.innerHTML = `
          <strong>${nome}</strong>
          <span>${item.hora_inicio.slice(0, 2) + "h"}</span>
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

const consultaButtons = document.querySelectorAll(".botaoConsulta");
const consultaModal = document.getElementById("consulta-modal");
const closeConsultaModal = document.getElementById("close-consulta-modal");
const btnEditar = document.querySelector(".btnEditar");
const editarModal = document.getElementById("editar-modal");
const closeEditarModal = document.getElementById("close-editar-modal");
const editarPaciente = document.getElementById("editar-paciente");
const editarData = document.getElementById("editar-data");
const editarHorario = document.getElementById("editar-horario");
const editarLink = document.getElementById("editar-link");
const editarObservacoes = document.getElementById("editar-observacoes");
const btnCancelarEditar = document.getElementById("btn-cancelar-editar");
const btnSalvarEditar = document.getElementById("btn-salvar-editar");
const btnConfigHorario = document.getElementById("btn-config-horario");
const horarioModal = document.getElementById("horario-modal");
const closeHorarioModal = document.getElementById("close-horario-modal");
const btnVoltarHorario = document.getElementById("btn-voltar-horario");
// const btnSalvarHorario = document.getElementById("btn-salvar-horario");
const confirmModal = document.getElementById("confirm-modal");
const closeConfirmModal = document.getElementById("close-confirm-modal");
const btnVoltarConfirm = document.getElementById("btn-voltar-confirm");
const btnConfirmAction = document.getElementById("btn-confirm-action");
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

  document.getElementById("consulta-modal-nome").textContent = nome;
  document.getElementById("consulta-modal-data").textContent = data;
  document.getElementById("consulta-modal-horario").textContent = horario;
  const consultaLink = document.getElementById("consulta-modal-link");
  consultaLink.href = link;
  consultaLink.textContent = "Abrir link externo";
  document.getElementById("consulta-modal-observacao").textContent =
    "Primeira consulta";

  consultaModal.style.display = "flex";
}

function showEditarModal() {
  const nome = document.getElementById("consulta-modal-nome").textContent;
  const data = document.getElementById("consulta-modal-data").textContent;
  const horario =
    document
      .getElementById("consulta-modal-horario")
      .textContent.split(" - ")[0] || "";
  const link = document.getElementById("consulta-modal-link").href || "";
  const observacoes =
    document.getElementById("consulta-modal-observacao").textContent || "";

  editarPaciente.value = nome;
  editarData.value = formatDateInput(data);
  editarHorario.value = horario;
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
  const title = document.querySelector("#confirm-modal h2");
  const text = document.querySelector("#confirm-modal p");
  btnConfirmAction.classList.remove("btnCancelEdit", "btnConfirm", "btnSalvar");
  if (type === "cancel") {
    title.textContent = "Confirmação";
    text.textContent = "Confirmar consulta cancelada?";
    btnConfirmAction.textContent = "Cancelar";
    btnConfirmAction.classList.add("btnCancelEdit");
  } else if (type === "done") {
    title.textContent = "Confirmação";
    text.textContent = "Confirmar consulta realizada?";
    btnConfirmAction.textContent = "Confirmar";
    btnConfirmAction.classList.add("btnConfirm");
  }
  confirmModal.style.display = "flex";
}

if (btnCancelar) {
  btnCancelar.addEventListener("click", function () {
    showConfirmModal("cancel");
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

if (btnConfirmAction) {
  btnConfirmAction.addEventListener("click", function () {
    confirmModal.style.display = "none";
    if (confirmType === "cancel") {
      consultaModal.style.display = "none";
      showStatusModal(
        "Consulta cancelada",
        "A consulta foi cancelada com sucesso.",
      );
    } else if (confirmType === "done") {
      consultaModal.style.display = "none";
      showStatusModal(
        "Consulta realizada",
        "A consulta foi realizada com sucesso.",
      );
    }
  });
}

if (statusModalOk) {
  statusModalOk.addEventListener("click", function () {
    if (statusModal) statusModal.style.display = "none";
  });
}

if (btnSalvarReagendar) {
  btnSalvarReagendar.addEventListener("click", function () {
    reagendarModal.style.display = "none";
    showStatusModal(
      "Consulta reagendada",
      "A consulta foi reagendada com sucesso.",
    );
  });
}

if (btnSalvarEditar) {
  btnSalvarEditar.addEventListener("click", function () {
    const nome = editarPaciente.value.trim() || "Consulta";
    const data = formatDateDisplay(editarData.value);
    const horario = editarHorario.value;
    const link = editarLink.value.trim() || "#";
    const observacoes = editarObservacoes.value.trim();

    document.getElementById("consulta-modal-nome").textContent = nome;
    document.getElementById("consulta-modal-data").textContent = data;
    document.getElementById("consulta-modal-horario").textContent =
      `${horario} - ${formatHorarioEnd(horario)}`;
    const consultaLink = document.getElementById("consulta-modal-link");
    consultaLink.href = link;
    consultaLink.textContent =
      link && link !== "#" ? "Abrir link externo" : "Sem link";
    document.getElementById("consulta-modal-observacao").textContent =
      observacoes;

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
    } catch (error) {
      console.error("Erro ao carregar detalhes da consulta:", error);
    }

    if (!button) return;
  });

// logout
document
  .getElementById("sair")
  .addEventListener("click", async function (event) {
    event.preventDefault();
    if (!confirm("Tem certeza que deseja sair?")) return;

    try {
      const { ok, dados } = await apiRequest("/logout", "POST");

      if (!ok) {
        console.warn("erro ao deslogar api", dados);
      }
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("token");
    window.location.href = "loginScreen.html";
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
        agendas.push({
          dia_semana: index + 1,
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
