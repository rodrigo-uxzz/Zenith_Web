import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {
  carregarPerfil();

  const modal = document.getElementById("modal");
  const modalClose = document.querySelector(".close");

  if (modalClose) {
    modalClose.addEventListener("click", hideModal);
  }

  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      hideModal();
    }
  });
});

document
  .getElementById("atualizarPerfil")
  .addEventListener("click", async function () {
    atualizarPerfil();
  });

function showModal(message) {
  const modal = document.getElementById("modal");
  const modalMessage = document.getElementById("modal-message");

  if (modalMessage) {
    modalMessage.textContent = message;
  }

  if (modal) {
    modal.style.display = "block";
  }
}

function hideModal() {
  const modal = document.getElementById("modal");

  if (modal) {
    modal.style.display = "none";
  }
}

let dadosOriginais = {};
let fotoOriginal = null;
let novaFoto = null;

//função mostrar perfil
async function carregarPerfil() {
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
    }
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

  if (novaFoto) {
    formData.append("foto_perfil", novaFoto);
  }

  formData.append("_method", "PATCH");

  try {
    const { ok, dados } = await apiRequest("/update", "POST", formData);

    if (ok) {
      showModal("✅ Dados atualizados com sucesso!");
      setTimeout(() => {
        hideModal();
        window.location.href = "perfilScreen.html";
      }, 1500);
    } else {
      console.error(dados);
      showModal("❌ Erro ao atualizar perfil. Tente novamente.");
    }
  } catch (error) {
    console.error(error);
  }
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
document.getElementById("deletar").addEventListener("click", async function () {
  const confirmar = confirm("Tem certeza que deseja excluir essa conta ?");

  if (!confirmar) return;

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "loginScreen.html";
    alert("realize o login");
  }

  try {
    const { ok, dados } = await apiRequest("/delete", "DELETE");

    if (ok) {
      alert("conta excluido com sucesso");
      localStorage.removeItem("token");
      window.location.href = "index.html";
    } else {
      alert("erro ao excluir conta");
      console.error(dados);
    }
  } catch (error) {
    console.error("Erro: ", error);
  }
});

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
