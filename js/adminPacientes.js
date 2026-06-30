import { apiRequest } from "./api.js";

const state = {
  pacientes: [],
  filtroStatus: "todos",
  busca: "",
  pacienteAberto: null,
};

const elementos = {
  totalCount: null,
  comPsiCount: null,
  semPsiCount: null,
  novosCount: null,
  searchInput: null,
  listContainer: null,
  filterButtons: [],
  pacienteModal: null,
  closePacienteModal: null,
  modalNome: null,
  modalCpf: null,
  modalNasc: null,
  modalEmail: null,
  modalTelefone: null,
  modalPsicologo: null,
  modalUltimaSessao: null,
  btnFecharModal: null,
};

const dadosMock = [
  {
    nome: "Roberto Oliveira",
    cpf: "123.456.789-00",
    email: "roberto@email.com",
    telefone: "(11) 99999-9999",
    nascimento: "15/04/1985",
    psicologo: "Dra. Ana Paula Silva",
    ultimaSessao: "20/06/2026",
    comPsicologo: true,
    novoEsteMes: false,
  },
  {
    nome: "Pablo Pessoa",
    cpf: "987.654.321-00",
    email: "pablo@email.com",
    telefone: "(11) 98888-7777",
    nascimento: "22/08/1992",
    psicologo: "Dr. Carlos Silva",
    ultimaSessao: "18/06/2026",
    comPsicologo: true,
    novoEsteMes: true,
  },
  {
    nome: "Ana Martins",
    cpf: "111.222.333-44",
    email: "ana@email.com",
    telefone: "(11) 97777-6666",
    nascimento: "10/01/1990",
    psicologo: "Não vinculado",
    ultimaSessao: "10/06/2026",
    comPsicologo: false,
    novoEsteMes: true,
  },
  {
    nome: "João Silva",
    cpf: "321.654.987-00",
    email: "joao@email.com",
    telefone: "(11) 96666-5555",
    nascimento: "05/07/1988",
    psicologo: "Não vinculado",
    ultimaSessao: "25/05/2026",
    comPsicologo: false,
    novoEsteMes: false,
  },
];

function obterElemento(id) {
  return document.getElementById(id);
}

function inicializarElementos() {
  elementos.totalCount = obterElemento("totalCount");
  elementos.comPsiCount = obterElemento("comPsiCount");
  elementos.semPsiCount = obterElemento("semPsiCount");
  elementos.novosCount = obterElemento("novosCount");
  elementos.searchInput = obterElemento("searchInput");
  elementos.listContainer = obterElemento("pacientesList");
  elementos.filterButtons = Array.from(
    document.querySelectorAll(".filtros-bar .btn"),
  );
  elementos.pacienteModal = obterElemento("paciente-modal");
  elementos.closePacienteModal = obterElemento("close-paciente-modal");
  elementos.modalNome = obterElemento("modal-nome");
  elementos.modalCpf = obterElemento("modal-cpf");
  elementos.modalNasc = obterElemento("modal-nasc");
  elementos.modalEmail = obterElemento("modal-email");
  elementos.modalTelefone = obterElemento("modal-telefone");
  elementos.modalPsicologo = obterElemento("modal-psicologo");
  elementos.modalUltimaSessao = obterElemento("modal-ultima-sessao");
  elementos.btnFecharModal = obterElemento("btn-fechar-modal");
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
      state.filtroStatus = botao.dataset.status || "todos";
      renderizarLista();
    });
  });

  if (elementos.closePacienteModal) {
    elementos.closePacienteModal.addEventListener("click", fecharModal);
  }

  if (elementos.btnFecharModal) {
    elementos.btnFecharModal.addEventListener("click", fecharModal);
  }

  if (elementos.pacienteModal) {
    elementos.pacienteModal.addEventListener("click", (event) => {
      if (event.target === elementos.pacienteModal) {
        fecharModal();
      }
    });
  }

  if (elementos.listContainer) {
    elementos.listContainer.addEventListener("click", (event) => {
      const card = event.target.closest(".person");
      if (
        !card ||
        !elementos.listContainer.contains(card) ||
        !card.dataset.pacienteId
      ) {
        return;
      }

      const paciente = state.pacientes.find(
        (item) => String(item.id) === String(card.dataset.pacienteId),
      );
      if (paciente) {
        abrirModal(paciente);
      }
    });
  }
}

async function carregarPacientes() {
  renderizarEstadoCarregando();

  let dados = [];

  try {
    const resposta = await apiRequest("/pacientes", "GET");
    console.log("Resposta bruta da API:", resposta);

    const payload =
      (resposta?.dados?.dados?.pacientes &&
      Array.isArray(resposta.dados.dados.pacientes)
        ? resposta.dados.dados.pacientes
        : null) ||
      (resposta?.dados?.pacientes?.data &&
      Array.isArray(resposta.dados.pacientes.data)
        ? resposta.dados.pacientes.data
        : null) ||
      (resposta?.dados?.pacientes && Array.isArray(resposta.dados.pacientes)
        ? resposta.dados.pacientes
        : null) ||
      (resposta?.pacientes?.data && Array.isArray(resposta.pacientes.data)
        ? resposta.pacientes.data
        : null) ||
      (resposta?.pacientes && Array.isArray(resposta.pacientes)
        ? resposta.pacientes
        : null) ||
      (resposta?.data && Array.isArray(resposta.data) ? resposta.data : null) ||
      (Array.isArray(resposta?.dados) ? resposta.dados : null) ||
      (Array.isArray(resposta) ? resposta : null);

    if (Array.isArray(payload)) {
      dados = payload; // aceita até array vazio real, sem cair em mock
    } else {
      console.error("API não retornou um array reconhecível:", resposta);
    }
  } catch (erro) {
    console.error("Erro ao buscar /pacientes:", erro); // <- isso estava sendo engolido
  }

  const usandoMock = !dados.length;
  if (usandoMock) {
    console.warn("Usando dadosMock — API não retornou pacientes.");
  }

  const lista = usandoMock ? dadosMock : dados;
  state.pacientes = lista.map(mapearPaciente);

  atualizarContadores();
  renderizarLista();
}

function mapearPaciente(item) {
  return {
    id: item.id_paciente || Math.random().toString(36).slice(2),
    nome: item.nome || "Sem nome",
    cpf: item.cpf || "--",
    email: item.email || "Não informado",
    telefone: item.telefone || "Não informado",
    nascimento: item.nascimento || "--",
    psicologo: item.psicologo?.nome || "Não vinculado",
    ultimaSessao: item.ultima_sessao || "--",
    comPsicologo: Boolean(item.psicologo),
    novoEsteMes: Boolean(item.novo_este_mes),
  };
}

function atualizarContadores() {
  const total = state.pacientes.length;
  const comPsi = state.pacientes.filter((p) => p.comPsicologo).length;
  const semPsi = state.pacientes.filter((p) => !p.comPsicologo).length;
  const novos = state.pacientes.filter((p) => p.novoEsteMes).length;

  if (elementos.totalCount) elementos.totalCount.textContent = total;
  if (elementos.comPsiCount) elementos.comPsiCount.textContent = comPsi;
  if (elementos.semPsiCount) elementos.semPsiCount.textContent = semPsi;
  if (elementos.novosCount) elementos.novosCount.textContent = novos;
}

function filtrarPacientes() {
  return state.pacientes.filter((paciente) => {
    if (state.filtroStatus === "com-psicologo" && !paciente.comPsicologo)
      return false;
    if (state.filtroStatus === "sem-psicologo" && paciente.comPsicologo)
      return false;

    if (state.busca) {
      const texto =
        `${paciente.nome} ${paciente.cpf} ${paciente.email}`.toLowerCase();
      return texto.includes(state.busca);
    }

    return true;
  });
}

function renderizarEstadoCarregando() {
  if (!elementos.listContainer) return;

  elementos.listContainer.innerHTML = `
        <div class="person loading-state">
            <div class="info">
                <i class="fa-regular fa-user"></i>
                <div>
                    <h3>Carregando pacientes...</h3>
                    <p>Aguarde enquanto buscamos os dados.</p>
                </div>
            </div>
        </div>
    `;
}

function renderizarLista() {
  if (!elementos.listContainer) return;

  const listaFiltrada = filtrarPacientes();

  if (!listaFiltrada.length) {
    elementos.listContainer.innerHTML = `
            <div class="person">
                <div class="info">
                    <i class="fa-regular fa-user"></i>
                    <div>
                        <h3>Nenhum paciente encontrado</h3>
                        <p>Verifique o filtro ou a busca.</p>
                    </div>
                </div>
            </div>
        `;
    return;
  }

  elementos.listContainer.innerHTML = "";

  listaFiltrada.forEach((paciente, index) => {
    elementos.listContainer.appendChild(criarCardPaciente(paciente, index));
  });
}

function criarCardPaciente(paciente, index) {
  const card = document.createElement("div");
  card.classList.add("person");
  card.dataset.pacienteId = paciente.id;

  const spanStatus = document.createElement("span");
  spanStatus.classList.add("status");
  spanStatus.classList.add(paciente.comPsicologo ? "status-com" : "status-sem");
  spanStatus.textContent = paciente.comPsicologo
    ? "Com Psicólogo"
    : "Sem Psicólogo";

  const info = document.createElement("div");
  info.classList.add("info");

  const icon = document.createElement("i");
  icon.classList.add("fa-regular", "fa-user");

  const details = document.createElement("div");

  const nomeEl = document.createElement("h3");
  nomeEl.textContent = paciente.nome;

  const cpfEmailEl = document.createElement("p");
  cpfEmailEl.textContent = `CPF: ${paciente.cpf} · ${paciente.email}`;

  const psicologoEl = document.createElement("p");
  psicologoEl.style.fontSize = "0.85rem";
  psicologoEl.style.color = "#7b6f97";
  psicologoEl.style.marginTop = "6px";
  psicologoEl.textContent = `Psicólogo: ${paciente.psicologo}`;

  details.appendChild(nomeEl);
  details.appendChild(cpfEmailEl);
  details.appendChild(psicologoEl);

  info.appendChild(icon);
  info.appendChild(details);

  card.appendChild(info);
  card.appendChild(spanStatus);

  card.addEventListener("click", () => {
    abrirModal(paciente);
  });

  return card;
}

function abrirModal(paciente) {
  state.pacienteAberto = paciente;

  if (!elementos.pacienteModal) return;

  if (elementos.modalNome) elementos.modalNome.textContent = paciente.nome;
  if (elementos.modalCpf)
    elementos.modalCpf.textContent = `CPF: ${paciente.cpf}`;
  if (elementos.modalNasc)
    elementos.modalNasc.textContent = `Nascimento: ${paciente.nascimento}`;
  if (elementos.modalEmail) elementos.modalEmail.textContent = paciente.email;
  if (elementos.modalTelefone)
    elementos.modalTelefone.textContent = paciente.telefone;
  if (elementos.modalPsicologo)
    elementos.modalPsicologo.textContent = paciente.psicologo;
  if (elementos.modalUltimaSessao)
    elementos.modalUltimaSessao.textContent = paciente.ultimaSessao;

  elementos.pacienteModal.style.display = "flex";
}

function fecharModal() {
  if (!elementos.pacienteModal) return;
  elementos.pacienteModal.style.display = "none";
  state.pacienteAberto = null;
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

function inicializarPagina() {
  inicializarElementos();
  configurarEventos();
  carregarPacientes();
}

document.addEventListener("DOMContentLoaded", inicializarPagina);

document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");
  const closeLogout = document.getElementById("close-logout");

  if (openModalBtn) {
    openModalBtn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.style.display = "flex";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

  if (closeLogout) {
    closeLogout.addEventListener("click", function () {
      modal.style.display = "none";
    });
  }

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

      localStorage.removeItem("token");
      window.location.href = "./../pages/adminLogin.html";
    });
  }
});
