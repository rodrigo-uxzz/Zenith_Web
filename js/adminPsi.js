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

function extrairValor(obj, chaves, fallback = "") {
  for (const chave of chaves) {
    if (!chave) continue;

    if (obj?.[chave] !== undefined && obj?.[chave] !== null && obj?.[chave] !== "") {
      return obj[chave];
    }

    const valor = chave.split(".").reduce((acc, parte) => acc?.[parte], obj);
    if (valor !== undefined && valor !== null && valor !== "") {
      return valor;
    }
  }

  return fallback;
}

function normalizarListaResposta(resposta) {
  const candidatos = [
    resposta,
    resposta?.dados,
    resposta?.data,
    resposta?.dados?.data,
    resposta?.dados?.psicologos,
    resposta?.dados?.psicologos?.data,
    resposta?.dados?.result,
    resposta?.dados?.items,
  ];

  for (const item of candidatos) {
    if (Array.isArray(item)) {
      const objs = item.filter((x) => x && typeof x === "object");
      if (objs.length) return objs;
    }
  }

  const procurarArray = (valor) => {
    if (!valor || typeof valor !== "object") return [];

    if (Array.isArray(valor)) {
      const objs = valor.filter((x) => x && typeof x === "object");
      if (objs.length) return objs;
    }

    for (const chave of Object.keys(valor)) {
      const nested = valor[chave];
      if (Array.isArray(nested)) {
        const objs = nested.filter((x) => x && typeof x === "object");
        if (objs.length) return objs;
      }

      if (nested && typeof nested === "object") {
        const found = procurarArray(nested);
        if (found.length) return found;
      }
    }

    return [];
  };

  return procurarArray(resposta);
}

function inicializarElementos() {
  elementos.totalCount = obterElemento("totalCount");
  elementos.activeCount = obterElemento("activeCount");
  elementos.pendingCount = obterElemento("pendingCount");
  elementos.onlineCount = obterElemento("onlineCount");
  elementos.searchInput = obterElemento("searchInput");
  elementos.listContainer = obterElemento("psychologistsList");
  elementos.filterButtons = Array.from(
    document.querySelectorAll(".filtros-bar .btn"),
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
  renderizarEstadoCarregando();
  await carregarEspecialidades();

  let dados = [];

  try {
    const resposta = await apiRequest("/psicologos", "GET");
    console.log("Resposta da API /psicologos:", resposta);

    if (!resposta.ok) {
      console.warn(`Erro API: status ${resposta.status}`, resposta.dados);
      if (resposta.status === 401) {
        console.warn("Token inválido ou expirado. Usando dados mock.");
      }
    } else {
      dados = normalizarListaResposta(resposta);
      console.log("Dados da API normalizados:", dados);
    }
  } catch (error) {
    console.error("Erro ao carregar psicólogos:", error);
  }

  const lista = dados.length ? dados : dadosMock;
  console.log("Lista final:", lista);

  state.psicologos = lista.map((item) => {
    console.log("Mapeando item:", item);
    return mapearPsicologo(item);
  });

  console.log("Psicólogos após mapeamento:", state.psicologos);

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
  const usuario =
    item?.usuario ||
    item?.user ||
    item?.user_data ||
    item?.dadosUsuario ||
    {};

  const perfil = item?.psicologo || item?.psychologist || item || {};

  const statusBruto = extrairValor(
    item,
    [
      "status",
      "status_psicologo",
      "statusCadastro",
      "aprovacao",
      "situacao",
    ],
    ""
  )
    .toString()
    .toLowerCase();

  let status = "ativo";
  if (statusBruto.includes("pendente") || statusBruto.includes("aguard")) {
    status = "pendente";
  }

  const email = extrairValor(
    item,
    [
      "email",
      "email_contato",
      "usuario.email",
      "user.email",
      "usuario.email_address",
      "emailAddress",
    ],
    usuario.email || perfil.email || "Não informado"
  );

  const telefone = extrairValor(
    item,
    [
      "telefone",
      "phone",
      "celular",
      "whatsapp",
      "usuario.telefone",
      "user.telefone",
    ],
    usuario.telefone || perfil.telefone || "Não informado"
  );

  return {
    id:
      extrairValor(item, ["id_psicologo", "id", "psicologo_id"], "") ||
      Math.random().toString(36).slice(2),

    nome:
      extrairValor(
        item,
        [
          "nome",
          "name",
          "full_name",
          "usuario.nome",
          "user.name",
          "usuario.full_name",
        ],
        usuario.nome || usuario.name || "Sem nome"
      ) || "Sem nome",

    crp:
      extrairValor(item, ["crp", "crp_numero", "registro_crp"], "") ||
      "--",

    cpf:
      extrairValor(
        item,
        [
          "cpf",
          "CPF",
          "documento",
          "usuario.cpf",
          "user.cpf",
          "cpf_formatado",
        ],
        usuario.cpf || "--"
      ) || "--",

    status,
    online: Boolean(
      extrairValor(item, ["online", "is_online", "conectado"], false)
    ),

    formacao:
      extrairValor(
        item,
        [
          "grau_formacao",
          "formacao",
          "formacao_profissional",
          "titulo",
          "degree",
        ],
        perfil.grau_formacao || perfil.formacao || "Não informado"
      ) || "Não informado",

    especialidade: formatarEspecialidades(
      extrairValor(
        item,
        [
          "especialidades",
          "especialidade",
          "areas_atuacao",
          "profissoes",
        ],
        perfil.especialidades || perfil.especialidade || []
      )
    ),

    email,
    telefone,

    experiencia:
      extrairValor(
        item,
        [
          "experiencia",
          "anos_experiencia",
          "experiencia_profissional",
          "tempo_experiencia",
        ],
        perfil.experiencia || "Não informado"
      ) || "Não informado",

    sobre:
      extrairValor(
        item,
        ["biografia", "sobre", "descricao", "bio"],
        perfil.biografia || perfil.sobre || "Sem descrição adicional."
      ) || "Sem descrição adicional.",
  };
}

function formatarEspecialidades(especialidades) {
  if (!especialidades || especialidades === "null") {
    return "Sem especialidade";
  }

  if (typeof especialidades === "string") {
    const texto = especialidades.trim();
    if (!texto) return "Sem especialidade";

    try {
      especialidades = JSON.parse(texto);
    } catch {
      if (texto.includes(",")) {
        return texto.split(",").map((v) => v.trim()).filter(Boolean).join(", ");
      }
      return texto;
    }
  }

  if (!Array.isArray(especialidades)) {
    if (
      especialidades &&
      typeof especialidades === "object" &&
      (especialidades.nome || especialidades.especialidade || especialidades.titulo)
    ) {
      const nome =
        especialidades.nome ||
        especialidades.especialidade ||
        especialidades.titulo;
      return nome;
    }
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

function renderizarEstadoCarregando() {
  if (!elementos.listContainer) {
    return;
  }

  elementos.listContainer.innerHTML = `
    <div class="person loading-state">
      <div class="info">
        <div>
          <h3>Carregando psicólogos...</h3>
          <p>Aguarde enquanto buscamos os dados.</p>
        </div>
      </div>
    </div>
  `;
}

function renderizarLista() {
  if (!elementos.listContainer) {
    console.error("Elemento listContainer não encontrado!");
    return;
  }

  console.log("renderizarLista - estado.psicologos:", state.psicologos);
  const listaFiltrada = filtrarPsicologos();
  console.log("Lista filtrada:", listaFiltrada);

  if (!listaFiltrada.length) {
    elementos.listContainer.innerHTML = `
      <div class="person">
        <div class="info">
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
    const card = criarCardPsicologo(psicologo);
    console.log("Adicionando card:", psicologo.nome);
    elementos.listContainer.appendChild(card);
  });
}

function criarCardPsicologo(psicologo) {
  const card = document.createElement("div");
  card.classList.add("person");

  const info = document.createElement("div");
  info.classList.add("info");

  const details = document.createElement("div");

  const nameElement = document.createElement("h3");
  nameElement.textContent = psicologo.nome || "Sem nome";

  const crpCpfElement = document.createElement("p");
  crpCpfElement.textContent = `CRP: ${psicologo.crp || "--"} - CPF: ${psicologo.cpf || "--"}`;

  const specialidadeElement = document.createElement("p");
  specialidadeElement.style.fontSize = "0.85rem";
  specialidadeElement.style.color = "#7b6f97";
  specialidadeElement.style.marginTop = "6px";
  specialidadeElement.textContent = psicologo.especialidade || "Sem especialidade";

  details.appendChild(nameElement);
  details.appendChild(crpCpfElement);
  details.appendChild(specialidadeElement);

  const statusElement = document.createElement("span");
  statusElement.className =
    psicologo.status === "pendente" ? "status pending" : "status active-status";
  statusElement.textContent =
    psicologo.status === "pendente" ? "Pendente" : "Ativo";

  info.appendChild(details);
  card.appendChild(info);
  card.appendChild(statusElement);

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
