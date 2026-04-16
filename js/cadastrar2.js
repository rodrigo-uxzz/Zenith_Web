import { apiRequest } from "./api.js";

//Botoes pra ativar as funções
document.getElementById("botaoVoltar").addEventListener("click", function () {
  voltarTela1();
});

document.getElementById("criarConta").addEventListener("click", function () {
  criarConta();
});

function showErrorModal(message) {
  document.getElementById("error-modal-message").textContent = message;
  document.getElementById("error-modal").style.display = "flex";
}

function showSuccessModal(message) {
  document.getElementById("success-modal-message").textContent = message;
  document.getElementById("success-modal").style.display = "flex";
}

// Fechar modal de erro
document.getElementById("close-error-modal").onclick = function () {
  document.getElementById("error-modal").style.display = "none";
};

document.getElementById("btn-error-ok").onclick = function () {
  document.getElementById("error-modal").style.display = "none";
};

// Fechar modal de sucesso
document.getElementById("close-success-modal").onclick = function () {
  document.getElementById("success-modal").style.display = "none";
};

document.getElementById("btn-success-ok").onclick = function () {
  document.getElementById("success-modal").style.display = "none";
};

window.onclick = function (event) {
  if (event.target == document.getElementById("error-modal")) {
    document.getElementById("error-modal").style.display = "none";
  }
  if (event.target == document.getElementById("success-modal")) {
    document.getElementById("success-modal").style.display = "none";
  }
};

// Quando a página abre, valida se tem dados salvos
// window.addEventListener("DOMContentLoaded", function () {
//   let nome = localStorage.getItem("nome");

//   // Se não encontrou, volta pra tela 1
//   if (nome === null) {
//     showModal("⚠️ Você precisa preencher a tela anterior!");
//     setTimeout(() => {
//       window.location.href = "./criarScreen.html";
//     }, 2000);
//   }
// });

// Função pra voltar pra tela 1
function voltarTela1() {
  window.location.href = "./criarScreen.html";
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
    showErrorModal("Preencha TODOS os campos e aceite os termos!");
    return;
  }

  // Validando se as senhas são iguais
  if (senha !== confirmarSenha) {
    showErrorModal("As senhas não conferem!");
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
  const informacoes = {
    nome: localStorage.getItem("nome"),
    telefone: localStorage.getItem("telefone"),
    data: localStorage.getItem("data"),
    genero: localStorage.getItem("genero")?.toUpperCase(),
    cpf: localStorage.getItem("cpf"),
    crp: localStorage.getItem("crp"),
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
    senha: localStorage.getItem("senha"),
    cadastroEpsi: localStorage.getItem("cadastroEpsi") === "sim",
    formacao: localStorage.getItem("formacao")?.toUpperCase(),
    termos: termos,
    foto: null, // Adicione a foto de perfil se necessário
  };

  console.log(informacoes);

  const { ok, dados } = await apiRequest(
    "/registerPsicologo",
    "POST",
    informacoes,
  );

  console.log(dados);
  if (ok) {
    console.log(dados);

    showSuccessModal(
      "Conta criada com sucesso! Sua conta entrará em análise. Aguarde um pouco e em breve você poderá fazer login.",
    );

    // Ir pra login
    setTimeout(() => {
      window.location.href = "./loginScreen.html";
    }, 5000);
  } else {
    // if (dados?.errors?.cpf) {
    //     alert("Erro: " + dados.errors.cpf[0]);
    // } else {
    //     alert("Erro: " + (dados.message || "cpf Invalido"));
    // }
    console.error(dados);
    showErrorModal("Erro ao cadastrar. Tente novamente!");
  }
}
