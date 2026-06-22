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
      window.location.href = "./../pages/loginScreen.html";
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

//carregar perfil
document.addEventListener("DOMContentLoaded", function () {
  carregarPerfil();
});

//funçao de mostrar os dados do usuario
async function carregarPerfil() {
  try {
    const { dados } = await apiRequest("/perfil");

    console.log(dados);

    document.getElementById("nome").textContent = dados.user.nome;
    document.getElementById("email").textContent = dados.user.email;
    document.getElementById("telefone").textContent = dados.user.telefone;
    document.getElementById("data").textContent = dados.user.data_nascimento;

    const foto = dados.user.foto_perfil;

    if (foto) {
      document.getElementById("foto_perfil").src =
        `http://127.0.0.1:8000/Storage/${foto}`;
    } else {
      document.getElementById("foto_perfil").src = "./../img/avatarZ.png";
    }

    if (dados.psicologo) {
      document.getElementById("crp").textContent = dados.psicologo.crp;
      document.getElementById("biografia").textContent =
        dados.psicologo.biografia;
    }
    
    if (dados.avaliacao) {
      const media = dados.avaliacao.media ?? 0;
      const total = dados.avaliacao.total ?? 0;
      const estrelas = renderEstrelas(media); // função abaixo
      document.getElementById("avaliacao").innerHTML =
        `${estrelas} <span>${media} (${total} avaliações)</span>`;
    }
    renderEspecialidades(dados);
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
  }
}

function getStoredEspecialidades() {
  try {
    const json = localStorage.getItem("especialidadesSelecionadas");
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

function renderEspecialidades(dados) {
  const container = document.querySelector(".especialidades-lista");
  if (!container) return;

  let especialidades = [];

  if (dados.psicologo) {
    if (Array.isArray(dados.psicologo.especialidades)) {
      especialidades = dados.psicologo.especialidades;
    } else if (typeof dados.psicologo.especialidades === "string") {
      try {
        especialidades = JSON.parse(dados.psicologo.especialidades);
      } catch {
        especialidades = dados.psicologo.especialidades
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } else if (typeof dados.psicologo.especialidade === "string") {
      especialidades = [dados.psicologo.especialidade];
    }
  }

  const stored = getStoredEspecialidades();
  if ((!especialidades || especialidades.length === 0) && stored.length) {
    especialidades = stored;
  }

  if (!especialidades || especialidades.length === 0) {
    container.innerHTML =
      '<span class="especialidade-card">Nenhuma especialidade selecionada</span>';
    return;
  }

  container.innerHTML = especialidades
    .map((item) => {
      if (item && typeof item === "object") {
        return item.nome || item.especialidade || item.title || item.name || "";
      }

      return String(item || "");
    })
    .filter(Boolean)
    .map((name) => `<span class="especialidade-card">${name}</span>`)
    .join("");
}

function renderEstrelas(media) {
  return Array.from({ length: 5 }, (_, i) => {
    if (i < Math.floor(media)) return "★";
    if (i < media) return "✭"; // meia estrela
    return "☆";
  }).join("");
}
