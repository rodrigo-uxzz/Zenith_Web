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
      window.location.href = "./pages/loginScreen.html";
    });
  }

  // Fechar modal ao clicar fora
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

//logout
document.getElementById("sair").addEventListener("click", async function (event) {
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
    window.location.href = "./pages/loginScreen.html";
  });

//carregar perfil
document.addEventListener("DOMContentLoaded", function () {
  carregarPerfil();
});


//funçao de mostrar os dados do usuario
async function carregarPerfil() {

  try {
    const {dados} = await apiRequest("/perfil");

    console.log(dados);

        document.getElementById("nome").textContent = dados.user.nome;
        document.getElementById("email").textContent = dados.user.email;
        document.getElementById("telefone").textContent = dados.user.telefone;
        document.getElementById("data").textContent = dados.user.data_nascimento;

        const foto = dados.user.foto_perfil;

        if(foto){
          document.getElementById("foto_perfil").src = `http://127.0.0.1:8000/Storage/${foto}` ;
        }else{
          document.getElementById("foto_perfil").src = './img/avatarZ.png';
        }
        
        if (dados.psicologo) {
            document.getElementById("crp").textContent = dados.psicologo.crp;
            document.getElementById("biografia").textContent =
            dados.psicologo.biografia;
        }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
  }
}
