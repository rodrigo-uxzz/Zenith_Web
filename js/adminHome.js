import { apiRequest } from "./api.js";

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

  const response = await apiRequest("/dashboard");

  if (!response.ok) {
    console.error(response.dados);
    return;
  }

  const data = response.dados;

  // =========================
  // USUÁRIOS
  // =========================

  const usuarios = data.graficos.usuarios_por_mes;

  new Chart(document.getElementById("usuariosChart"), {
    type: "line",
    data: {
      labels: usuarios.map((item) => nomesMeses[item.mes]),
      datasets: [
        {
          data: usuarios.map((item) => item.total),
          borderColor: "#52D6CF",
          backgroundColor: "#52d6cf1f",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  // =========================
  // PSICÓLOGOS
  // =========================

  const psicologos = data.graficos.psicologos_por_mes;

  new Chart(document.getElementById("psicologosChart"), {
    type: "line",
    data: {
      labels: psicologos.map((item) => nomesMeses[item.mes]),
      datasets: [
        {
          data: psicologos.map((item) => item.total),
          borderColor: "#9D79FF",
          backgroundColor: "#9d79ff26",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });

  // =========================
  // SESSÕES
  // =========================

  const sessoes = data.graficos.sessoes_por_mes;

  new Chart(document.getElementById("sessoesChart"), {
    type: "bar",

    data: {
      labels: nomesMeses.slice(1),

      datasets: [
        {
          label: "Agendadas",
          data: sessoes.map((item) => item.agendadas),

          backgroundColor: "#9D79FF",
          borderRadius: 10,
        },

        {
          label: "Realizadas",
          data: sessoes.map((item) => item.realizadas),

          backgroundColor: "#52D6CF",
          borderRadius: 10,
        },
      ],
    },

    options: {
      responsive: true,

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
            color: "rgba(0,0,0,0.05)",
          },
        },
      },
    },
  });

  // =========================
  // FATURAMENTO
  // =========================

  const faturamento = data.graficos.faturamento_mensal;
  const receitaTotal = data.cards.receita_total;

  const meses = [
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

  const faturamentoMeses = faturamento.map((item) => parseFloat(item.total));

  new Chart(document.getElementById("faturamentoChart"), {
    type: "line",

    data: {
      labels: meses,

      datasets: [
        {
          data: faturamentoMeses,

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
  document.getElementById("total").textContent = "R$" + receitaTotal;
}

carregarDashboard();

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
        const { ok, dados } = await apiRequest("/logoutAdmin", "POST");

        if (!ok) {
          console.warn("Erro ao deslogar da API", dados);
        }
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }

      // Limpar token e redirecionar
      localStorage.removeItem("token");
      window.location.href = "./../pages/adminLogin.html";
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});
