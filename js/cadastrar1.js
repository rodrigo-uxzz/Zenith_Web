//Botoes pra ativar as funções
document.getElementById("proximaTela").addEventListener("click", function () {
  validarProximo();
});

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
  if (
    nome === "" ||
    telefone === "" ||
    data === "" ||
    genero === "" ||
    cpf === "" ||
    crp === ""
  ) {
    alert("❌ ERRO: Preencha TODOS os campos!");
    return;
  }

  // Se tudo preenchido, salva no localStorage
  localStorage.setItem("nome", nome);
  localStorage.setItem("telefone", telefone);
  localStorage.setItem("data", data);
  localStorage.setItem("genero", genero);
  localStorage.setItem("cpf", cpf);
  localStorage.setItem("crp", crp);

  alert("✅ Dados salvos! Continuando...");

  // Redireciona pra próxima página
  window.location.href = "./criarScreen2.html";
}

