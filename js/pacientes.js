import { apiRequest } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const modalLogout = document.getElementById("modal-logout");
  const openModalBtn = document.getElementById("open-Modal-logout");
  const cancelBtn = document.getElementById("btn-cancel-logout");
  const confirmBtn = document.getElementById("btn-confirm-logout");
  const painel = document.getElementById("painelDetalhes");
  const fechar = document.getElementById("fecharPainel");
  const fecharPainelBotao = document.getElementById("btnFecharPainel");
  const lista = document.getElementById("listaPacientes");
  const loadingEl = document.getElementById("loadingMore");
  const infoContagem = document.getElementById("infoContagem");
  const inputBusca = document.getElementById("inputBusca");

  const state = {
    pacientes: [],
    pacientesVisiveis: [],
    filtro: "",
  };

  function atualizarCardsResumo(totalPacientes, consultasHoje) {
    const totalEl = document.getElementById("cardTotalPacientesValor");
    const consultasEl = document.getElementById("cardConsultasHojeValor");

    if (totalEl) totalEl.textContent = totalPacientes;
    if (consultasEl) consultasEl.textContent = consultasHoje;
  }

  if (openModalBtn) {
    openModalBtn.addEventListener("click", (event) => {
      event.preventDefault();
      modalLogout.style.display = "flex";
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modalLogout.style.display = "none";
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "./loginScreen.html";
    });
  }

  if (modalLogout) {
    modalLogout.addEventListener("click", (event) => {
      if (event.target === modalLogout) {
        modalLogout.style.display = "none";
      }
    });
  }

  const abrirPainel = () => painel.classList.add("ativo");
  const fecharPainel = () => painel.classList.remove("ativo");

  if (fechar) fechar.addEventListener("click", fecharPainel);
  if (fecharPainelBotao)
    fecharPainelBotao.addEventListener("click", fecharPainel);

  function abrirDetalhe(paciente) {
    const avatarEl = document.getElementById("detalheAvatar");
    const avatar = montarIniciais(paciente.nome);
    avatarEl.textContent = avatar;
    avatarEl.className = "avatarDetalhe";

    document.getElementById("detalheNome").textContent =
      paciente.nome || "Paciente";
    document.getElementById("detalheEmail").textContent =
      paciente.email || "Não informado";
    document.getElementById("detalheTel").textContent =
      paciente.telefone || "Não informado";
    document.getElementById("detalheNasc").textContent =
      paciente.nascimento || "Não informado";
    document.getElementById("detalheSessoes").textContent =
      paciente.totalSessoes || "0";
    document.getElementById("detalheUltima").textContent =
      paciente.ultimaConsulta || "Sem consultas";
    document.getElementById("detalheFat").textContent =
      paciente.faturamento || "R$ 0";

    abrirPainel();
  }

  function montarIniciais(nome) {
    if (!nome) return "P";
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  function normalizarTexto(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function extrairValor(obj, chaves) {
    const procurar = (valor, profundidade = 0) => {
      if (!valor || typeof valor !== "object" || profundidade > 6) return "";

      for (const chave of chaves) {
        const partes = chave.split(".");
        let atual = valor;
        let encontrado = true;
        for (const parte of partes) {
          if (atual && typeof atual === "object" && parte in atual) {
            atual = atual[parte];
          } else {
            encontrado = false;
            break;
          }
        }
        if (
          encontrado &&
          atual !== undefined &&
          atual !== null &&
          atual !== ""
        ) {
          return atual;
        }
      }

      for (const [chave, valorCampo] of Object.entries(valor)) {
        const chaveNormal = normalizarTexto(chave);
        const corresponde = chaves.some((nome) => {
          const nomeNormal = normalizarTexto(nome);
          return (
            chaveNormal === nomeNormal ||
            chaveNormal.includes(nomeNormal) ||
            nomeNormal.includes(chaveNormal)
          );
        });

        if (
          corresponde &&
          valorCampo !== undefined &&
          valorCampo !== null &&
          valorCampo !== ""
        ) {
          return valorCampo;
        }

        if (valorCampo && typeof valorCampo === "object") {
          const encontradoRecursivo = procurar(valorCampo, profundidade + 1);
          if (encontradoRecursivo !== "") return encontradoRecursivo;
        }
      }

      return "";
    };

    return procurar(obj);
  }

  function formatarData(data) {
    if (!data) return "";

    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    }

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) return data;

    return d.toLocaleDateString("pt-BR");
  }

  function converterParaNumero(valor) {
    if (typeof valor === "number") return valor;
    if (valor === null || valor === undefined || valor === "") return NaN;

    if (typeof valor === "string") {
      const texto = valor.trim();
      if (!texto) return NaN;

      const valorLimpo = texto
        .replace(/R\$/gi, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "");

      const numero = Number(valorLimpo);
      return Number.isNaN(numero) ? NaN : numero;
    }

    return NaN;
  }

  function formatarMoeda(valor) {
    const numero = converterParaNumero(valor);
    if (Number.isNaN(numero)) {
      return typeof valor === "string" && valor.startsWith("R$")
        ? valor
        : "R$ 0,00";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numero);
  }

  function encontrarArray(item, nomes) {
    const percorrer = (valor) => {
      if (!valor || typeof valor !== "object") return null;
      if (Array.isArray(valor)) return valor;

      for (const [chave, campo] of Object.entries(valor)) {
        const chaveNormal = normalizarTexto(chave);
        if (nomes.includes(chaveNormal) && Array.isArray(campo)) {
          return campo;
        }

        const encontrado = percorrer(campo);
        if (encontrado) return encontrado;
      }

      return null;
    };

    return percorrer(item);
  }

  function contarConsultasHoje(item) {
    const consultas = encontrarArray(item, [
      "consultas",
      "sessoes",
      "atendimentos",
      "historico",
    ]);
    if (!consultas || !consultas.length) return 0;

    const hoje = new Date();
    const inicioHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );
    const fimHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate() + 1,
    );

    return consultas.reduce((total, consulta) => {
      const dataTexto = extrairValor(consulta, [
        "data",
        "data_consulta",
        "dataConsulta",
        "date",
        "created_at",
        "updated_at",
        "dt_consulta",
        "data_sessao",
        "dataSessao",
        "data_agendada",
        "data_realizada",
      ]);
      if (!dataTexto) return total;

      const data = new Date(dataTexto);
      if (Number.isNaN(data.getTime())) return total;

      if (data >= inicioHoje && data < fimHoje) {
        return total + 1;
      }

      return total;
    }, 0);
  }

  function encontrarUltimaConsulta(item) {
    const sessoes = item?.paciente?.sessoes || [];

    const realizadas = sessoes.filter(
      (sessao) => sessao.status_sessao === "realizada",
    );

    if (!realizadas.length) return "";

    const ultima = realizadas.reduce((maisRecente, atual) => {
      return new Date(atual.data_sessao) > new Date(maisRecente.data_sessao)
        ? atual
        : maisRecente;
    });

    return formatarData(ultima.data_sessao);
  }

  function somarFaturamento(item) {
    const sessoes = item?.paciente?.sessoes || item?.sessoes || [];

    let total = 0;

    sessoes.forEach((sessao) => {
      const valor = Number(sessao.valor || 0);

      if (!Number.isNaN(valor)) {
        total += valor;
      }
    });

    return formatarMoeda(total);
  }

  function mapearPaciente(item) {
    const usuario =
      item.usuario ||
      item.user ||
      item.paciente?.usuario ||
      item.paciente?.user ||
      {};
    const pacienteRelacionado = item.paciente || {};

    const nome =
      extrairValor(item, [
        "nome",
        "usuario.nome",
        "user.nome",
        "paciente.usuario.nome",
        "paciente.user.nome",
        "full_name",
        "name",
      ]) ||
      usuario.nome ||
      usuario.name ||
      "Paciente";
    const email =
      extrairValor(item, [
        "email",
        "usuario.email",
        "user.email",
        "paciente.usuario.email",
        "paciente.user.email",
      ]) ||
      usuario.email ||
      "Não informado";
    const cpf =
      extrairValor(item, [
        "cpf",
        "usuario.cpf",
        "user.cpf",
        "paciente.usuario.cpf",
        "paciente.user.cpf",
        "documento",
        "numero_documento",
      ]) ||
      usuario.cpf ||
      "Não informado";
    const telefone =
      extrairValor(item, [
        "telefone",
        "phone",
        "celular",
        "whatsapp",
        "usuario.telefone",
        "user.telefone",
        "paciente.usuario.telefone",
        "paciente.user.telefone",
      ]) ||
      usuario.telefone ||
      "Não informado";
    const nascimento =
      formatarData(
        extrairValor(item, [
          "data_nascimento",
          "nascimento",
          "dataNascimento",
          "birth_date",
          "birthDate",
          "usuario.data_nascimento",
          "user.data_nascimento",
          "paciente.usuario.data_nascimento",
          "paciente.user.data_nascimento",
        ]),
      ) || "Não informado";

    const consultas =
      item?.paciente?.sessoes || item?.sessoes || item?.consultas || [];
    const ultimaSessao = encontrarUltimaConsulta(item);
    const totalSessoes = Array.isArray(item?.paciente?.sessoes)
      ? item.paciente.sessoes.length
      : 0;
    consultas?.length ||
      item.sessoes?.length ||
      item.consultas?.length ||
      item.consultas?.filter(Boolean).length ||
      item.paciente?.sessoes?.length ||
      item.paciente?.consultas?.length ||
      item.paciente?.atendimentos?.length ||
      0;
    const faturamento = somarFaturamento(item);

    return {
      id: item.id || item.id_paciente || item.paciente?.id_paciente,

      nome,
      email,
      cpf,
      telefone,
      nascimento,

      ultimaConsulta: ultimaSessao || "Sem consultas",

      totalSessoes,

      faturamento,

      status:
        item.status ||
        item.situacao ||
        pacienteRelacionado.status_paciente ||
        (totalSessoes > 0 ? "ativo" : "inativo"),
    };
  }

  function filtrarPacientesPorPsicologo(lista, psicologoId) {
    const idPsicologo = String(psicologoId || "").trim();
    if (!idPsicologo) return lista;

    return lista.filter((item) => {
      const candidatos = [
        item?.id_psicologo,
        item?.psicologo_id,
        item?.psicologo?.id,
        item?.psicologo?.id_psicologo,
        item?.paciente?.id_psicologo,
        item?.paciente?.psicologo_id,
        item?.usuario?.id_psicologo,
        item?.usuario?.psicologo_id,
        item?.user?.id_psicologo,
        item?.user?.psicologo_id,
        item?.psicologoId,
        item?.psicologo_id_associado,
        item?.idPsicologo,
      ];

      return candidatos.some((valor) => String(valor || "") === idPsicologo);
    });
  }

  function extrairListaDaResposta(resposta) {
    const candidatos = [
      resposta,
      resposta?.dados,
      resposta?.data,
      resposta?.pacientes,
      resposta?.pacientes?.data,
      resposta?.result,
      resposta?.items,
      resposta?.dados?.pacientes,
      resposta?.data?.pacientes,
      resposta?.dados?.data,
      resposta?.data?.data,
    ];

    const visitar = (valor) => {
      if (Array.isArray(valor)) return valor;
      if (!valor || typeof valor !== "object") return null;

      if (Array.isArray(valor.pacientes)) return valor.pacientes;
      if (Array.isArray(valor.data)) return valor.data;
      if (Array.isArray(valor.dados)) return valor.dados;
      if (Array.isArray(valor.items)) return valor.items;
      if (Array.isArray(valor.result)) return valor.result;

      for (const item of Object.values(valor)) {
        if (Array.isArray(item)) return item;
        if (item && typeof item === "object") {
          const encontrado = visitar(item);
          if (encontrado) return encontrado;
        }
      }
      return null;
    };

    for (const candidato of candidatos) {
      const encontrado = visitar(candidato);
      if (encontrado) return encontrado;
    }
    return [];
  }

  function criarLinha(paciente) {
    const div = document.createElement("div");
    div.className = "linhaPaciente";
    div.dataset.status = paciente.status;
    div.innerHTML = `
            <div class="infoPaciente">
                <div class="avatarPaciente">${montarIniciais(paciente.nome)}</div>
                <div>
                    <strong>${paciente.nome}</strong>
                    <div class="cpf-email">
                        <span>CPF: ${paciente.cpf}</span>
                        <span class="dot"></span>
                        <span>${paciente.email}</span>
                    </div>
                    <div class="cpf-email"><span>Nascimento: ${paciente.nascimento}</span></div>
                </div>
            </div>
            <div class="ultimaSessao">
                <ion-icon name="calendar-outline"></ion-icon>
                <div>
                    <span class="label">Última sessão</span>
                    <span class="data">${paciente.ultimaConsulta}</span>
                </div>
            </div>
            <button class="btnDetalhes" type="button">Ver detalhes</button>`;

    const botao = div.querySelector(".btnDetalhes");
    botao.addEventListener("click", () => abrirDetalhe(paciente));
    return div;
  }

  function renderizarPacientes() {
    const filtro = normalizarTexto(state.filtro);
    const pacientesFiltrados = state.pacientes.filter((paciente) => {
      if (!filtro) return true;
      const texto = normalizarTexto(
        `${paciente.nome} ${paciente.email} ${paciente.cpf}`,
      );
      return texto.includes(filtro);
    });

    state.pacientesVisiveis = pacientesFiltrados;
    lista.innerHTML = "";

    pacientesFiltrados.forEach((paciente) => {
      lista.appendChild(criarLinha(paciente));
    });

    infoContagem.textContent = `Mostrando ${pacientesFiltrados.length} de ${state.pacientes.length} pacientes`;
  }

  async function carregarPacientes() {
    try {
      const usuarioLogado = JSON.parse(
        localStorage.getItem("usuarioLogado") || "null",
      );
      const psicologoId = String(
        localStorage.getItem("psicologoId") ||
          usuarioLogado?.id_psicologo ||
          usuarioLogado?.psicologo?.id_psicologo ||
          usuarioLogado?.psicologo?.id ||
          usuarioLogado?.id ||
          "",
      ).trim();

      const resposta = await apiRequest("/listarPacientes", "GET");

      console.log("Resposta completa:", resposta);
      console.log("Dados:", resposta.dados);

      const payload = extrairListaDaResposta(resposta.dados || resposta);

      console.log("Payload:", payload);

      console.log("Quantidade:", payload.length);

      if (!resposta.ok) {
        console.error(
          "Erro ao chamar /listarPacientes",
          resposta.status,
          resposta.dados,
        );
        infoContagem.textContent = `Erro ao carregar pacientes (${resposta.status})`;
        lista.innerHTML =
          '<div class="linhaPaciente"><div class="infoPaciente"><div>Erro ao carregar pacientes. Verifique login, token e rota da API.</div></div></div>';
        return;
      }

      const dados = payload;

      const totalPacientes = dados.length;
      const consultasHoje = dados.reduce(
        (total, item) => total + contarConsultasHoje(item),
        0,
      );

      state.pacientes = dados.map(mapearPaciente);
      atualizarCardsResumo(totalPacientes, consultasHoje);
      renderizarPacientes();

      if (!dados.length) {
        infoContagem.textContent =
          "Nenhum paciente encontrado para o seu perfil";
        lista.innerHTML =
          '<div class="linhaPaciente"><div class="infoPaciente"><div>Nenhum paciente encontrado para o seu perfil.</div></div></div>';
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      infoContagem.textContent = "Erro ao carregar pacientes";
      lista.innerHTML =
        '<div class="linhaPaciente"><div class="infoPaciente"><div>Não foi possível carregar os pacientes.</div></div></div>';
    }
  }

  if (inputBusca) {
    inputBusca.addEventListener("input", (event) => {
      state.filtro = event.target.value;
      renderizarPacientes();
    });
  }

  carregarPacientes();
});
