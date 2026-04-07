import { apiRequest } from "./api.js";

//logout
document.getElementById("sair").addEventListener("click", async function (event) {

    event.preventDefault();
    if (!confirm("Tem certeza que deseja sair?")) return;

    try {
      const { ok, dados } = await apiRequest("/logout", "POST");

      if (!ok) {
        console.warn("erro ao deslogar api", dados);
      }
    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("token");
    window.location.href = "loginScreen.html";
  });