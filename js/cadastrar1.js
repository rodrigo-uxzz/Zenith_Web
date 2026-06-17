import { apiRequest } from "./api.js";

const inputs = {
  nome: document.getElementById("fullName"),
  telefone: document.getElementById("telefone"),
  data: document.getElementById("dataNascimento"),
  genero: document.getElementById("genero"),
  cpf: document.getElementById("cpf"),
  crp: document.getElementById("crp"),
};

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function setInputError(input, hasError) {
  if (!input) return;
  input.classList.toggle("input-error", hasError);
}

function restoreFormValues() {
  const fields = [
    "nome",
    "telefone",
    "data",
    "genero",
    "cpf",
    "crp",
    "foto",
  ];

  fields.forEach((key) => {
    const value = localStorage.getItem(key);

    if (key === "foto") {
      const preview = document.getElementById("preview");
      const placeholder = document.getElementById("placeholder");
      if (value && preview && placeholder) {
        preview.src = value;
        preview.style.display = "block";
        placeholder.style.display = "none";
      }
      return;
    }

    const input = inputs[key] || document.getElementById(key);
    if (!input || value === null) return;

    if (input.tagName === "SELECT") {
      input.value = value;
    } else {
      input.value = value;
    }
  });
}

//Botoes pra ativar as funções
document.getElementById("proximaTela").addEventListener("click", function () {
  validarProximo();
});

// ===== TELEFONE =====
document.getElementById("telefone").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");

  value = value.slice(0, 11);

  value = value.replace(/^(\d{2})(\d)/g, "($1) $2");

  value = value.replace(/(\d{5})(\d)/, "$1-$2");

  e.target.value = value;
  localStorage.setItem("telefone", value);
  setInputError(e.target, false);
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

function validarDigitosCpf(cpf) {
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(cpf[10]);
}

async function validarCpf(cpfLimpo) {
  if (!cpfLimpo || cpfLimpo.length !== 11 || !validarDigitosCpf(cpfLimpo)) {
    return false;
  }

  const verificar = await verificarCPF(cpfLimpo);
  const payload = verificar?.dados ?? verificar;

  return (
    verificar?.ok === true ||
    payload?.ok === true ||
    payload?.success === true ||
    payload?.valid === true ||
    payload?.disponivel === true ||
    payload?.status === "ok"
  );
}

if (cpfInput) {
  cpfInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");

    value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    e.target.value = value;
    localStorage.setItem("cpf", value);
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
  localStorage.setItem("crp", value);
  setInputError(e.target, false);
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
  const nome = document.getElementById("fullName").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const data = document.getElementById("dataNascimento").value;
  const genero = document.getElementById("genero").value;
  const cpf = document.getElementById("cpf").value.trim();
  const crp = document.getElementById("crp").value.trim();

  const cpfLimpo = cpf.replace(/\D/g, "");
  const telefoneLimpo = telefone.replace(/\D/g, "");
  const crpLimpo = crp.replace(/[^A-Z0-9]/gi, "");
  const cpfLocalValido = validarDigitosCpf(cpfLimpo);

  let temErro = false;

  setInputError(inputs.nome, !nome);
  setInputError(inputs.telefone, !telefoneLimpo || telefoneLimpo.length !== 11);
  setInputError(inputs.data, !data);
  setInputError(inputs.genero, !genero);
  setInputError(inputs.cpf, !cpfLocalValido);
  setInputError(inputs.crp, !crp || crp.length < 6);

  if (!nome) {
    showToast("Informe seu nome completo.");
    temErro = true;
  }
  if (!telefoneLimpo || telefoneLimpo.length !== 11) {
    showToast("Telefone inválido. Use o formato (00) 00000-0000.");
    temErro = true;
  }
  if (!data) {
    showToast("Selecione sua data de nascimento.");
    temErro = true;
  }
  if (!genero) {
    showToast("Selecione um gênero.");
    temErro = true;
  }
  if (!cpfLocalValido) {
    showToast("CPF inválido.");
    temErro = true;
  } else {
    const cpfServidorValido = await validarCpf(cpfLimpo);
    if (!cpfServidorValido) {
      setInputError(inputs.cpf, true);
      showToast("CPF não pôde ser validado.");
      temErro = true;
    } else {
      cpfValido = true;
      setInputError(inputs.cpf, false);
    }
  }
  if (!crp || crp.length < 6) {
    showToast("CRP inválido.");
    temErro = true;
  }

  if (temErro) return;

  localStorage.setItem("nome", nome);
  localStorage.setItem("telefone", telefoneLimpo);
  localStorage.setItem("data", data);
  localStorage.setItem("genero", genero);
  localStorage.setItem("cpf", cpfLimpo);
  localStorage.setItem("crp", crpLimpo);

  showToast("Dados salvos! Continuando...");

  setTimeout(() => {
    window.location.href = "./../pages/criarScreen2.html";
  }, 1000);
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

        localStorage.setItem("foto", base64);

        const preview = document.getElementById("preview");
        const placeholder = document.getElementById("placeholder");

        if (preview) preview.src = base64;
        if (preview) preview.style.display = "block";
        if (placeholder) placeholder.style.display = "none";
      };

      reader.readAsDataURL(arquivo);
    }
  });
}

restoreFormValues();

document.getElementById("fullName").addEventListener("input", function () {
    localStorage.setItem("nome", this.value);
});

document.getElementById("dataNascimento").addEventListener("change", function () {
    localStorage.setItem("data", this.value);
});

document.getElementById("genero").addEventListener("change", function () {
    localStorage.setItem("genero", this.value);
});
