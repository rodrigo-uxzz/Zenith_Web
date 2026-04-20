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
      window.location.href = "./pages/loginScreen.html";
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
});

document.getElementById("verAgenda").addEventListener("click", function () {
  window.location.href = "./pages/agendaScreen.html";
});

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
