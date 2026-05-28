import { apiRequest } from "./api.js";

const state = {
  psicologos: [],
  filtroStatus: "todas",
  busca: "",
  psicologoAberto: null,
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
  elementos.filterButtons = Array.from(document.querySelectorAll(".search-box .btn"));
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
      if (!card || !elementos.listContainer.contains(card) || !card.dataset.psicologoId) {
        return;
      }

      const psicologo = state.psicologos.find((item) => item.id === card.dataset.psicologoId);
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
  let dados = [];

  try {
    const resposta = await apiRequest("/psicologos", "GET");

    if (resposta.ok) {
      if (Array.isArray(resposta.dados)) {
        dados = resposta.dados;
      } else if (Array.isArray(resposta.dados.psicologos)) {
        dados = resposta.dados.psicologos;
      } else if (Array.isArray(resposta.dados.data)) {
        dados = resposta.dados.data;
      }
    }
  } catch (error) {
    console.warn("Não foi possível buscar psicólogos da API:", error);
  }

  const lista = dados.length ? dados : dadosMock;
  state.psicologos = lista.map(mapearPsicologo);
  atualizarContadores();
  renderizarLista();
}

function mapearPsicologo(item) {
  const statusBruto = (item.status || item.situacao || item.status_solicitacao || "").toString().toLowerCase();

  let status = "ativo";
  if (statusBruto.includes("pendente") || statusBruto.includes("solicit") || statusBruto.includes("análise") || statusBruto.includes("analise")) {
    status = "pendente";
  }

  return {
    id: item.id || item.id_psicologo || item.crp || Math.random().toString(36).slice(2),
    nome: item.nome || item.name || item.usuario?.nome || item.usuario?.name || "Sem nome",
    crp: item.crp || item.cod_crp || item.cref || "--",
    cpf: item.cpf || item.documento || "--",
    status,
    online: Boolean(item.online || item.ativo_online || item.conectado),
    especialidade: item.especialidade || item.area || "Psicologia Clínica",
    email: item.email || item.usuario?.email || item.contato || "Não informado",
    telefone: item.telefone || item.usuario?.telefone || item.celular || "Não informado",
    formacao: item.formacao || item.graduacao || item.especializacao || "Não informado",
    experiencia: item.experiencia || item.anos_experiencia || item.experiencia_anos || "Não informado",
    sobre: item.sobre || item.descricao || item.bio || "Sem descrição adicional.",
  };
}

function atualizarContadores() {
  const total = state.psicologos.length;
  const ativos = state.psicologos.filter((item) => item.status === "ativo").length;
  const pendentes = state.psicologos.filter((item) => item.status === "pendente").length;
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
  spanStatus.classList.add(psicologo.status === "pendente" ? "pending" : "active-status");
  spanStatus.textContent = psicologo.status === "pendente" ? "Pendente" : "Ativo";

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
  if (elementos.modalCrp) elementos.modalCrp.textContent = `CRP: ${psicologo.crp}`;
  if (elementos.modalCpf) elementos.modalCpf.textContent = `CPF: ${psicologo.cpf}`;
  if (elementos.modalEmail) elementos.modalEmail.textContent = psicologo.email || "Não informado";
  if (elementos.modalPhone) elementos.modalPhone.textContent = psicologo.telefone || "Não informado";
  if (elementos.modalDegree) elementos.modalDegree.textContent = psicologo.formacao || "Não informado";
  if (elementos.modalExperience) elementos.modalExperience.textContent = psicologo.experiencia || "Não informado";
  if (elementos.modalBio) elementos.modalBio.textContent = psicologo.sobre || "Sem descrição adicional.";

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
  state.psicologos = state.psicologos.filter((item) => item.id !== psicologo.id);
  atualizarContadores();
  renderizarLista();
  fecharModalPendente();
}

function handleModalAccept(psicologo) {
  if (psicologo.status === "pendente") {
    aceitarPsicologo(psicologo);
    return;
  }

  fecharModalPendente();
}

function handleModalReject(psicologo) {
  if (psicologo.status === "pendente") {
    rejeitarPsicologo(psicologo);
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
