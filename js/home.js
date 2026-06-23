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

  carregarDashboard();
  carregarNotificacoes();
  carregarProximasConsultas();
});

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

      // REAGENDAMENTO
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

      // CANCELAMENTO
      if (status === "cancelamento_solicitado") {
        const motivo =
          sessao.observacoes || sessao.motivo || "Motivo não informado";

        infoExtra = `
    <span class="notificacao-motivo">
      <span class="icone">
        <ion-icon name="alert-circle-outline"></ion-icon>
      </span>

      Motivo: ${motivo}
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

async function carregarDashboard() {
  const nomesMeses = [
    "",
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const nomesDias = ["", "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const response = await apiRequest("/dahsBoardPsicologo");

  if (!response.ok) {
    console.error(response.dados);
    return;
  }

  const data = response.dados;

  const pacientes = data.cards.total_pacientes;
  const consultasMes = data.cards.consultas_mes;
  const faturamentoTotal = data.cards.faturamentoTotal;
  const consultasDia = data.cards.consultas_hoje;

  document.getElementById("pacientes").textContent = pacientes;
  document.getElementById("consultas_mes").textContent = consultasMes;
  document.getElementById("faturamentoTotal").textContent =
    "R$" + faturamentoTotal;
  document.getElementById("consultasHoje").textContent = consultasDia;

  const faturamento = data.graficos.faturamento_mensal;

  new Chart(document.getElementById("faturamentoChart"), {
    type: "line",

    data: {
      labels: faturamento.map((item) => nomesMeses[item.mes]),

      datasets: [
        {
          data: faturamento.map((item) => item.total),

          borderColor: "#27c7c0",
          backgroundColor: "rgba(39,199,192,0.08)",

          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        x: {
          grid: {
            color: "#ececec",
          },
        },

        y: {
          beginAtZero: true,

          grid: {
            color: "#ececec",
          },
        },
      },
    },
  });

  const sessoes = data.graficos.consultas_por_semana;

  new Chart(document.getElementById("sessoesChart"), {
    type: "bar",

    data: {
      labels: sessoes.map((item) => nomesDias[item.dia]),

      datasets: [
        {
          data: sessoes.map((item) => item.total),

          backgroundColor: "rgba(157,121,255,0.75)",
          borderRadius: 12,
          borderSkipped: false,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },
        },

        y: {
          beginAtZero: true,

          ticks: {
            stepSize: 1,
          },

          grid: {
            color: "#ececec",
          },
        },
      },
    },
  });
}

// ===============================
// PRÓXIMAS CONSULTAS (apenas do dia atual)
// ===============================

async function carregarProximasConsultas() {
  const container = document.getElementById("container-proximas-consultas");
  if (!container) return;

  try {
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString("en-CA");

    const { ok, dados } = await apiRequest(
      `/consultasDoDia?data=${dataFormatada}&t=${Date.now()}`,
    );

    let todasConsultas = [];

    if (ok && dados.sessoes && Array.isArray(dados.sessoes)) {
      todasConsultas = dados.sessoes
        .filter((s) => s.sessao && !s.tipo && s.status_sessao === 'agendada')
        .map((s) => ({ ...s, data_sessao: dataFormatada }));
    }

    const sessoes = todasConsultas;

    if (sessoes.length === 0) {
      container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #999;">
          Nenhuma consulta agendada para hoje
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    sessoes.forEach((item) => {
      const sessao = item.sessao || {};
      const nome = sessao.paciente?.usuario?.nome || "Paciente";
      const fotoPerfil = sessao.paciente?.usuario?.foto_perfil
        ? `http://127.0.0.1:8000/Storage/${sessao.paciente?.usuario?.foto_perfil}`
        : null;
      const hora = item.hora_inicio || "--:--";
      const link = item.link || null;
      const dataSessao = item.data_sessao || "";

      const hojeFormatada = dataFormatada;
      const ehHoje = dataSessao === hojeFormatada;

      // Verifica se já chegou a hora
      let podeEntrar = false;
      if (ehHoje && link) {
        const [h, m] = hora.split(":");
        const horaConsulta = new Date();
        horaConsulta.setHours(Number(h), Number(m), 0, 0);
        podeEntrar = new Date() >= horaConsulta;
      }

      const infoHora = `<span class="hora">${hora.slice(0, 5)}</span>`;

      const div = document.createElement("div");
      div.classList.add("consulta");

      // Botão entrar ou aguarde
      let botaoHTML;
      if (podeEntrar && link) {
        botaoHTML = `
          <button class="btn" onclick="window.open('${link}', '_blank')">
            Entrar
            <img src="../img/open.svg" alt="Ícone Entrar" class="iconeC">
          </button>
        `;
      } else {
        botaoHTML = `<button class="btn secundario" disabled>Aguarde</button>`;
      }

      div.innerHTML = `
        <div class="iconConsulta">
          <span class="icone"></span>
        </div>
        <div>
          <strong>${nome}</strong>
          ${infoHora}
        </div>
        ${botaoHTML}
      `;

      container.appendChild(div);

      // Insere a foto (ou ícone padrão) via DOM, evitando problemas de escape de aspas no innerHTML
      const iconeSpan = div.querySelector(".iconConsulta .icone");
      if (iconeSpan) {
        if (fotoPerfil) {
          const img = document.createElement("img");
          img.src = fotoPerfil;
          img.alt = `Foto de ${nome}`;
          img.className = "fotoPaciente";
          img.onerror = function () {
            iconeSpan.innerHTML = '<ion-icon name="person-outline"></ion-icon>';
          };
          iconeSpan.appendChild(img);
        } else {
          iconeSpan.innerHTML = '<ion-icon name="person-outline"></ion-icon>';
        }
      }
    });
  } catch (error) {
    console.error("Erro ao carregar próximas consultas:", error);
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #999;">
        Erro ao carregar consultas
      </div>
    `;
  }
}