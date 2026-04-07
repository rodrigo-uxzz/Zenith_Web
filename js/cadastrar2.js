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
window.addEventListener("DOMContentLoaded", function () {
  let nome = localStorage.getItem("nome");

  // Se não encontrou, volta pra tela 1
  if (nome === null) {
    showModal("⚠️ Você precisa preencher a tela anterior!");
    setTimeout(() => {
      window.location.href = "./criarScreen.html";
    }, 2000);
  }
});

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
    showModal("❌ ERRO: Preencha TODOS os campos e aceite os termos!");
    return;
  }

  // Validando se as senhas são iguais
  if (senha !== confirmarSenha) {
    showModal("❌ ERRO: As senhas não conferem!");
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

    // Mostrando um resumo de todos os dados
    let resumo = `
                    ✅ CONTA CRIADA COM SUCESSO!

                    📋 DADOS PESSOAIS:
                    • Nome: ${nome}
                    • Telefone: ${telefone}
                    • Data Nascimento: ${data}
                    • Gênero: ${genero}

                    📄 DOCUMENTOS:
                    • CPF: ${cpf}
                    • CRP: ${crp}

                    💼 DADOS PROFISSIONAIS:
                    • Email: ${email}
                    • E-psi: ${cadastroEpsi.value}
                    • Formação: ${formacao}
                    `;

    showModal(resumo);

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
    alert("Erro ao Cadastrar tente novamente");
  }
}
