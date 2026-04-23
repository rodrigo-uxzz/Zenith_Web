import { apiRequest } from "./api.js";

//Botoes pra ativar as funções
document.getElementById("botaoVoltar").addEventListener("click", function () {
  voltarTela1();
});

document.getElementById("criarConta").addEventListener("click", function () {
  criarConta();
});

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

// Quando a página abre, valida se tem dados salvos
// window.addEventListener("DOMContentLoaded", function () {
//   let nome = localStorage.getItem("nome");

//   // Se não encontrou, volta pra tela 1
//   if (nome === null) {
//     showModal("⚠️ Você precisa preencher a tela anterior!");
//     setTimeout(() => {
//       window.location.href = "./pages/criarScreen.html";
//     }, 2000);
//   }
// });

// Função pra voltar pra tela 1
function voltarTela1() {
  window.location.href = "criarScreen.html";
}

// Função pra criar conta
async function criarConta() {
  // Pegando os valores dos campos da tela 2
  let username = document.getElementById("username").value;
  let email = document.getElementById("email").value;
  let senha = document.getElementById("senha").value;
  let confirmarSenha = document.getElementById("confirmarSenha").value;
  let cadastroEpsi = document.querySelector(
    'input[name="cadastroEpsi"]:checked',
  );
  let formacao = document.getElementById("formacao").value;
  let termos = document.getElementById("termos").checked;

  // Validando se estão vazios
  if (
    email === "" ||
    senha === "" ||
    confirmarSenha === "" ||
    !cadastroEpsi ||
    formacao === "" ||
    !termos
  ) {
    showModal("Preencha TODOS os campos e aceite os termos!");
    return;
  }

  // Validando se as senhas são iguais
  if (senha !== confirmarSenha) {
    showModal("As senhas não conferem!");
    return;
  }

  // Pegando dados da tela 1 (que já foram salvos)
  let nome = localStorage.getItem("nome");
  let telefone = localStorage.getItem("telefone");
  let data = localStorage.getItem("data");
  let genero = localStorage.getItem("genero");
  let cpf = localStorage.getItem("cpf");
  let crp = localStorage.getItem("crp");

  // Salvando dados da tela 2 também
  localStorage.setItem("username", username);
  localStorage.setItem("email", email);
  localStorage.setItem("senha", senha);
  localStorage.setItem("cadastroEpsi", cadastroEpsi.value);
  localStorage.setItem("formacao", formacao);
  localStorage.setItem("termos", termos.checked);

  // salvando no banco de dados
  // Criar FormData para enviar arquivo e dados
  const formData = new FormData();

  // Adicionar dados do formulário
  formData.append("nome", localStorage.getItem("nome"));
  formData.append("telefone", localStorage.getItem("telefone"));
  formData.append("data_nascimento", localStorage.getItem("data"));
  formData.append("genero", localStorage.getItem("genero")?.toUpperCase());
  formData.append("cpf", localStorage.getItem("cpf"));
  formData.append("crp", localStorage.getItem("crp"));
  formData.append("username", localStorage.getItem("username"));
  formData.append("email", localStorage.getItem("email"));
  formData.append("senha", localStorage.getItem("senha"));
  formData.append(
    "cadastroEpsi",
    localStorage.getItem("cadastroEpsi") === "1" ? 1 : 0,
  );
  formData.append("formacao", localStorage.getItem("formacao")?.toUpperCase());
  formData.append("termos_aceitos", termos ? 1 : 0);

  // Adicionar foto se existir
  const fotoBase64 = localStorage.getItem("foto");

  if (fotoBase64) {
    const blob = await fetch(fotoBase64).then((r) => r.blob());
    formData.append("foto", blob, "foto.png");
  }

  console.log(formData);

  const { ok, dados } = await apiRequest(
    "/registerPsicologo",
    "POST",
    formData,
  );

  console.log(dados);
  if (ok) {
    console.log(dados);

    showModal(
      "Conta criada com sucesso! Sua conta entrará em análise. Aguarde um pouco e em breve você poderá fazer login.",
    );

    // Ir pra login
    setTimeout(() => {
      window.location.href = "loginScreen.html";
    }, 5000);
  } else {
    console.error(dados);
    showModal("Erro ao cadastrar. Tente novamente!");
  }
}
