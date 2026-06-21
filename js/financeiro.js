import { apiRequest } from "./api.js";

let modalFinanceiro = null;
let modoFiltro = "diario"; // "diario" | "semanal"
let dataAtual = new Date();
dataAtual.setHours(12, 0, 0, 0);

// ===== AVATAR =====

function obterIniciais(nome) {
  if (!nome) return "??";
  const partes = nome.trim().split(" ");
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function obterCorAvatar(nome) {
  const cores = [
    "avatarRoxo",
    "avatarAmarelo",
    "avatarRosa",
    "avatarVerde",
    "avatarAzul",
  ];
  if (!nome) return cores[0];
  let soma = 0;
  for (let i = 0; i < nome.length; i++) soma += nome.charCodeAt(i);
  return cores[soma % cores.length];
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== LOGOUT =====
  const modalLogout = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");

  modalFinanceiro = document.getElementById("modalFinanceiro");

  // fechar modal financeiro
  document
    .getElementById("btnFecharFinanceiro")
    ?.addEventListener("click", fecharModalFinanceiro);
  document
    .getElementById("btnCloseModalFinanceiro")
    ?.addEventListener("click", fecharModalFinanceiro);

  // marcar como pago
  document
    .getElementById("btnMarcarPago")
    ?.addEventListener("click", async () => {
      const id = modalFinanceiro?.dataset.id;
      if (!id) return;

      const { ok, dados } = await apiRequest(`/marcarComoPago/${id}`, "POST");
      if (!ok) {
        console.error(dados);
        return;
      }

      fecharModalFinanceiro();
      await atualizarFinanceiro();
    });

  // ===== FILTROS DIÁRIO / SEMANAL =====
  document.querySelectorAll(".btn-filtro").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".btn-filtro")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      modoFiltro =
        btn.textContent.trim().toLowerCase() === "semanal"
          ? "semanal"
          : "diario";
      atualizarFinanceiro();
    });
  });

  // ===== BUSCA =====
  document
    .querySelector(".search-box input")
    ?.addEventListener("input", (e) => {
      const termo = e.target.value.toLowerCase().trim();
      document
        .querySelectorAll("#listaPagamentos tr.cardPagamento")
        .forEach((tr) => {
          const nome = tr.querySelector("td")?.textContent?.toLowerCase() || "";
          tr.style.display = nome.includes(termo) ? "" : "none";
        });
    });

  // ===== LOGOUT =====
  openModalBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    modalLogout.style.display = "flex";
  });

  cancelBtn?.addEventListener(
    "click",
    () => (modalLogout.style.display = "none"),
  );

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
    if (event.target === modalLogout) modalLogout.style.display = "none";
    if (modalFinanceiro && event.target === modalFinanceiro)
      fecharModalFinanceiro();
  });

  atualizarFinanceiro();
});

// ===== FECHAR MODAL =====
function fecharModalFinanceiro() {
  if (!modalFinanceiro) return;
  modalFinanceiro.style.display = "none";
  modalFinanceiro.dataset.id = "";
  const btnMarcar = document.getElementById("btnMarcarPago");
  if (btnMarcar) btnMarcar.style.display = "inline-block";
}

// ===== CONTROLE DATA =====
document.getElementById("avancarDia")?.addEventListener("click", () => {
  if (modoFiltro === "semanal") dataAtual.setDate(dataAtual.getDate() + 7);
  else dataAtual.setDate(dataAtual.getDate() + 1);
  atualizarFinanceiro();
});

document.getElementById("voltarDia")?.addEventListener("click", () => {
  if (modoFiltro === "semanal") dataAtual.setDate(dataAtual.getDate() - 7);
  else dataAtual.setDate(dataAtual.getDate() - 1);
  atualizarFinanceiro();
});

// ===== ATUALIZAR TELA =====
function formatarDataParaApi(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

async function atualizarFinanceiro() {
  const dataFormatada = formatarDataParaApi(dataAtual);
  atualizarTextoData();
  await carregarDashboard(dataFormatada);
  await listarPagamentos(dataFormatada);
}

function atualizarTextoData() {
  const hoje = new Date();
  const span = document.getElementById("diaFinanceiro");
  if (!span) return;

  if (modoFiltro === "semanal") {
    const inicio = new Date(dataAtual);
    inicio.setDate(dataAtual.getDate() - dataAtual.getDay());
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    span.innerText = `${inicio.toLocaleDateString("pt-BR")} – ${fim.toLocaleDateString("pt-BR")}`;
    return;
  }

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

// ===== PARSEAR / FORMATAR =====
function parsearValor(valor) {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  const texto = String(valor ?? "")
    .trim()
    .replace(/[R$\s]/g, "");
  if (!texto) return 0;
  if (texto.includes(",") || texto.includes(".")) {
    if (texto.includes(",") && texto.includes("."))
      return Number(texto.replace(/\./g, "").replace(",", "."));
    if (texto.includes(",")) return Number(texto.replace(",", "."));
    const partes = texto.split(".");
    if (partes.length === 2 && partes[1].length <= 2) return Number(texto);
    return Number(texto.replace(/\./g, ""));
  }
  return Number(texto);
}

function formatarMoeda(valor) {
  return parsearValor(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizarStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("pag") || s.includes("quitad")) return "pago";
  if (s.includes("pend") || s.includes("aberto") || s.includes("aguard"))
    return "pendente";
  return s;
}

// ===== CALCULAR RESUMO =====
function calcularResumoFinanceiro(pagamentos, dataSelecionada) {
  const dataRef = new Date(`${dataSelecionada}T12:00:00`);
  const inicioMes = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1);
  const fimMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 1);

  // para semanal
  const inicioSemana = new Date(dataRef);
  inicioSemana.setDate(dataRef.getDate() - dataRef.getDay());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 7);

  let faturamentoDia = 0,
    faturamentoMes = 0,
    pagas = 0,
    pendentes = 0;

  const psicologoId = String(localStorage.getItem("psicologoId") || "").trim();

  (pagamentos || []).forEach((p) => {
    const idP = String(
      p.id_psicologo ||
        p.psicologo_id ||
        p.psicologo?.id ||
        p.sessao?.id_psicologo ||
        "",
    ).trim();
    if (psicologoId && idP && idP !== psicologoId) return;

    const dataP = new Date(
      p.created_at || p.data || p.data_pagamento || dataSelecionada,
    );
    const valor = parsearValor(p.valor_total ?? p.valor ?? p.valor_pago ?? 0);
    const status = normalizarStatus(p.status_pagamento || p.status || "");
    const estaPago = status === "pago";
    const estaPendente = status === "pendente";

    const estaNoDia = dataP.toDateString() === dataRef.toDateString();
    const estaNoMes = dataP >= inicioMes && dataP < fimMes;
    const estaNaSemana = dataP >= inicioSemana && dataP < fimSemana;

    if (estaPago) {
      if (modoFiltro === "semanal") {
        if (estaNaSemana) faturamentoDia += valor; // "dia" vira "semana" no card
      } else {
        if (estaNoDia) faturamentoDia += valor;
      }
      if (estaNoMes) faturamentoMes += valor;
      pagas += 1;
    } else if (estaPendente) {
      pendentes += 1;
    }
  });

  return { faturamentoDia, faturamentoMes, pagas, pendentes };
}

// ===== DASHBOARD =====
async function carregarDashboard(data) {
  const endpoint =
    modoFiltro === "semanal"
      ? `/dashboardFinanceiroSemanal?data=${data}`
      : `/dashboardFinanceiro?data=${data}`;

  const { ok, dados } = await apiRequest(endpoint);
  if (!ok) return;

  document.getElementById("cardFaturamentoDiaValor").innerText =
    `R$ ${formatarMoeda(dados.faturamento)}`;

  document.getElementById("cardFaturamentoMensalValor").innerText =
    `R$ ${formatarMoeda(dados.faturamento_mensal)}`;

  document.getElementById("cardConsultasPagasValor").innerText = dados.pagas;

  document.getElementById("cardConsultasPendentesValor").innerText =
    dados.pendentes;
}
// ===== LISTAGEM =====
async function listarPagamentos(data) {
  const endpoint =
    modoFiltro === "semanal"
      ? `/listarPagamentosSemanal?data=${data}`
      : `/listarPagamentos?data=${data}`;

  const { ok, dados } = await apiRequest(endpoint);
  const container = document.getElementById("listaPagamentos");
  container.innerHTML = "";

  if (!ok || !dados?.pagamentos?.length) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#888;">Nenhum pagamento encontrado</td></tr>`;
    return;
  }

  dados.pagamentos.forEach((pagamento) => {
    const linha = document.createElement("tr");
    linha.classList.add("cardPagamento");
    linha.dataset.id = pagamento.id_pagamento;

    const valorFormatado = formatarMoeda(
      pagamento.valor_total ?? pagamento.valor ?? pagamento.valor_pago ?? 0,
    );
    const statusNorm = normalizarStatus(
      pagamento.status_pagamento || pagamento.status || "",
    );
    const labelStatus = statusNorm === "pago" ? "Pago" : "Pendente";

    // Por isso:
    const nomePaciente = pagamento.paciente?.usuario?.nome ?? "—";
    const iniciais = obterIniciais(nomePaciente);
    const corAvatar = obterCorAvatar(nomePaciente);

    // Formata data corretamente
    const dataSessao = pagamento.sessao?.data_sessao
      ? new Date(pagamento.sessao.data_sessao + "T00:00:00").toLocaleDateString(
          "pt-BR",
        )
      : "—";

    // Formata hora corretamente (vem como "08:00:00")
    const horaInicio = pagamento.sessao?.hora_inicio
      ? pagamento.sessao.hora_inicio.substring(0, 5)
      : "—";

    linha.innerHTML = `
      <td>
        <span class="nome-paciente-tabela">
          <span class="avatar-paciente-tabela ${corAvatar}">${iniciais}</span>
          ${nomePaciente}
        </span>
      </td>
      <td>${dataSessao} ${horaInicio}</td>
      <td>R$ ${valorFormatado}</td>
      <td><span class="badge ${statusNorm}">${labelStatus}</span></td>
      <td><button class="btn-acao">Ver</button></td>
    `;

    container.appendChild(linha);
  });
}
document
  .getElementById("listaPagamentos")
  ?.addEventListener("click", async (event) => {
    const card = event.target.closest(".cardPagamento");
    if (!card) return;

    try {
      const id = card.dataset.id;

      const { ok, dados } = await apiRequest(`/detalhesPagamento/${id}`);
      if (!ok) return;

      const pagamento = dados.pagamento; // ✅ SÓ UMA VEZ

      const statusNorm = normalizarStatus(
        pagamento.status_pagamento || pagamento.status || "",
      );

      // HEADER
      document.getElementById("modalPaciente").textContent =
        pagamento.paciente?.usuario?.nome ?? "—";

      document.getElementById("modalData").textContent = new Date(
        pagamento.created_at,
      ).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // DETALHES
      document.getElementById("modalValor").textContent =
        `R$ ${formatarMoeda(pagamento.valor_total ?? pagamento.valor ?? 0)}`;

      document.getElementById("modalStatus").textContent =
        statusNorm === "pago" ? "Pago" : "Pendente";

      // COMPROVANTE
      const respostaComprovante = await apiRequest(`/verComprovante/${id}`);

      let urlComprovante = null;

      if (respostaComprovante.ok) {
        urlComprovante = respostaComprovante.dados.comprovante;
      }

      const comprovanteArea = document.getElementById("comprovanteArea");
      const comprovanteBotoes = document.getElementById("comprovanteBotoes");

      if (urlComprovante) {
        const nomeArquivo = urlComprovante.split("/").pop();

        comprovanteArea.innerHTML = `
    <ion-icon name="document-outline"></ion-icon>
    <p>${nomeArquivo}</p>
  `;
        comprovanteBotoes.style.display = "flex";

        document.getElementById("btnVisualizarComprovante").onclick = () =>
          window.open(urlComprovante, "_blank");

        document.getElementById("btnBaixarComprovante").onclick = async () => {
          try {
            const response = await fetch(urlComprovante);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = nomeArquivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          } catch (err) {
            console.error("Erro ao baixar comprovante:", err);
          }
        };
      } else {
        comprovanteArea.innerHTML = `
          <ion-icon name="document-outline"></ion-icon>
          <p>Nenhum comprovante anexado</p>
        `;
        comprovanteBotoes.style.display = "none";
      }

      // BOTÃO PAGAMENTO
      const btnMarcar = document.getElementById("btnMarcarPago");
      if (btnMarcar) {
        btnMarcar.style.display =
          statusNorm === "pago" ? "none" : "inline-block";
      }

      // ABRIR MODAL
      modalFinanceiro.dataset.id = pagamento.id_pagamento;
      modalFinanceiro.style.display = "flex";
    } catch (err) {
      console.error("Erro ao abrir modal:", err);
    }
  });
