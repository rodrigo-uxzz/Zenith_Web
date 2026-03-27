import { apiRequest } from "./api.js";

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
    window.location.href = "loginScreen.html";
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
