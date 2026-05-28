import { apiRequest } from "./api.js";

let modalFinanceiro = null;

let dataAtual = new Date();

document.addEventListener("DOMContentLoaded", () => {
  // ===== LOGOUT =====

  const modalLogout = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");

  // modal financeiro (inicializa aqui para garantir elemento disponível)
  modalFinanceiro = document.getElementById("modalFinanceiro");

  // botão fechar modal financeiro
  const btnFecharFinanceiro = document.getElementById("btnFecharFinanceiro");
  if (btnFecharFinanceiro) {
    btnFecharFinanceiro.addEventListener("click", () => {
      if (modalFinanceiro) modalFinanceiro.style.display = "none";
      if (modalFinanceiro) modalFinanceiro.dataset.id = "";
    });
  }

  // botão fechar (X) canto superior
  const btnCloseModalFinanceiro = document.getElementById("btnCloseModalFinanceiro");
  if (btnCloseModalFinanceiro) {
    btnCloseModalFinanceiro.addEventListener("click", () => {
      if (modalFinanceiro) modalFinanceiro.style.display = "none";
      if (modalFinanceiro) modalFinanceiro.dataset.id = "";
    });
  }

  // botão marcar como pago
  const btnMarcarPago = document.getElementById("btnMarcarPago");
  if (btnMarcarPago) {
    btnMarcarPago.addEventListener("click", async () => {
      const id = modalFinanceiro?.dataset.id;
      if (!id) return;

      const { ok, dados } = await apiRequest(`/marcarComoPago/${id}`, "POST");

      if (!ok) {
        console.error(dados);
        return;
      }

      if (modalFinanceiro) modalFinanceiro.style.display = "none";
      await atualizarFinanceiro();
    });
  }

  atualizarFinanceiro();

  openModalBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    modalLogout.style.display = "flex";
  });

  cancelBtn?.addEventListener("click", () => {
    modalLogout.style.display = "none";
  });

  confirmBtn?.addEventListener("click", async () => {
    try {
      await apiRequest("/logout", "POST");
    } catch (err) {
      console.error(err);
    }

    localStorage.removeItem("token");

    window.location.href = "./../pages/loginScreen.html";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modalLogout) {
      modalLogout.style.display = "none";
    }

    if (modalFinanceiro && event.target === modalFinanceiro) {
      modalFinanceiro.style.display = "none";
      modalFinanceiro.dataset.id = "";
    }
  });
});

// ===== CONTROLE DATA =====

document.getElementById("avancarDia")?.addEventListener("click", () => {
  dataAtual.setDate(dataAtual.getDate() + 1);
  atualizarFinanceiro();
});

document.getElementById("voltarDia")?.addEventListener("click", () => {
  dataAtual.setDate(dataAtual.getDate() - 1);
  atualizarFinanceiro();
});

// ===== ATUALIZAR TELA =====

async function atualizarFinanceiro() {
  try {
    const dataFormatada = dataAtual.toLocaleDateString("en-CA");

    atualizarTextoData();

    await carregarDashboard(dataFormatada);

    await listarPagamentos(dataFormatada);
  } catch (error) {
    console.error(error);
  }
}

function atualizarTextoData() {
  const hoje = new Date();

  const span = document.getElementById("diaFinanceiro");

  if (!span) return;

  if (dataAtual.toDateString() === hoje.toDateString()) {
    span.innerText = "Hoje";

    return;
  }

  span.innerText = dataAtual.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ===== DASHBOARD =====

async function carregarDashboard(data) {
  const { ok, dados } = await apiRequest(`/dashboardFinanceiro?data=${data}`);

  if (!ok) {
    console.error(dados);

    return;
  }

  const cards = document.querySelectorAll(".card-valor");

  if (cards.length >= 3) {
    cards[0].innerText = `R$ ${dados.faturamento}`;

    cards[1].innerText = `R$ ${dados.faturamento_mensal}`;

    cards[2].innerText = dados.pagas;

    cards[3].innerText = dados.pendentes;
  }
}

// ===== LISTAGEM =====

async function listarPagamentos(data) {
  const { ok, dados } = await apiRequest(`/listarPagamentos?data=${data}`);

  const container = document.getElementById("listaPagamentos");

  container.innerHTML = "";

  if (!ok || !dados.pagamentos.length) {
    container.innerHTML = `
      <tr>
        <td colspan="5">
          Nenhum pagamento encontrado
        </td>
      </tr>
    `;

    return;
  }

  dados.pagamentos.forEach((pagamento) => {
    const linha = document.createElement("tr");

    linha.classList.add("cardPagamento");

    linha.dataset.id = pagamento.id_pagamento;

    linha.innerHTML = `

      <td>
        ${pagamento.paciente.usuario.nome}
      </td>

      <td>
        ${new Date(pagamento.created_at).toLocaleDateString("pt-BR")}
        ${new Date(pagamento.created_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>

      <td>
        R$ ${pagamento.valor_total}
      </td>

      <td>

        <span class="badge ${pagamento.status_pagamento}">

          ${pagamento.status_pagamento}

        </span>

      </td>

      <td>

        <button class="btn-acao">

          Ver

        </button>

      </td>
    `;

    container.appendChild(linha);
  });
}

// ===== ABRIR MODAL =====

document
  .getElementById("listaPagamentos")
  ?.addEventListener("click", async (event) => {
    const card = event.target.closest(".cardPagamento");

    if (!card) return;

    const id = card.dataset.id;

    const { ok, dados } = await apiRequest(`/detalhesPagamento/${id}`);

    if (!ok) return;

    const pagamento = dados.pagamento;

    document.getElementById("modalPaciente").textContent =
      pagamento.paciente.usuario.nome;

    document.getElementById("modalValor").textContent =
      `R$ ${pagamento.valor_total}`;

    document.getElementById("modalStatus").textContent =
      pagamento.status_pagamento;

    // mostrar/ocultar ações conforme status
    const btnMarcar = document.getElementById("btnMarcarPago");
    const btnFechar = document.getElementById("btnFecharFinanceiro");

    const status = (pagamento.status_pagamento || "").toString().toLowerCase();

    if (status.includes("paga") || status.includes("pago")) {
      if (btnMarcar) btnMarcar.style.display = "none";
      if (btnFechar) btnFechar.focus();
    } else {
      if (btnMarcar) btnMarcar.style.display = "inline-block";
    }

    modalFinanceiro.dataset.id = pagamento.id_pagamento;
    if (modalFinanceiro) modalFinanceiro.dataset.id = pagamento.id_pagamento;

    if (modalFinanceiro) modalFinanceiro.style.display = "flex";
  });

// ===== MARCAR COMO PAGO =====

