import { apiRequest } from "./api.js";

//Botoes pra ativar as funções
document.getElementById("proximaTela").addEventListener("click", function () {
  validarProximo();
});

// Função para validar e ir pra próxima tela
function showModal(message) {
  document.getElementById("modal-message").textContent = message;
  document.getElementById("modal").style.display = "flex";
  // Fechar automaticamente em 3 segundos
  setTimeout(() => {
    document.getElementById("modal").style.display = "none";
  }, 3000);
}

// Fechar modal
// document.querySelector(".close").onclick = function () {
//   document.getElementById("modal").style.display = "none";
// };

window.onclick = function (event) {
  if (event.target == document.getElementById("modal")) {
    document.getElementById("modal").style.display = "none";
  }
};

// ===== TELEFONE =====
document.getElementById("telefone").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");

  value = value.slice(0, 11);

  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");

  value = value.replace(/(\d{5})(\d)/, "$1-$2");

  e.target.value = value;
});

// ===== CPF =====
document.getElementById("cpf").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");

  value = value.slice(0, 11);

  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

  e.target.value = value;
});

// ===== CRP =====
document.getElementById("crp").addEventListener("input", function (e) {
  let value = e.target.value.toUpperCase();

  // remove caracteres inválidos
  value = value.replace(/[^A-Z0-9/]/g, "");

  value = value.slice(0, 8);

  // adiciona barra automaticamente
  if (!value.includes("/") && value.length > 2) {
    value = value.slice(0, 2) + "/" + value.slice(2);
  }

  e.target.value = value;
});

async function verificarCPF(cpf) {
  try {
    const response = await apiRequest("/verificarUserCPF", "POST", {
      cpf: cpf,
    });

    return response;
  } catch (error) {
    console.log("Erro ao verificar CPF:", error);
    return null;
  }
}

// Função para validar e ir pra próxima tela
async function validarProximo() {
  // Pegando os valores dos campos
  console.log(document.getElementById("fullName"));
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

  const cpfLimpo = cpf.replace(/\D/g, "");
  const telefoneLimpo = telefone.replace(/\D/g, "");
  const crpLimpo = crp.replace(/\D/g, "");

  // valida tamanho
  // if (cpfLimpo.length !== 11) {
  //   showModal("CPF inválido!");
  //   return;
  // }

  // // verifica na API
  // const verificar = await verificarCPF(cpfLimpo);

  // console.log(verificar);

  // // se backend retornar erro
  // if (!verificar.ok) {
  //   showModal(verificar.dados.error || "CPF inválido!");
  //   return;
  // }

  // Se tudo preenchido, salva no localStorage

  localStorage.setItem("nome", nome);
  localStorage.setItem("telefone", telefoneLimpo);
  localStorage.setItem("data", data);
  localStorage.setItem("genero", genero);
  localStorage.setItem("cpf", cpfLimpo);
  localStorage.setItem("crp", crpLimpo);

  showModal("✅ Dados salvos! Continuando...");

  setTimeout(() => {
    window.location.href = "./../pages/criarScreen2.html";
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
        document.getElementById("preview").style.display = "block";
        document.getElementById("placeholder").style.display = "none";
      };

      reader.readAsDataURL(arquivo);
    }
  });
}
