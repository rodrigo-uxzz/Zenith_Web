import { apiRequest } from "./api.js";

//Botoes pra ativar as funções
document.getElementById("botaoVoltar").addEventListener("click", function(){
    voltarTela1();
});

document.getElementById("criarConta").addEventListener("click", function(){
    criarConta();
});

// Quando a página abre, valida se tem dados salvos
window.addEventListener("DOMContentLoaded", function () {
  let nome = localStorage.getItem("nome");

  // Se não encontrou, volta pra tela 1
  if (nome === null) {
    alert("⚠️ Você precisa preencher a tela anterior!");
    window.location.href = "./criarScreen.html";
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
    !termos ||
    username === ""
  ) {
    alert("❌ ERRO: Preencha TODOS os campos e aceite os termos!");
    return;
  }

  // Validando se as senhas são iguais
  if (senha !== confirmarSenha) {
    alert("❌ ERRO: As senhas não conferem!");
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
  const dados = {
    nome: localStorage.getItem("nome"),
    telefone: localStorage.getItem("telefone"),
    data: localStorage.getItem("data"),
    genero: localStorage.getItem("genero"),
    cpf: localStorage.getItem("cpf"),
    crp: localStorage.getItem("crp"),
    username: localStorage.getItem("username"),
    email: localStorage.getItem("email"),
    senha: localStorage.getItem("senha"),
    cadastroEpsi: localStorage.getItem("cadastroEpsi") === "sim",
    formacao: localStorage.getItem("formacao"),
    termos: termos,
  };

  console.log(dados);

  const {ok , dado} = await apiRequest("/registerPsicologo", "POST", dados);

  console.log(dado);
  if (ok) {
    console.log(dado);

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

    alert(resumo);

    // Ir pra login
    window.location.href = "./loginScreen.html";
  } else {
    if (dados?.errors?.cpf) {
        alert("Erro: " + dados.errors.cpf[0]);
    } else {
        alert("Erro: " + (dados.message || "cpf Invalido"));
    }
    console.error(error);
    alert("Erro ao Cadastrar tente novamente");
  }
}
