import { apiRequest } from "./api.js";

const state = {
  psicologos: [],
  filtroStatus: "todas",
  busca: "",
  psicologoAberto: null,
  especialidadesMap: {},
};

const elementos = {
  totalCount: null,
  activeCount: null,
  pendingCount: null,
  onlineCount: null,
  searchInput: null,
  listContainer: null,
  filterButtons: [],
  pendingModal: null,
  closePendingModal: null,
  modalName: null,
  modalCrp: null,
  modalCpf: null,
  modalEmail: null,
  modalPhone: null,
  modalDegree: null,
  modalExperience: null,
  modalBio: null,
  modalActions: null,
  modalAccept: null,
  modalReject: null,
};

const dadosMock = [
  {
    nome: "Dra. Ana Paula Silva",
    crp: "06/123456",
    cpf: "123.456.789-00",
    status: "pendente",
    online: false,
    especialidade: "Psicologia Clinica",
  },
  {
    nome: "Dr. Carlos Silva",
    crp: "01/234567",
    cpf: "111.222.333-44",
    status: "pendente",
    online: false,
    especialidade: "Psicologia Infantil",
  },
  {
    nome: "Dra. Mariana Costa",
    crp: "08/345678",
    cpf: "222.333.444-55",
    status: "ativo",
    online: true,
    especialidade: "Psicologia Organizacional",
  },
  {
    nome: "Dr. Roberto Oliveira",
    crp: "03/456789",
    cpf: "333.444.555-66",
    status: "ativo",
    online: true,
    especialidade: "Psicologia Clinica",
  },
  {
    nome: "Dra. Juliana Ferreira",
    crp: "02/567890",
    cpf: "444.555.666-77",
    status: "ativo",
    online: false,
    especialidade: "Psicologia Escolar",
  },
  {
    nome: "Dra. Camila Rocha",
    crp: "04/678901",
    cpf: "555.666.777-88",
    status: "ativo",
    online: true,
    especialidade: "Psicologia Familiar",
  },
];

function obterElemento(id) {
  return document.getElementById(id);
}

function inicializarElementos() {
  elementos.totalCount = obterElemento("totalCount");
  elementos.activeCount = obterElemento("activeCount");
  elementos.pendingCount = obterElemento("pendingCount");
  elementos.onlineCount = obterElemento("onlineCount");
  elementos.searchInput = obterElemento("searchInput");
  elementos.listContainer = obterElemento("psychologistsList");
  elementos.filterButtons = Array.from(
    document.querySelectorAll(".search-box .btn"),
  );
  elementos.pendingModal = obterElemento("pending-modal");
  elementos.closePendingModal = obterElemento("close-pending-modal");
  elementos.modalName = obterElemento("pending-modal-name");
  elementos.modalCrp = obterElemento("pending-modal-crp");
  elementos.modalCpf = obterElemento("pending-modal-cpf");
  elementos.modalEmail = obterElemento("pending-modal-email");
  elementos.modalPhone = obterElemento("pending-modal-phone");
  elementos.modalDegree = obterElemento("pending-modal-degree");
  elementos.modalExperience = obterElemento("pending-modal-experience");
  elementos.modalBio = obterElemento("pending-modal-bio");
  elementos.modalActions = document.querySelector(".pending-actions");
  elementos.modalAccept = obterElemento("pending-accept");
  elementos.modalReject = obterElemento("pending-reject");
}

function configurarEventos() {
  if (elementos.searchInput) {
    elementos.searchInput.addEventListener("input", (event) => {
      state.busca = event.target.value.toLowerCase().trim();
      renderizarLista();
    });
  }

  elementos.filterButtons.forEach((botao) => {
    botao.addEventListener("click", () => {
      elementos.filterButtons.forEach((btn) => btn.classList.remove("active"));
      botao.classList.add("active");
      state.filtroStatus = botao.dataset.status || "todas";
      renderizarLista();
    });
  });

  if (elementos.closePendingModal) {
    elementos.closePendingModal.addEventListener("click", fecharModalPendente);
  }

  if (elementos.pendingModal) {
    elementos.pendingModal.addEventListener("click", (event) => {
      if (event.target === elementos.pendingModal) {
        fecharModalPendente();
      }
    });
  }

  if (elementos.listContainer) {
    elementos.listContainer.addEventListener("click", (event) => {
      const card = event.target.closest(".person");
      if (
        !card ||
        !elementos.listContainer.contains(card) ||
        !card.dataset.psicologoId
      ) {
        return;
      }

      const psicologo = state.psicologos.find(
        (item) => item.id === card.dataset.psicologoId,
      );
      if (psicologo) {
        abrirModalPendente(psicologo);
      }
    });
  }

  if (elementos.modalAccept) {
    elementos.modalAccept.addEventListener("click", () => {
      if (state.psicologoAberto) {
        handleModalAccept(state.psicologoAberto);
      }
    });
  }

  if (elementos.modalReject) {
    elementos.modalReject.addEventListener("click", () => {
      if (state.psicologoAberto) {
        handleModalReject(state.psicologoAberto);
      }
    });
  }
}

async function carregarPsicologos() {
  await carregarEspecialidades();

  let dados = [];

  try {
    const resposta = await apiRequest("/psicologos", "GET");

    const payload =
      resposta.dados?.psicologos?.data ||
      resposta.dados?.psicologos ||
      resposta.dados?.data ||
      resposta.dados ||
      [];

    dados = Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.warn("Erro API ao carregar psicólogos:", error);
  }

  const lista = dados.length ? dados : dadosMock;
  state.psicologos = lista.map(mapearPsicologo);

  atualizarContadores();
  renderizarLista();
}

async function carregarEspecialidades() {
  try {
    const resposta = await apiRequest("/especialidades", "GET");
    const payload =
      resposta.dados?.especialidades?.data ||
      resposta.dados?.especialidades ||
      resposta.dados?.data ||
      resposta.dados ||
      [];

    const especialidades = Array.isArray(payload) ? payload : [];

    state.especialidadesMap = especialidades.reduce((map, item) => {
      const id = item.id_especialidade || item.id;
      if (id != null) {
        map[id] =
          item.nome ||
          item.nome_especialidade ||
          item.especialidade ||
          item.title;
      }
      return map;
    }, {});
  } catch (error) {
    console.warn("Erro API ao carregar especialidades:", error);
    state.especialidadesMap = {};
  }
}

function mapearPsicologo(item) {
  const statusBruto = (item.status || item.status_psicologo || "")
    .toString()
    .toLowerCase();

  let status = "ativo";
  if (statusBruto.includes("pendente")) {
    status = "pendente";
  }

  return {
    id: item.id_psicologo || item.id || Math.random().toString(36).slice(2),

    nome: item.usuario?.nome || item.usuario?.name || "Sem nome",

    crp: item.crp || "--",

    // 🔥 CPF vem do USER
    cpf: item.usuario?.cpf || "--",

    status,

    online: Boolean(item.online),

    // 🔥 formação vem direto do psicólogo
    formacao: item.grau_formacao || "Não informado",

    // 🔥 especialidades (ARRAY)
    especialidade: formatarEspecialidades(item.especialidades),

    email: item.usuario?.email || "Não informado",
    telefone: item.usuario?.telefone || "Não informado",

    experiencia: item.experiencia || "Não informado",

    sobre: item.biografia || "Sem descrição adicional.",
  };
}

function formatarEspecialidades(especialidades) {
  if (!especialidades) {
    return "Sem especialidade";
  }

  if (typeof especialidades === "string") {
    try {
      especialidades = JSON.parse(especialidades);
    } catch {
      return especialidades || "Sem especialidade";
    }
  }

  if (!Array.isArray(especialidades)) {
    return "Sem especialidade";
  }

  const nomes = especialidades
    .map((item) => {
      if (!item && item !== 0) return null;

      if (typeof item === "string" || typeof item === "number") {
        return (
          state.especialidadesMap[item] ||
          state.especialidadesMap[String(item)] ||
          String(item)
        );
      }

      const id = item.id_especialidade || item.id;
      const nome = item.nome || item.especialidade || item.nome_especialidade;

      if (nome) {
        return nome;
      }

      if (id != null) {
        return (
          state.especialidadesMap[id] ||
          state.especialidadesMap[String(id)] ||
          null
        );
      }

      return null;
    })
    .filter(Boolean);

  return nomes.length ? nomes.join(", ") : "Sem especialidade";
}

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

async function apiAprovarPsicologo(psicologo) {
  if (!psicologo?.id) {
    showToast("ID do psicólogo não encontrado.");
    return false;
  }

  try {
    const { ok, dados } = await apiRequest(
      `/aprovarPsicologo/${encodeURIComponent(psicologo.id)}`,
      "POST",
    );

    if (!ok) {
      showToast(dados?.error || "Erro ao aprovar psicólogo.");
      return false;
    }

    aceitarPsicologo(psicologo);
    showToast("Psicólogo aprovado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro API ao aprovar psicólogo:", error);
    showToast("Erro ao aprovar psicólogo.");
    return false;
  }
}

async function apiRejeitarPsicologo(psicologo) {
  if (!psicologo?.id) {
    showToast("ID do psicólogo não encontrado.");
    return false;
  }

  try {
    const { ok, dados } = await apiRequest(
      `/rejeitarPsicologo/${encodeURIComponent(psicologo.id)}`,
      "POST",
    );

    if (!ok) {
      showToast(dados?.error || "Erro ao rejeitar psicólogo.");
      return false;
    }

    rejeitarPsicologo(psicologo);
    showToast("Psicólogo rejeitado com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro API ao rejeitar psicólogo:", error);
    showToast("Erro ao rejeitar psicólogo.");
    return false;
  }
}

function atualizarContadores() {
  const total = state.psicologos.length;
  const ativos = state.psicologos.filter(
    (item) => item.status === "ativo",
  ).length;
  const pendentes = state.psicologos.filter(
    (item) => item.status === "pendente",
  ).length;
  const online = state.psicologos.filter((item) => item.online).length;

  if (elementos.totalCount) elementos.totalCount.textContent = total;
  if (elementos.activeCount) elementos.activeCount.textContent = ativos;
  if (elementos.pendingCount) elementos.pendingCount.textContent = pendentes;
  if (elementos.onlineCount) elementos.onlineCount.textContent = online;
}

function filtrarPsicologos() {
  return state.psicologos.filter((item) => {
    if (state.filtroStatus === "pendentes" && item.status !== "pendente") {
      return false;
    }

    if (state.busca) {
      const termo = state.busca;
      const texto = `${item.nome} ${item.crp} ${item.cpf}`.toLowerCase();
      return texto.includes(termo);
    }

    return true;
  });
}

function renderizarLista() {
  if (!elementos.listContainer) {
    return;
  }

  const listaFiltrada = filtrarPsicologos();

  if (!listaFiltrada.length) {
    elementos.listContainer.innerHTML = `
      <div class="person">
        <div class="info">
          <i class="fa-regular fa-user"></i>
          <div>
            <h3>Nenhum psicólogo encontrado</h3>
            <p>Verifique o filtro ou a busca.</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  elementos.listContainer.innerHTML = "";

  listaFiltrada.forEach((psicologo) => {
    elementos.listContainer.appendChild(criarCardPsicologo(psicologo));
  });
}

function criarCardPsicologo(psicologo) {
  const card = document.createElement("div");
  card.classList.add("person");

  const spanStatus = document.createElement("span");
  spanStatus.classList.add("status");
  spanStatus.classList.add(
    psicologo.status === "pendente" ? "pending" : "active-status",
  );
  spanStatus.textContent =
    psicologo.status === "pendente" ? "Pendente" : "Ativo";

  const info = document.createElement("div");
  info.classList.add("info");

  const icon = document.createElement("i");
  icon.classList.add("fa-regular", "fa-user");

  const details = document.createElement("div");

  const nameElement = document.createElement("h3");
  nameElement.textContent = psicologo.nome;

  const crpCpfElement = document.createElement("p");
  crpCpfElement.textContent = `CRP: ${psicologo.crp} - CPF: ${psicologo.cpf}`;

  const specialidadeElement = document.createElement("p");
  specialidadeElement.style.fontSize = "0.85rem";
  specialidadeElement.style.color = "#7b6f97";
  specialidadeElement.style.marginTop = "6px";
  specialidadeElement.textContent = psicologo.especialidade;

  details.appendChild(nameElement);
  details.appendChild(crpCpfElement);
  details.appendChild(specialidadeElement);

  info.appendChild(icon);
  info.appendChild(details);

  card.appendChild(info);
  card.appendChild(spanStatus);
  card.classList.add("clickable-card");
  card.dataset.psicologoId = psicologo.id;

  card.addEventListener("click", () => {
    abrirModalPendente(psicologo);
  });

  return card;
}

function abrirModalPendente(psicologo) {
  state.psicologoAberto = psicologo;

  if (!elementos.pendingModal) return;

  const isPendente = psicologo.status === "pendente";

  if (elementos.modalName) elementos.modalName.textContent = psicologo.nome;
  if (elementos.modalCrp)
    elementos.modalCrp.textContent = `CRP: ${psicologo.crp}`;
  if (elementos.modalCpf)
    elementos.modalCpf.textContent = `CPF: ${psicologo.cpf}`;
  if (elementos.modalEmail)
    elementos.modalEmail.textContent = psicologo.email || "Não informado";
  if (elementos.modalPhone)
    elementos.modalPhone.textContent = psicologo.telefone || "Não informado";
  if (elementos.modalDegree)
    elementos.modalDegree.textContent = psicologo.formacao || "Não informado";
  if (elementos.modalExperience)
    elementos.modalExperience.textContent =
      psicologo.experiencia || "Não informado";
  if (elementos.modalBio)
    elementos.modalBio.textContent =
      psicologo.sobre || "Sem descrição adicional.";

  if (elementos.modalActions) {
    elementos.modalActions.style.display = isPendente ? "flex" : "none";
  }

  if (elementos.modalAccept) {
    elementos.modalAccept.textContent = isPendente ? "Aceitar" : "Fechar";
  }

  if (elementos.modalReject) {
    elementos.modalReject.style.display = isPendente ? "inline-block" : "none";
  }

  elementos.pendingModal.style.display = "flex";
}

function fecharModalPendente() {
  if (!elementos.pendingModal) return;
  elementos.pendingModal.style.display = "none";
  state.psicologoAberto = null;
}

function aceitarPsicologo(psicologo) {
  psicologo.status = "ativo";
  atualizarContadores();
  renderizarLista();
  fecharModalPendente();
}

function rejeitarPsicologo(psicologo) {
  state.psicologos = state.psicologos.filter(
    (item) => item.id !== psicologo.id,
  );
  atualizarContadores();
  renderizarLista();
  fecharModalPendente();
}

async function handleModalAccept(psicologo) {
  if (psicologo.status === "pendente") {
    await apiAprovarPsicologo(psicologo);
    return;
  }

  fecharModalPendente();
}

async function handleModalReject(psicologo) {
  if (psicologo.status === "pendente") {
    await apiRejeitarPsicologo(psicologo);
    return;
  }

  fecharModalPendente();
}

function inicializarPagina() {
  inicializarElementos();
  configurarEventos();
  carregarPsicologos();
}

document.addEventListener("DOMContentLoaded", inicializarPagina);

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");
  const closeLogout = document.getElementById("close-logout");

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

  // Fechar modal ao clicar no X
  if (closeLogout) {
    closeLogout.addEventListener("click", function () {
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
});
