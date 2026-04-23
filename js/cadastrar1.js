//Botoes pra ativar as funções
document.getElementById("proximaTela").addEventListener("click", function () {
  validarProximo();
});

// Função para validar e ir pra próxima tela
function showModal(message) {
  document.getElementById("modal-message").textContent = message;
  document.getElementById("modal").style.display = "block";
  // Fechar automaticamente em 3 segundos
  setTimeout(() => {
    document.getElementById("modal").style.display = "none";
  }, 3000);
}

// Fechar modal
document.querySelector(".close").onclick = function () {
  document.getElementById("modal").style.display = "none";
};

window.onclick = function (event) {
  if (event.target == document.getElementById("modal")) {
    document.getElementById("modal").style.display = "none";
  }
};

// Função para validar e ir pra próxima tela
function validarProximo() {
  // Pegando os valores dos campos
  let nome = document.getElementById("fullName").value;
  let telefone = document.getElementById("telefone").value;
  let data = document.getElementById("dataNascimento").value;
  let genero = document.getElementById("genero").value;
  let cpf = document.getElementById("cpf").value;
  let crp = document.getElementById("crp").value;

  // Validando se algum campo está vazio
  if (!nome || !telefone || !data || !genero || !cpf || !crp) {
    showModal("Preencha todos os campos!");
    return;
  }

  // Se tudo preenchido, salva no localStorage
  localStorage.setItem("nome", nome);
  localStorage.setItem("telefone", telefone);
  localStorage.setItem("data", data);
  localStorage.setItem("genero", genero);
  localStorage.setItem("cpf", cpf);
  localStorage.setItem("crp", crp);

  showModal("✅ Dados salvos! Continuando...");

  setTimeout(() => {
    window.location.href = "criarScreen2.html";
  }, 2000);
}

// Variável global para guardar a foto entre telas
window.novaFoto = null;

// Quando seleciona uma foto
const inputFoto = document.getElementById("fileInput");

if (inputFoto) {
  inputFoto.addEventListener("change", function () {
    const arquivo = this.files[0];

    if (arquivo) {
      const reader = new FileReader();

      reader.onload = function (e) {
        const base64 = e.target.result;

        // salva no localStorage
        localStorage.setItem("foto", base64);

        // MOSTRAR PREVIEW
        document.getElementById("preview").src = base64;
        document.getElementById("preview").hidden = false;
        document.getElementById("placeholder").hidden = true;
      };

      reader.readAsDataURL(arquivo);
    }
  });
}
