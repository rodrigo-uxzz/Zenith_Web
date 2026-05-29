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
const cpfInput = document.getElementById("cpf");
let cpfValido = false;

function marcarCpfInvalido() {
  if (!cpfInput) return;
  cpfInput.style.border = "1px solid red";
  cpfInput.style.boxShadow = "0 0 5px rgba(255,0,0,0.3)";
  cpfValido = false;
}

function limparErroCpf() {
  if (!cpfInput) return;
  cpfInput.style.border = "";
  cpfInput.style.boxShadow = "";
}

async function validarCpf(cpfLimpo) {
  if (!cpfLimpo || cpfLimpo.length !== 11) {
    return false;
  }

  const verificar = await verificarCPF(cpfLimpo);
  return verificar?.ok === true;
}

if (cpfInput) {
  cpfInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = value;
    limparErroCpf();
    cpfValido = false;
  });

  cpfInput.addEventListener("blur", async function () {
    const cpfLimpo = cpfInput.value.replace(/\D/g, "");

    if (!cpfLimpo || cpfLimpo.length !== 11) {
      marcarCpfInvalido();
      return;
    }

    const valido = await validarCpf(cpfLimpo);

    if (!valido) {
      marcarCpfInvalido();
      return;
    }

    limparErroCpf();
    cpfValido = true;
  });
}

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
    const formData = new FormData();
    formData.append("cpf", cpf);

    const response = await apiRequest("/verificarUserCPF", "POST", formData);

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

  if (!cpfLimpo || cpfLimpo.length !== 11 || !cpfValido) {
    marcarCpfInvalido();
    return;
  }

  // Se tudo preenchido e CPF validado, salva no localStorage

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
