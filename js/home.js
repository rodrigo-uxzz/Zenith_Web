import { apiRequest } from "./api.js";

//logout
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

document.addEventListener("DOMContentLoaded", function () {
  consultasHoje();
});

document.getElementById("verAgenda").addEventListener("click", function () {
  window.location.href = "agendaScreen.html";
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
