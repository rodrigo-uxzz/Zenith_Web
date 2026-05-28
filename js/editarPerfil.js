import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {
  carregarPerfil();
});

document
  .getElementById("atualizarPerfil")
  .addEventListener("click", async function () {
    atualizarPerfil();
  });

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

let dadosOriginais = {};
let fotoOriginal = null;
let novaFoto = null;
let especialidadesSelecionadas = [];

function getStoredEspecialidades() {
  try {
    const json = localStorage.getItem("especialidadesSelecionadas");
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function saveStoredEspecialidades(especialidades) {
  localStorage.setItem(
    "especialidadesSelecionadas",
    JSON.stringify(especialidades),
  );
}

function renderEspecialidadesSelecionadas() {
  const container = document.getElementById("tagsContainer");

  if (!container) return;

  container.innerHTML = "";

  especialidadesSelecionadas.forEach((esp) => {
    const tag = document.createElement("div");

    tag.className = "tag";

    tag.innerHTML = `
      ${esp.nome}
      <span data-id="${esp.id}">&times;</span>
    `;

    container.appendChild(tag);
  });

  container.querySelectorAll(".tag span").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.dataset.id;
      toggleEspecialidade(id, false);
    });
  });
}
function setCheckboxesFromSelection() {
  const checkboxes = document.querySelectorAll(
    ".item-especialidade input[type='checkbox']",
  );

  checkboxes.forEach((checkbox) => {
    const ids = especialidadesSelecionadas.map((e) => e.id);
    checkbox.checked = ids.includes(Number(checkbox.value));
  });
}

async function carregarEspecialidadesLista() {
  const { dados } = await apiRequest("/especialidades");
  console.log(dados);

  const container = document.querySelector(".lista-especialidades");

  container.innerHTML = "";

  dados.forEach((esp) => {
  const label = document.createElement("label");
    label.className = "item-especialidade";

    label.innerHTML = `
      <input type="checkbox" value="${esp.id_especialidade}">
      <span>${esp.nome}</span>
    `;

    container.appendChild(label);
  });

}

function toggleEspecialidade(id, checked) {
  id = Number(id);

  if (checked) {
    const checkbox = document.querySelector(`input[value="${id}"]`);

    if (checkbox) {
      especialidadesSelecionadas.push({
        id: id,
        nome: checkbox.nextElementSibling.textContent,
      });
    }
  } else {
    especialidadesSelecionadas = especialidadesSelecionadas.filter(
      (e) => e.id !== id,
    );
  }

  saveStoredEspecialidades(especialidadesSelecionadas);
  renderEspecialidadesSelecionadas();
  setCheckboxesFromSelection();
}

function filterEspecialidades() {
  const filtro =
    document.getElementById("pesquisaEspecialidade")?.value.toLowerCase() || "";

  document.querySelectorAll(".item-especialidade").forEach((item) => {
    const label = item.querySelector("span").textContent.toLowerCase();
    item.style.display = label.includes(filtro) ? "flex" : "none";
  });
}

//função mostrar perfil
async function carregarPerfil() {
  await carregarEspecialidadesLista();
  try {
    const { dados } = await apiRequest("/perfil");

    dadosOriginais = dados;

    console.log(dados);

    //mostra dados no topo como titulos do perfil
    document.getElementById("mostrarNome").textContent = dados.user.nome;

    if (dados.psicologo) {
      document.getElementById("mostrarCrp").textContent = dados.psicologo.crp;
    }

    //mostra os dados que podem ser atualizados
    document.getElementById("nome").value = dados.user.nome;
    document.getElementById("email").value = dados.user.email;
    document.getElementById("telefone").value = dados.user.telefone;
    document.getElementById("data").value = dados.user.data_nascimento;

    const foto = dados.user.foto_perfil;
    const fotoPerfil = document.getElementById("foto_perfil");

    fotoOriginal = foto;

    if (foto) {
      fotoPerfil.src = "http://127.0.0.1:8000/storage/" + foto;
    } else {
      fotoPerfil.src = "./../img/avatarZ.png";
    }

    if (dados.psicologo) {
      document.getElementById("crp").value = dados.psicologo.crp;
      document.getElementById("biografia").value = dados.psicologo.biografia;

      if (Array.isArray(dados.psicologo.especialidades)) {
        especialidadesSelecionadas = dados.psicologo.especialidades.map(
          (e) => ({
            id: e.id_especialidade,
            nome: e.nome,
          }),
        );
      } else if (typeof dados.psicologo.especialidade === "string") {
        especialidadesSelecionadas = [dados.psicologo.especialidade];
      } else if (typeof dados.psicologo.especialidades === "string") {
        try {
          especialidadesSelecionadas = JSON.parse(
            dados.psicologo.especialidades,
          );
        } catch {
          especialidadesSelecionadas = [dados.psicologo.especialidades];
        }
      }
    }

    const stored = getStoredEspecialidades();

    if (stored.length && !dados.psicologo?.especialidades?.length) {
      especialidadesSelecionadas = stored;
    }

    setupEspecialidades();
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
  }
}

//função de atualizar os dados do usuario
async function atualizarPerfil() {
  const dados = {
    nome: document.getElementById("nome").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    senha: document.getElementById("senha").value,
    biografia: document.getElementById("biografia").value,
  };

  const dadosFiltrados = Object.fromEntries(
    Object.entries(dados).filter(([_, v]) => v !== ""),
  );

  const formData = new FormData();

  Object.entries(dadosFiltrados).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const savedEspecialidades = getStoredEspecialidades();

  if (savedEspecialidades.length > 0) {
    savedEspecialidades.forEach((esp) => {
      formData.append("especialidade_ids[]", esp.id);
    });
    formData.append("especialidades", JSON.stringify(savedEspecialidades));
  }

  if (novaFoto) {
    formData.append("foto_perfil", novaFoto);
  }

  formData.append("_method", "PATCH");

  try {
    const { ok, dados } = await apiRequest("/update", "POST", formData);

    if (ok) {
      showToast("✅ Dados atualizados com sucesso!");
      setTimeout(() => {
        window.location.href = "perfilScreen.html";
      }, 1500);
    } else {
      console.error(dados);
      showToast("❌ Erro ao atualizar perfil. Tente novamente.");
    }
  } catch (error) {
    console.error(error);
  }
}

function setupEspecialidades() {
  const checkboxes = document.querySelectorAll(
    ".item-especialidade input[type='checkbox']",
  );

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      toggleEspecialidade(this.value, this.checked);
    });
  });

  const pesquisa = document.getElementById("pesquisaEspecialidade");
  if (pesquisa) {
    pesquisa.addEventListener("input", filterEspecialidades);
  }

  renderEspecialidadesSelecionadas();
  setCheckboxesFromSelection();
}

const inputFoto = document.getElementById("fotoPerfil");

inputFoto.addEventListener("change", function () {
  const arquivo = this.files[0];

  if (arquivo) {
    novaFoto = arquivo;

    const preview = URL.createObjectURL(arquivo);
    document.getElementById("foto_perfil").src = preview;
  }
});

//função de excluir conta
const deletarBtn = document.getElementById("deletar");
const deleteModal = document.getElementById("modal-delete");
const cancelDeleteBtn = document.getElementById("btn-cancel-delete");
const confirmDeleteBtn = document.getElementById("btn-confirm-delete");

if (deletarBtn) {
  deletarBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (deleteModal) {
      deleteModal.style.display = "flex";
    }
  });
}

if (cancelDeleteBtn) {
  cancelDeleteBtn.addEventListener("click", function () {
    if (deleteModal) {
      deleteModal.style.display = "none";
    }
  });
}

if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async function () {
    if (deleteModal) {
      deleteModal.style.display = "none";
    }
    await deleteAccount();
  });
}

async function deleteAccount() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "loginScreen.html";
    return;
  }

  try {
    const { ok, dados } = await apiRequest("/delete", "DELETE");

    if (ok) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    } else {
      console.error(dados);
      showToast("Erro ao excluir conta. Tente novamente.");
    }
  } catch (error) {
    console.error("Erro: ", error);
    showToast("Erro ao excluir conta. Tente novamente.");
  }
}

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
      window.location.href = "./../pages/loginScreen.html";
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
    if (event.target === deleteModal) {
      deleteModal.style.display = "none";
    }
  });
});
