const parties = [
  { id: 1, name: "Partia A", logo: "wlasne.png" },
  { id: 2, name: "Partia B", logo: "wlasne1.png" },
  { id: 3, name: "Partia C", logo: "wlasne2.png" },
  { id: 4, name: "Partia D", logo: "wlasne3.png" },
  { id: 5, name: "Partia E", logo: "wlasne4.png" },
  // ostatnia partia to własna opcja tworzenia
];

function renderParties() {
  const container = document.getElementById("partiesContainer");
  if(!container) return;

  container.innerHTML = "";

  parties.forEach((party, index) => {
    if (index === parties.length - 1) {
      const btn = document.createElement("div");
      btn.className = "custom-party-button";
      btn.innerText = "Stwórz własną partię";
      btn.onclick = () => {
        sessionStorage.setItem("returnPage", window.location.href);
        window.location.href = "create-party.html";
      };
      container.appendChild(btn);
    } else {
      const el = document.createElement("img");
      el.src = party.logo;
      el.title = party.name;
      el.className = "party-logo";
      el.onclick = () => selectParty(party.id);
      container.appendChild(el);
    }
  });

  const newPartyJSON = sessionStorage.getItem("newParty");
  if (newPartyJSON) {
    const newParty = JSON.parse(newPartyJSON);
    parties.splice(parties.length - 1, 0, newParty); // wstaw przed ostatnią "stwórz własną"
    sessionStorage.removeItem("newParty");
    renderParties();
  }
}

function selectParty(id) {
  console.log("Wybrano partię ID:", id);
  // Tutaj zrób co chcesz z UI, np. podświetlanie itp.
}

document.addEventListener("DOMContentLoaded", renderParties);
