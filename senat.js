let zaplanowanySondaz = null;
let zaplanowanaTuraSondazu = null;
let wybranaTuraDoPlanowania = null;
let zaplanowanySondazParlamentarny = false;
let zaplanowanaTuraParlamentarna = null;
let currentMode = null
const zaplanowaneAkcje = {}; // klucz: numer tury, wartość: typ akcji, np. 'rzadowy' lub 'parlamentarny'
const zaplanowaneWywiady = {}; // klucz: numer tury, wartość: obiekt {poselId, mediaName}
let czekaNaSkip = false;
let kampaniaParlamentarnaTrwa = true; // ustaw na false gdy kampania się kończy
let kampaniaPrezydenckaTrwa = true; // 🔁 Zmieniaj na false, gdy kampania się kończy
let budget = 500;
let aktualnaTura = 1;
function ustawLogoPartii(nazwaPartii) {
  const logoImg = document.getElementById('chosenPartyLogo');
  // Jeśli gracz używa własnej partii
  if (localStorage.getItem("czyUzywaWlasnejPartii") === "true") {
    const wlasneLogo = localStorage.getItem("wlasnaPartiaLogo");
    if (wlasneLogo) {
      logoImg.src = wlasneLogo;
      logoImg.alt = 'Logo partii ' + (localStorage.getItem("wlasnaPartiaNazwa") || "Własna partia");
      return;
    }
  }
  // Standardowe partie
  const logoMap = {
    'Prawo i Sprawiedliwość': 'img/PiS.jpg',
    'Platforma Obywatelska': 'img/PO.jpg',
    'Konfederacja': 'img/konfederacja.png',
    'Nowa Lewica': 'img/lewica.jpg',
    'PSL': 'img/psl.png',
    'Polska 2050': 'img/2050.jpg'
  };
  logoImg.src = logoMap[nazwaPartii] || 'img/default.png';
  logoImg.alt = 'Logo partii ' + nazwaPartii;
}
document.getElementById("moneyDisplay").textContent = 250; // lub zmienna np. partyMoney
document.getElementById("corruptionDisplay").textContent = 7; // przykładowa wartość
function otworzOknoTury(nr, automatyczna = false) {
  if (automatyczna) return;

  // Sprawdź, czy tura ma już zaplanowaną akcję
  if (zaplanowaneAkcje[nr]) {
    alert("Ta tura ma już zaplanowaną akcję.");
    return;
  }
  wybranaTuraDoPlanowania = nr; // TO JEST KLUCZOWE!
  document.getElementById("numerTury").textContent = nr;
  document.getElementById("turaModal").style.display = "flex";
  document.getElementById("numerTury").textContent = nr;
  document.getElementById("turaModal").style.display = "flex";

  // Ewentualne wyświetlenie sondażu rządowego
  if (zaplanowanySondaz === "rzadowy" && nr === zaplanowanaTuraSondazu) {
    document.getElementById("rzadowySondazModal").style.display = "flex";
    zaplanowanySondaz = null;
    zaplanowanaTuraSondazu = null;
  }

  // Ewentualne wyświetlenie sondażu parlamentarnego
  if (zaplanowanySondazParlamentarny && nr === zaplanowanaTuraParlamentarna) {
    pokazParlamentarnySondaz();
    zaplanowanySondazParlamentarny = false;
    zaplanowanaTuraParlamentarna = null;
  }
  
}

function zamknijTure() {
  document.getElementById("turaModal").style.display = "none";
}
window.addEventListener("DOMContentLoaded", () => {
  const wybranyRok = localStorage.getItem("wybranyRok") || "—";
  const poparcie = 42; // Przykładowa wartość — możesz zmieniać

  const displayEl = document.getElementById("supportDisplay");
  if (displayEl) {
    displayEl.textContent = `${poparcie}% | ${wybranyRok}`;
  }
   // Ustaw logo partii pod ludzikami
  const logoImg = document.getElementById("chosenPartyLogo");
  if (logoImg) {
    let logo = null;
    // Najpierw sprawdź czy gracz wybrał własną partię
    if (localStorage.getItem("czyUzywaWlasnejPartii") === "true") {
      logo = localStorage.getItem("wlasnaPartiaLogo");
    } else {
      // Pobierz nazwę partii z index.html (możesz ją zapisać do localStorage przy starcie gry)
      // Przykład: localStorage.setItem("wybranaPartiaLogo", "img/PiS.jpg");
      logo = localStorage.getItem("wybranaPartiaLogo");
    }
    if (logo) {
      logoImg.src = logo;
      logoImg.style.display = "inline-block";
    }
  }
  const nazwaPartii = localStorage.getItem("wybranaPartiaNazwa");
  if (nazwaPartii) {
    ustawLogoPartii(nazwaPartii);
  }
});
const canvas = document.getElementById("sejmCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 1200;
canvas.height = 800;

function updateStatsUI() {
  const budgetEl = document.getElementById("budgetDisplay");
  const popEl = document.getElementById("populationDisplay");
  const happyEl = document.getElementById("happinessDisplay");
  const sciEl = document.getElementById("researchDisplay");

  if (budgetEl) budgetEl.textContent = budget;
  if (popEl) popEl.textContent = 467;
  if (happyEl) happyEl.textContent = 2;
  if (sciEl) sciEl.textContent = "3/175";
}
window.onload = function () {
  const settingsIcon = document.getElementById("settingsIcon");
  if (settingsIcon) {
    settingsIcon.addEventListener("click", function () {
      window.location.href = "ustawienia.html";
    });
  }
};
let maxTura = 11
// 2) skipTura: deleguje do wykonajSkip, ale najpierw pokazuje zaplanowane sondaże
function skipTura() {
  const next = aktualnaTura + 1;

  // 📊 Sondaże parlamentarne
  if (zaplanowanySondazParlamentarny && next === zaplanowanaTuraParlamentarna) {
    pokazParlamentarnySondaz();
    zaplanowanySondazParlamentarny = false;
    zaplanowanaTuraParlamentarna = null;
    czekaNaSkip = true;
    return;
  }

  // 📊 Sondaż rządowy
  if (zaplanowanySondaz === "rzadowy" && next === zaplanowanaTuraSondazu) {
    document.getElementById("rzadowySondazModal").style.display = "flex";
    zaplanowanySondaz = null;
    zaplanowanaTuraSondazu = null;
    czekaNaSkip = true;
    return;
  }

  wykonajSkip();
  sprawdzPlakaty?.();
}
// 1) przy generowaniu/skipowaniu tur: ustawaj data-tura
function wykonajSkip() {
  aktualnaTura++;

  // 🧹 Usuń najstarszą turę z paska
  const pierwsza = document.querySelector(".turnBar .turn");
  if (pierwsza) pierwsza.remove();

  const turnBar = document.querySelector(".turnBar");
  const wszystkieTury = turnBar.querySelectorAll(".turn");

  wszystkieTury.forEach((turaDiv, index) => {
    const numerTury = aktualnaTura + index;
    const akcja = zaplanowaneAkcje[numerTury];

    // ✨ Pokaż ikonę jeśli jest zaplanowana akcja
    if (typeof akcja === "string") {
      if (akcja === "rzadowy" || akcja === "parlamentarny" || akcja === "prezydencki") {
        turaDiv.textContent = "📊";
      } else if (akcja === "wywiad") {
        turaDiv.textContent = "🎙️";
      } else {
        turaDiv.textContent = numerTury;
      }
    } else if (akcja?.typ === "kampania") {
      turaDiv.textContent = "🗳️";
    } else if (akcja?.typ === "ustawa") {
      turaDiv.textContent = "📜";
    } else if (akcja?.typ === "usunUstawe") {
      turaDiv.textContent = "🗑️";
    } else {
      turaDiv.textContent = numerTury;
    }

    turaDiv.onclick = () => otworzOknoTury(numerTury);
  });

  // ➕ Dodaj nową turę na końcu
  maxTura++;
  const nowaTura = document.createElement("div");
  nowaTura.className = "turn";
  const typ = zaplanowaneAkcje[maxTura];

  if (typ === "rzadowy" || typ === "parlamentarny" || typ === "prezydencki") {
    nowaTura.textContent = "📊";
  } else if (typ === "wywiad") {
    nowaTura.textContent = "🎙️";
  } else if (typ?.typ === "kampania") {
    nowaTura.textContent = "🗳️";
  } else if (typ?.typ === "ustawa") {
    nowaTura.textContent = "📜";
  } else if (typ?.typ === "usunUstawe") {
    nowaTura.textContent = "🗑️";
  } else {
    nowaTura.textContent = maxTura;
  }

  nowaTura.onclick = () => otworzOknoTury(maxTura);
  turnBar.appendChild(nowaTura);

  // 🔥 WYKONAJ AKCJE zaplanowane na AKTUALNĄ turę
  const akcja = zaplanowaneAkcje[aktualnaTura];
  ostatnioWykonanaAkcja = null; // reset na początku tury
  if (akcja) {
    if (akcja === "prezydencki") {
      wykonajSondazPrezydent();
      ostatnioWykonanaAkcja = "prezydencki";
    } else if (akcja === "rzadowy") {
      document.getElementById("rzadowySondazModal").style.display = "flex";
      ostatnioWykonanaAkcja = "rzadowy";
    } else if (akcja === "parlamentarny") {
      pokazParlamentarnySondaz();
      ostatnioWykonanaAkcja = "parlamentarny";
    } else if (akcja === "wywiad") {
      const wywiad = zaplanowaneWywiady[aktualnaTura];
      if (wywiad) wykonajWywiadWTejTurze(wywiad);
      ostatnioWykonanaAkcja = "wywiad";
    } else if (akcja.typ === "kampania") {
      ostatnioWykonanaAkcja = "kampania";
      // obsługa kampanii
    } else if (akcja.typ === "ustawa") {
      ostatnioWykonanaAkcja = "ustawa";
      // obsługa ustawy
    } else if (akcja.typ === "usunUstawe") {
      ostatnioWykonanaAkcja = "usunUstawe";
      // obsługa usuwania ustawy
    }
    // USUŃ akcję dopiero PO wykonaniu
    delete zaplanowaneAkcje[aktualnaTura];
    zaktualizujTureWUI(aktualnaTura);
  } else {
    ostatnioWykonanaAkcja = null;
    zaktualizujTureWUI(aktualnaTura);
  }

  otworzOknoTury(aktualnaTura, true);
}
function zamknijParlamentarnySondaz() {
  document.getElementById("parlamentarnySondazModal").style.display = "none";
  if (czekaNaSkip) {
    czekaNaSkip = false;
    wykonajSkip();
  }
}
function zaplanujSondazRzadowy() {
   const turaDocelowa = wybranaTuraDoPlanowania;
  if (zaplanowaneAkcje[turaDocelowa]) {
    alert("Na tę turę jest już zaplanowana akcja!");
    return;
  }

  if (budget < 50) {
    alert("Za mało środków na sondaż! (koszt: 50 💸)");
    return;
  }

  budget -= 50;
  updateStatsUI();

  zaplanowanySondaz = "rzadowy";
  zaplanowanaTuraSondazu = turaDocelowa;
  zaplanowaneAkcje[turaDocelowa] = "rzadowy";

  zaktualizujTureWUI(turaDocelowa);
  alert("Sondaż rządowy zaplanowany na turę " + turaDocelowa);
  zamknijPoll();

  const divs = document.querySelectorAll(".turnBar .turn");
  const turaDiv = Array.from(divs).find(div => parseInt(div.textContent) === turaDocelowa);
  if (turaDiv) {
    turaDiv.innerHTML = "📊";
  }
}
const modalOverlay = document.getElementById("modalOverlay");
const modalName = document.getElementById("modalName");
const modalDetails = document.getElementById("modalDetails");
document.getElementById("closeModal").onclick = () => {
  modalOverlay.style.display = "none";
};
const mediaOptions = [
  { name: "TVP", logo: "img/tvp.png", reach: 1000000, cost: 300 },
  { name: "TVN", logo: "img/tvn.png", reach: 950000, cost: 280 },
  { name: "Republika", logo: "img/republika.png", reach: 300000, cost: 120 },
  { name: "Polsat", logo: "img/polsat.png", reach: 850000, cost: 260 },
  { name: "Radio ZET", logo: "img/radiozet.jpg", reach: 700000, cost: 200 },
  { name: "Radio RMF", logo: "img/rmf.jpg", reach: 750000, cost: 210 },
];
let wybranaStacjaWywiadu = null; // zapamiętujemy wybraną stację

function zamknijInterview() {
  document.getElementById("interviewModal").style.display = "none";
}

function zamknijInterviewPerson() {
  document.getElementById("interviewPersonModal").style.display = "none";
}
 function pokazPollModal() {
  if (zaplanowaneAkcje[wybranaTuraDoPlanowania]) {
    alert("Nie można zaplanować więcej niż jednej akcji na tę turę.");
    return;
  }
  document.getElementById("pollModal").style.display = "flex";
  const prezydentBtn = document.getElementById("prezydentPollBtn");
  if (kampaniaPrezydenckaTrwa) {
    prezydentBtn.disabled = false;
    prezydentBtn.style.opacity = "1";
    prezydentBtn.title = "";
  } else {
    prezydentBtn.disabled = true;
    prezydentBtn.style.opacity = "0.5";
    prezydentBtn.title = "Dostępny tylko podczas kampanii prezydenckiej";
  }

  // Dodaj obsługę dla kampanii parlamentarnej
  const parlamentarnaBtn = document.getElementById("parlamentarnaPollBtn");
  if (typeof kampaniaParlamentarnaTrwa !== "undefined" && !kampaniaParlamentarnaTrwa) {
    parlamentarnaBtn.disabled = true;
    parlamentarnaBtn.style.opacity = "0.5";
    parlamentarnaBtn.title = "Dostępny tylko podczas kampanii parlamentarnej";
  } else {
    parlamentarnaBtn.disabled = false;
    parlamentarnaBtn.style.opacity = "1";
    parlamentarnaBtn.title = "";
  }

  document.getElementById("pollModal").style.display = "flex";
}


  function zamknijPoll() {
    document.getElementById("pollModal").style.display = "none";
  }
const seatSize = 20;

const marszalek = {
  x: 600, // współrzędne dopasuj do `drawSeat(600, 120, "red")`
  y: 120,
  name: "Marszałek Senatu",
  rola: "Marszałek",
  age: 55,
  party: "Prawo i Sprawiedliwość",
  partyColor: "#005bac",
  partyLogo: "img/PiS.jpg",
  poglady: "Prawicowe",
  nieobecnosci: 0,
  
  kadencje: { marszalek: 1 },
  stats: {
    popularnosc: 9,
    doswiadczenie: 10,
    lojalnosc: 10
  }
};
const vipy = [];
const rolaVipy = [
  "Szef Trybunału Konstytucyjnego",
  "Szef Państwowej Komisji Wyborczej",
  "Prezes Sądu Najwyższego",
  "Szef Kancelarii Prezydenta",
  "Szef Kancelarii Sejmu",
  "Szef Stanu",
  "Prokutaror Generalny",
  "Marszalek Sejmu",
  "Prezes Najwyższej Izby Kontroli"
];
for (let i = 0; i < 9; i++) {
  const x = 100; // stała pozycja X (np. przy lewej krawędzi)
  const y = 100 + i * (seatSize + 30); // Y rośnie co slot, odstęp 30 px
  const rola = rolaVipy[i] || "VIP";
  vipy.push({ id: i + 1, x, y, rola });
}
// --- Definicje partii ---
const PARTIE = [
  { nazwa: "Prawo i Sprawiedliwość", kolor: "#129de3", logo: "img/PiS.jpg" },
  { nazwa: "Platforma Obywatelska", kolor: "#e0670b", logo: "img/PO.jpg" },
  { nazwa: "Konfederacja", kolor: "#10317d", logo: "img/konfederacja.png" },
  { nazwa: "Polska 2050", kolor: "#e0bd0b", logo: "img/2050.jpg" },
  { nazwa: "PSL", kolor: "#1fc242", logo: "img/psl.png" },
  { nazwa: "Nowa Lewica", kolor: "#be2bcf", logo: "img/lewica.jpg" }
];
const premierPartia = PARTIE[0];
const premier = {
  x: 1100, // prawa strona, wyśrodkowany na tej samej wysokości co ministrowie
  y: 100,
  color: "darkred",
  name: "Premier RP",
  age: 55,
  party: premierPartia.nazwa,
  partyLogo: premierPartia.logo,
  partyColor: premierPartia.kolor,
  role: "Premier",
  stats: {
    popularnosc: Math.floor(1 + Math.random() * 10),
    doswiadczenie: Math.floor(1 + Math.random() * 10),
    lojalnosc: Math.floor(1 + Math.random() * 10)
  },
  nieobecnosci: Math.floor(Math.random() * 10),
  kadencje: {
    posel: Math.floor(Math.random() * 5) + 1,
    prezydent: 0
  },
  poglady: "Prawicowe"
};
const ministrowie = [
  
  {
    x: 1150,
    y: 100,
    color: "lightblue",
    name: "Minister A",
    age: 45,
    party: "X",
    role: "Minister Finansów",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Centrowe"
  },
  {
    x: 1150,
    y: 150,
    color: "lightblue",
    name: "Minister B",
    age: 50,
    party: "X",
    role: "Minister Zdrowia",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
 {
    x: 1150,
    y: 200,
    color: "lightblue",
    name: "Minister C",
    age: 50,
    party: "X",
    role: "Minister Spraw Zagranicznych",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
 {
    x: 1150,
    y: 250,
    color: "lightblue",
    name: "Minister D",
    age: 50,
    party: "X",
    role: "Minister Przemysłu",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
 {
    x: 1150,
    y: 300,
    color: "lightblue",
    name: "Minister E",
    age: 50,
    party: "X",
    role: "Minister Infrastruktury",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
  {
    x: 1150,
    y: 350,
    color: "lightblue",
    name: "Minister F",
    age: 50,
    party: "X",
    role: "Minister Rolnictwa i Rozwoju Wsi",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
  {
    x: 1150,
    y: 400,
    color: "lightblue",
    name: "Minister G",
    age: 50,
    party: "X",
    role: "Minister Edukacji",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
  {
    x: 1150,
    y: 450,
    color: "lightblue",
    name: "Minister H",
    age: 50,
    party: "X",
    role: "Minister Sprawiedliwości",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
{
    x: 1150,
    y: 500,
    color: "lightblue",
    name: "Minister I",
    age: 50,
    party: "X",
    role: "Minister Funduszy",
    stats: {
      popularnosc: Math.floor(1 + Math.random() * 10),
      doswiadczenie: Math.floor(1 + Math.random() * 10),
      lojalnosc: Math.floor(1 + Math.random() * 10)
    },
    nieobecnosci: Math.floor(Math.random() * 10),
    kadencje: {
      posel: Math.floor(Math.random() * 3) + 1,
      prezydent: 0
    },
    poglady: "Lewicowe"
  },
];
// ...po zdefiniowaniu const ministrowie = [ ... ]
ministrowie.forEach(min => {
  min.party = premierPartia.nazwa;
  min.partyColor = premierPartia.kolor;
  min.partyLogo = premierPartia.logo;
});
// --- Parametry sali i miejsc ---
const totalSeats = 72;
const liczbaPartii = PARTIE.length;
const kolejnosc = [0, 1, 2, 3, 4, 5]; // kolejność bloków partii (indeksy z PARTIE)

// --- Generowanie miejsc (półokrąg) ---
const miejsca = [];
const startRadius = 60;
const rowSpacing = 25;
const centerX = 600;
const centerY = 260;
let miejscaDoWygenerowania = totalSeats;
for (let r = 0; miejscaDoWygenerowania > 0; r++) {
  const radius = startRadius + r * rowSpacing;
  const circumference = Math.PI * radius;
  const seatsInRow = Math.min(miejscaDoWygenerowania, Math.floor(circumference / 80));
  const angleStep = Math.PI / (seatsInRow - 1);

  for (let i = 0; i < seatsInRow; i++) {
    const angle = Math.PI - i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    miejsca.push({ x, y });
    miejscaDoWygenerowania--;
    if (miejscaDoWygenerowania === 0) break;
  }
}
// --- Przydziel partie blokami sektorowymi (każda partia siedzi razem w jednym sektorze) ---
// policz ile miejsc jest w każdym rzędzie
const miejscaWrzędach = [];
let idx = 0;
let miejscaDoWygenerowania2 = totalSeats;
for (let r = 0; miejscaDoWygenerowania2 > 0; r++) {
  const radius = startRadius + r * rowSpacing;
  const circumference = Math.PI * radius;
  const seatsInRow = Math.min(miejscaDoWygenerowania2, Math.floor(circumference / 80));
  miejscaWrzędach.push(seatsInRow);
  idx += seatsInRow;
  miejscaDoWygenerowania2 -= seatsInRow;
}
const poslowie = [];;
const limitNaPartie = Math.floor(totalSeats / liczbaPartii); // np. 12
const przydzieloneDlaPartii = Array(liczbaPartii).fill(0);

let miejsceIdx = 0;
let id = 34;

for (let rzad = 0; rzad < miejscaWrzędach.length; rzad++) {
  const ileMiejscWRzedzie = miejscaWrzędach[rzad];
  // Sortuj miejsca w rzędzie po X, żeby bloki były zwarte
  const miejscaWRzedzie = miejsca.slice(miejsceIdx, miejsceIdx + ileMiejscWRzedzie)
    .sort((a, b) => a.x - b.x);

  // Wyznacz ile miejsc może jeszcze dostać każda partia (nie przekraczaj limitu)
  // Ustal ile miejsc w tym rzędzie może dostać każda partia (z tych, co zostały)
  const ileMoznaJeszcze = przydzieloneDlaPartii.map(v => limitNaPartie - v);

  // Rozdziel miejsca w rzędzie: idź po partiach od lewej, każda partia dostaje
  // tyle miejsc, ile jeszcze może, ale nie więcej niż floor(ileMiejscWRzedzie / liczbaPartii).
  // Resztę przydziel partiom z największym niedoborem do limitu.

  // 1. Podstawowy przydział
  let ileNaPartie = ileMoznaJeszcze.map((max, i) => Math.min(max, Math.floor(ileMiejscWRzedzie / liczbaPartii)));
  let suma = ileNaPartie.reduce((a, b) => a + b, 0);
  let reszta = ileMiejscWRzedzie - suma;

  // 2. Resztę daj partiom z największym niedoborem do limitu
  const niedobory = ileMoznaJeszcze
    .map((ile, idx) => ({ idx, ile }))
    .filter(obj => ileNaPartie[obj.idx] < obj.ile); // tylko tym, którzy jeszcze mogą dostać
  niedobory.sort((a, b) => b.ile - a.ile);

  let dodane = 0;
  for (let i = 0; i < niedobory.length && dodane < reszta; i++) {
    ileNaPartie[niedobory[i].idx]++;
    dodane++;
  }

  // 3. Przydziel blokami
  let col = 0;
  for (let partiaIdx = 0; partiaIdx < liczbaPartii; partiaIdx++) {
    const partia = PARTIE[kolejnosc[partiaIdx]];
    for (let i = 0; i < ileNaPartie[partiaIdx]; i++) {
      if (col >= miejscaWRzedzie.length) break;
      const miejsce = miejscaWRzedzie[col++];
      poslowie.push({
        id: id++,
        x: miejsce.x,
        y: miejsce.y,
        name: `Poseł ${id - 33}`,
        age: 30 + ((id - 34) % 30),
        party: partia.nazwa,
        partyColor: partia.kolor,
        partyLogo: partia.logo,
        stats: {
          popularnosc: Math.floor(1 + Math.random() * 10),
          doswiadczenie: Math.floor(1 + Math.random() * 10),
          lojalnosc: Math.floor(1 + Math.random() * 10)
        },
        poglady: "Centrowe",
        nieobecnosci: Math.floor(Math.random() * 30),
        kadencje: {
          posel: Math.floor(Math.random() * 5) + 1,
          prezydent: Math.random() < 0.1 ? 1 : 0
        }
      });
      przydzieloneDlaPartii[partiaIdx]++;
    }
  }
  miejsceIdx += ileMiejscWRzedzie;
}


function drawSeat(x, y, color = "#888888", logo = null) {
  const headRadius = 10;
  const bodyWidth = 14;
  const bodyHeight = 20;

  // Głowa
  ctx.beginPath();
  ctx.arc(x, y - bodyHeight / 2 - 4, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();

  // Tułów (zaokrąglony)
  ctx.beginPath();
  ctx.moveTo(x - bodyWidth / 2, y);
  ctx.quadraticCurveTo(x, y + bodyHeight, x + bodyWidth / 2, y);
  ctx.quadraticCurveTo(x, y - 8, x - bodyWidth / 2, y);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();

  // Biały kwadracik na dole
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 5, y + bodyHeight / 2 + 4, 10, 10);
  ctx.strokeRect(x - 5, y + bodyHeight / 2 + 4, 10, 10);

}
function drawPoslowie() {
  poslowie.forEach(posel => drawSeat(posel.x, posel.y, posel.partyColor, posel.partyLogo));
}
function drawBiurkoMarszalka() {
  ctx.fillStyle = "#8c6907";
  ctx.fillRect(480, 130, 240, 40); // obniżone o 40px
  drawSeat(600, 120, "red"); // głowa Marszałka
}
function drawMownica() {
  ctx.fillStyle = "black";
  ctx.fillRect(580, 220, 40, 20); // obniżone
}
function drawPremier() {
  drawSeat(premier.x, premier.y, premier.color);
}

function drawMinisters() {
  ministrowie.forEach(min => drawSeat(min.x, min.y, min.color));
}
function drawVIPs() {
  for (let i = 0; i < vipy.length; i++) {
    drawSeat(vipy[i].x, vipy[i].y, "white");
  }
}
function drawNiebieskaKropka() {
  ctx.beginPath();
  ctx.arc(600, 200, 10, 0, Math.PI * 2); // było 160
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.stroke();
}
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBiurkoMarszalka();
  drawMownica();
  drawNiebieskaKropka();
  drawPoslowie();
  drawPremier();
  drawMinisters();
  drawVIPs();
}
function ulepszPosla(id) {
  const posel = poslowie.find(p => p.id === id);
  if (budget < 50) {
    alert("Za mało środków!");
    return;
  }
  budget -= 50;

  const stats = ["popularnosc", "doswiadczenie", "lojalnosc"];
  const randomStat = stats[Math.floor(Math.random() * stats.length)];

  if (posel.stats[randomStat] < 10) {
    posel.stats[randomStat]++;
    alert(`Zwiększono ${randomStat}`);
  } else {
    alert(`${randomStat} już maksymalne`);
  }

  drawAll();
  modalOverlay.style.display = "none";
}
function pokazPostacModal(tytul, osoba) {
  modalName.textContent = tytul;
  modalDetails.innerHTML = `
    <p><strong>Rola:</strong> ${osoba.rola}</p>
    <p><strong>Wiek:</strong> ${osoba.wiek}</p>
    <p><strong>Popularność:</strong> ❤️ ${osoba.popularnosc}</p>
    <p><strong>Doświadczenie:</strong> 🧠 ${osoba.doswiadczenie}</p>
    <p><strong>Lojalność:</strong> 🤝 ${osoba.lojalnosc}</p>
  `;
  modalOverlay.style.display = "flex";
}

function isClicked(person) {
  const headRadius = 10;
  const bodyWidth = 14;
  const bodyHeight = 20;

  const distToHead = Math.hypot(person.x - mouseX, person.y - bodyHeight / 2 - 4 - mouseY);
  const clickInHead = distToHead <= headRadius;

  const clickInBody =
    mouseX >= person.x - bodyWidth / 2 &&
    mouseX <= person.x + bodyWidth / 2 &&
    mouseY >= person.y - bodyHeight / 2 &&
    mouseY <= person.y + bodyHeight / 2;

  return clickInHead || clickInBody;
}
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const headRadius = 10;
  const bodyWidth = 14;
  const bodyHeight = 20;

  function isClicked(person) {
    const distToHead = Math.hypot(person.x - mouseX, person.y - bodyHeight / 2 - 4 - mouseY);
    const clickInHead = distToHead <= headRadius;

    const clickInBody = mouseX >= person.x - bodyWidth / 2 &&
                        mouseX <= person.x + bodyWidth / 2 &&
                        mouseY >= person.y - bodyHeight / 2 &&
                        mouseY <= person.y + bodyHeight / 2;

    return clickInHead || clickInBody;
  }
 // Marszałek
;
const distToHead = Math.sqrt(Math.pow(marszalek.x - mouseX, 2) + Math.pow(marszalek.y - bodyHeight / 2 - 4 - mouseY, 2));
const clickInHead = distToHead <= headRadius;
const clickInBody = mouseX >= marszalek.x - bodyWidth / 2 &&
                    mouseX <= marszalek.x + bodyWidth / 2 &&
                    mouseY >= marszalek.y - bodyHeight / 2 &&
                    mouseY <= marszalek.y + bodyHeight / 2;

if (clickInHead || clickInBody) {
  // Dodaj logo nad modalem marszałka
  let logoDiv = document.getElementById("modalPartyLogo");
  if (!logoDiv) {
    logoDiv = document.createElement("div");
    logoDiv.id = "modalPartyLogo";
    logoDiv.style.position = "absolute";
    logoDiv.style.left = "50%";
    logoDiv.style.top = "0";
    logoDiv.style.transform = "translate(-50%,-50%)";
    logoDiv.style.zIndex = "1001";
    document.body.appendChild(logoDiv);
  }
  logoDiv.innerHTML = `
    <div style="width:70px;height:70px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0002;">
      <img src="${marszalek.partyLogo}" alt="${marszalek.party}" style="width:80px;height:80px;object-fit:contain;">
    </div>
  `;
  modalName.innerHTML = `
    <span style="font-size:1.35em;font-weight:bold;display:block;text-align:center;margin-top:32px;">${marszalek.name}</span>
  `;
  modalDetails.innerHTML = `
  <p><strong>Rola:</strong> ${marszalek.rola}</p>
  <p><strong>Wiek:</strong> ${marszalek.age}</p>
  <p><strong>Partia:</strong> <span style="color:${marszalek.partyColor};font-weight:bold;">${marszalek.party}</span></p>
  <p><strong>Popularność:</strong> ❤️ ${marszalek.stats.popularnosc}</p>
  <p><strong>Doświadczenie:</strong> 🧠 ${marszalek.stats.doswiadczenie}</p>
  <p><strong>Lojalność:</strong> 🤝 ${marszalek.stats.lojalnosc}</p>
  <p><strong>Nieobecności:</strong> ⏰ ${marszalek.nieobecnosci}</p>
  <p><strong>Kadencje:</strong> 🧑‍⚖️ ${marszalek.kadencje.marszalek || 0} marszałek, 🧑‍⚖️ ${marszalek.kadencje.posel || 0} poseł</p>
  <p><strong>Poglądy:</strong> ${marszalek.poglady}</p>
 `; 

  
  modalOverlay.style.display = "flex";
  // Ustaw logo nad modalem
  const modalContent = modalOverlay.querySelector(".modalContent");
  if (modalContent) {
    const modalRect = modalContent.getBoundingClientRect();
    logoDiv.style.top = (modalRect.top - 45) + "px";
    logoDiv.style.left = (modalRect.left + modalRect.width / 2) + "px";
  }
  return;
}

  // Posłowie
  for (const posel of poslowie) {
    if (isClicked(posel)) {
     modalName.innerHTML = `${posel.name} <img src="${posel.partyLogo}" alt="${posel.party}" style="width:32px;height:32px;vertical-align:middle;margin-left:8px;border-radius:6px;">`;
     modalDetails.innerHTML = `
        <p><strong>Wiek:</strong> ${posel.age}</p>
        <p><strong>Partia:</strong> <span style="color:${posel.partyColor};font-weight:bold;">${posel.party}</span></p>
        <p><strong>Popularność:</strong> ❤️ ${posel.stats.popularnosc}</p>
        <p><strong>Doświadczenie:</strong> 🧠 ${posel.stats.doswiadczenie}</p>
        <p><strong>Lojalność:</strong> 🤝 ${posel.stats.lojalnosc}</p>
        <p><strong>Nieobecności:</strong> ⏰ ${posel.nieobecnosci}</p>
        <p><strong>Kadencje:</strong> 🧑‍⚖️ ${posel.kadencje.posel} poseł, 🎖️ ${posel.kadencje.prezydent} prezydent</p>
        <p><strong>Poglądy:</strong> ${posel.poglady}</p>
        <hr>
        <button onclick="ulepszPosla(${posel.id})">Ulepsz za 50 💸 (budżet: ${budget})</button>
      `;
      // Dodaj poniżej:
     const logoDiv = document.getElementById("modalPartyLogo");
     if (logoDiv) {
      logoDiv.innerHTML = `<img src="${posel.partyLogo}" alt="${posel.party}">`;
      logoDiv.style.background = posel.partyColor;
     }
      modalOverlay.style.display = "flex";
      return;
    }
  }
 // Premier
 {
  const headRadius = 10;
  const bodyWidth = 14;
  const bodyHeight = 20;
  const distToHead = Math.sqrt(Math.pow(premier.x - mouseX, 2) + Math.pow(premier.y - bodyHeight / 2 - 4 - mouseY, 2));
  const clickInHead = distToHead <= headRadius;

  const clickInBody = mouseX >= premier.x - bodyWidth / 2 &&
                      mouseX <= premier.x + bodyWidth / 2 &&
                      mouseY >= premier.y - bodyHeight / 2 &&
                      mouseY <= premier.y + bodyHeight / 2;
if (clickInHead || clickInBody) {
  // Dodaj logo nad modalem
  let logoDiv = document.getElementById("modalPartyLogo");
  if (!logoDiv) {
    logoDiv = document.createElement("div");
    logoDiv.id = "modalPartyLogo";
    logoDiv.style.position = "absolute";
    logoDiv.style.left = "50%";
    logoDiv.style.top = "0";
    logoDiv.style.transform = "translate(-50%,-50%)";
    logoDiv.style.zIndex = "1001";
    document.body.appendChild(logoDiv);
  }
  logoDiv.innerHTML = `
    <div style="width:70px;height:70px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0002;">
      <img src="${premier.partyLogo}" alt="${premier.party}" style="width:80px;height:80px;object-fit:contain;">
    </div>
  `;
  // Pokaż modal jak zwykle
  modalName.innerHTML = `
    <span style="font-size:1.35em;font-weight:bold;display:block;text-align:center;margin-top:32px;">${premier.name}</span>
  `;
  modalDetails.innerHTML = `
    <p><strong>Rola:</strong> ${premier.role}</p>
    <p><strong>Wiek:</strong> ${premier.age}</p>
    <p><strong>Partia:</strong> <span style="color:${premier.partyColor};font-weight:bold;">${premier.party}</span></p>
    <p><strong>Popularność:</strong> ❤️ ${premier.stats.popularnosc}</p>
    <p><strong>Doświadczenie:</strong> 🧠 ${premier.stats.doswiadczenie}</p>
    <p><strong>Lojalność:</strong> 🤝 ${premier.stats.lojalnosc}</p>
    <p><strong>Nieobecności:</strong> ⏰ ${premier.nieobecnosci}</p>
    <p><strong>Kadencje:</strong> 🧑‍⚖️ ${premier.kadencje.posel} poseł, 🎖️ ${premier.kadencje.prezydent} prezydent</p>
    <p><strong>Poglądy:</strong> ${premier.poglady}</p>
  `;
  modalOverlay.style.display = "flex";
  // Ustaw logo nad modalem
 // Ustaw logo nad modalem
const modalContent = modalOverlay.querySelector(".modalContent");
if (modalContent) {
  const modalRect = modalContent.getBoundingClientRect();
  logoDiv.style.top = (modalRect.top - 45) + "px";
  logoDiv.style.left = (modalRect.left + modalRect.width / 2) + "px";
}
  return;
}
}

 // Ministrowie
 // Ministrowie
for (const minister of ministrowie) {
  const headRadius = 10;
  const bodyWidth = 14;
  const bodyHeight = 20;
  const distToHead = Math.sqrt(
    Math.pow(minister.x - mouseX, 2) +
    Math.pow(minister.y - bodyHeight / 2 - 4 - mouseY, 2)
  );
  const clickInHead = distToHead <= headRadius;
  const clickInBody =
    mouseX >= minister.x - bodyWidth / 2 &&
    mouseX <= minister.x + bodyWidth / 2 &&
    mouseY >= minister.y - bodyHeight / 2 &&
    mouseY <= minister.y + bodyHeight / 2;

  if (clickInHead || clickInBody) {
    // Dodaj logo nad modalem ministra
    let logoDiv = document.getElementById("modalPartyLogo");
    if (!logoDiv) {
      logoDiv = document.createElement("div");
      logoDiv.id = "modalPartyLogo";
      logoDiv.style.position = "absolute";
      logoDiv.style.left = "50%";
      logoDiv.style.top = "0";
      logoDiv.style.transform = "translate(-50%,-50%)";
      logoDiv.style.zIndex = "1001";
      document.body.appendChild(logoDiv);
    }
    logoDiv.innerHTML = `
      <div style="width:70px;height:70px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #0002;">
        <img src="${minister.partyLogo}" alt="${minister.party}" style="width:80px;height:80px;object-fit:contain;">
      </div>
    `;
    modalName.innerHTML = `
      <span style="font-size:1.35em;font-weight:bold;display:block;text-align:center;margin-top:32px;">${minister.name}</span>
    `;
    modalDetails.innerHTML = `
      <p><strong>Rola:</strong> ${minister.role}</p>
      <p><strong>Wiek:</strong> ${minister.age}</p>
      <p><strong>Partia:</strong> <span style="color:${minister.partyColor};font-weight:bold;">${minister.party}</span></p>
      <p><strong>Popularność:</strong> ❤️ ${minister.stats.popularnosc}</p>
      <p><strong>Doświadczenie:</strong> 🧠 ${minister.stats.doswiadczenie}</p>
      <p><strong>Lojalność:</strong> 🤝 ${minister.stats.lojalnosc}</p>
      <p><strong>Nieobecności:</strong> ⏰ ${minister.nieobecnosci}</p>
      <p><strong>Kadencje:</strong> 🧑‍⚖️ ${minister.kadencje.posel} poseł, 🎖️ ${minister.kadencje.prezydent} prezydent</p>
      <p><strong>Poglądy:</strong> ${minister.poglady}</p>
    `;
    modalOverlay.style.display = "flex";
    // Ustaw logo nad modalem
    const modalContent = modalOverlay.querySelector(".modalContent");
    if (modalContent) {
      const modalRect = modalContent.getBoundingClientRect();
      logoDiv.style.top = (modalRect.top - 45) + "px";
      logoDiv.style.left = (modalRect.left + modalRect.width / 2) + "px";
    }
    return;
  }
}
 // VIP-y
 for (const v of vipy) {
  const headDist = Math.sqrt(Math.pow(v.x - mouseX, 2) + Math.pow((v.y - 10 - 4) - mouseY, 2));
  const bodyClick = (
    mouseX >= v.x - 7 &&
    mouseX <= v.x + 7 &&
    mouseY >= v.y - 10 &&
    mouseY <= v.y + 10
  );
  if (headDist <= 10 || bodyClick) {
    pokazPostacModal(`VIP #${v.id}`, v);
    return;
  }
 }


});

drawAll();
function zaplanujSondazParlamentarny() {
   const turaDocelowa = wybranaTuraDoPlanowania;
  if (zaplanowaneAkcje[turaDocelowa]) {
    alert("Na tę turę jest już zaplanowana akcja!");
    return;
  }

  if (budget < 50) {
    alert("Za mało środków na sondaż! (koszt: 50 💸)");
    return;
  }
  budget -= 50;
  updateStatsUI();

  zaplanowanySondazParlamentarny = true;
  zaplanowanaTuraParlamentarna = turaDocelowa;
  zaplanowaneAkcje[turaDocelowa] = "parlamentarny";

  zaktualizujTureWUI(turaDocelowa);
  alert("Sondaż parlamentarny zaplanowany na turę " + turaDocelowa);
  zamknijPoll();

  const divs = document.querySelectorAll(".turnBar .turn");
  const turaDiv = Array.from(divs).find(div => parseInt(div.textContent) === turaDocelowa);
  if (turaDiv) {
    turaDiv.innerHTML = "📊";
  }
}
function zaktualizujTureWUI(nrTury) {
  const tury = document.querySelectorAll(".turnBar .turn");
  const indeks = nrTury - aktualnaTura;

  if (indeks >= 0 && indeks < tury.length) {
    const div = tury[indeks];
    const akcja = zaplanowaneAkcje[nrTury];

    // ZAWSZE pokazuj ikonę, jeśli akcja była zaplanowana LUB jeśli tura to ta, w której właśnie wykonujemy akcję
    if (
      akcja === "rzadowy" ||
      akcja === "parlamentarny" ||
      akcja === "prezydencki"
    ) {
      div.textContent = "📊";
    } else if (akcja === "ustawa") {
      div.textContent = "📜";
    } else if (akcja === "wywiad") {
      div.textContent = "🎙️";
    } else if (
      !akcja &&
      (nrTury === aktualnaTura && ostatnioWykonanaAkcja === "prezydencki")
    ) {
      // Jeśli właśnie wykonaliśmy sondaż prezydencki w tej turze, zostaw 📊 do końca tury
      div.textContent = "📊";
    } else if (akcja?.typ === "ustawa") {
      div.textContent = "📜";
    } else if (akcja?.typ === "kampania") {
      div.textContent = "🗳️";
    } else if (akcja?.typ === "usunUstawe") {
      div.textContent = "🗑️";
    } else {
      div.textContent = nrTury;
    }
  }
}
// Dodaj globalną zmienną do śledzenia ostatnio wykonanej akcji:
let ostatnioWykonanaAkcja = null;
function pokazParlamentarnySondaz() {
  const modal = document.getElementById("parlamentarnySondazModal");
  const container = modal.querySelector(".pollBars");
  container.innerHTML = "";

  const dane = [
    { nazwa: "Prawo i Sprawiedliwość", percent: 28.5, zmiana: -1.3, logo: "img/PiS.jpg" },
    { nazwa: "Platforma Obywatelska", percent: 26.1, zmiana: +2.1, logo: "img/PO.jpg" },
    { nazwa: "Konfederacja", percent: 19.3, zmiana: +0.5, logo: "img/konfederacja.png" },
    { nazwa: "Polska 2050", percent: 8.2, zmiana: -0.7, logo: "img/2050.jpg" },
    { nazwa: "PSL", percent: 6.4, zmiana: -0.4, logo: "img/psl.png" },
    { nazwa: "Nowa Lewica", percent: 5.1, zmiana: +0.2, logo: "img/lewica.jpg" }
  ];

  // 🔥 Dodajemy własną partię z localStorage
  const nazwaWlasna = localStorage.getItem("wlasnaPartiaNazwa");
const logoWlasne = localStorage.getItem("wlasnaPartiaLogo");

// Tylko jeśli gracz naprawdę wybrał własną partię
const czyUzywaWlasnejPartii = localStorage.getItem("czyUzywaWlasnejPartii") === "true";

if (czyUzywaWlasnejPartii && nazwaWlasna && logoWlasne) {
  dane.push({
    nazwa: nazwaWlasna,
    percent: 11.7,
    zmiana: +1.0,
    logo: logoWlasne
  });
}

  // Sortowanie malejąco po percent
 dane.sort((a, b) => b.percent - a.percent);

 const maxPercent = dane[0].percent;
  dane.forEach(partia => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "0 10px";

    const bar = document.createElement("div");
    bar.style.height = `${partia.percent * 6}px`;
    bar.style.width = "60px";
    bar.style.background = "#123";
    bar.style.position = "relative";
    bar.style.borderRadius = "4px";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.justifyContent = "center";

    const logo = document.createElement("img");
    logo.src = partia.logo;
    logo.style.height = "32px";
    logo.style.width = "32px";
    logo.style.objectFit = "cover";
    logo.style.borderRadius = "4px";

    const topText = document.createElement("div");
    topText.textContent = `${partia.percent.toFixed(1)}%`;
    topText.style.position = "absolute";
    topText.style.top = "-20px";
    topText.style.color = "black";
    topText.style.fontSize = "13px";
    topText.style.fontWeight = "bold";
    topText.style.width = "100%";
    topText.style.textAlign = "center";

    const zmianaDiv = document.createElement("div");
    zmianaDiv.textContent = (partia.zmiana > 0 ? "+" : "") + partia.zmiana.toFixed(1) + "%";
    zmianaDiv.style.position = "absolute";
    zmianaDiv.style.bottom = "-18px";
    zmianaDiv.style.fontSize = "12px";
    zmianaDiv.style.color = partia.zmiana > 0 ? "#0f0" : "#f00";
    zmianaDiv.style.width = "100%";
    zmianaDiv.style.textAlign = "center";

    bar.appendChild(logo);
    bar.appendChild(topText);
    bar.appendChild(zmianaDiv);

    wrapper.appendChild(bar);
    container.appendChild(wrapper);
  });

  modal.style.display = "flex";
}
function pokazKampaniaModal() {
  const tura = aktualnaTura + 1;
  if (zaplanowaneAkcje[tura]?.kampania || zaplanowaneAkcje[tura]?.ustawa) {
    alert("W tej turze już zaplanowano jakąś akcję.");
    return;
  }

  document.getElementById("kampaniaModal").style.display = "flex";

  // Wyłącz przyciski jeśli kampania nie trwa
  const parlamentarnaBtn = document.getElementById("kampaniaParlamentarnaBtn");
  const prezydenckaBtn = document.getElementById("kampaniaPrezydenckaBtn");

  if (parlamentarnaBtn) {
    if (!kampaniaParlamentarnaTrwa) {
      parlamentarnaBtn.disabled = true;
      parlamentarnaBtn.style.opacity = "0.5";
      parlamentarnaBtn.style.pointerEvents = "none";
      parlamentarnaBtn.title = "Dostępny tylko podczas kampanii parlamentarnej";
    } else {
      parlamentarnaBtn.disabled = false;
      parlamentarnaBtn.style.opacity = "1";
      parlamentarnaBtn.style.pointerEvents = "auto";
      parlamentarnaBtn.title = "";
    }
  }
  if (prezydenckaBtn) {
    if (!kampaniaPrezydenckaTrwa) {
      prezydenckaBtn.disabled = true;
      prezydenckaBtn.style.opacity = "0.5";
      prezydenckaBtn.style.pointerEvents = "none";
      prezydenckaBtn.title = "Dostępny tylko podczas kampanii prezydenckiej";
    } else {
      prezydenckaBtn.disabled = false;
      prezydenckaBtn.style.opacity = "1";
      prezydenckaBtn.style.pointerEvents = "auto";
      prezydenckaBtn.title = "";
    }
  }
}

function zamknijKampania() {
  document.getElementById("kampaniaModal").style.display = "none";
}
function zaplanujKampanie(typ) {
  const tura = aktualnaTura + 1;

  if (budget < 60) {
    alert("Za mało środków! (koszt: 60 💸)");
    return;
  }

  zaplanowaneAkcje[tura] = typ;
  budget -= 60;
  updateStatsUI();
  zaktualizujTureWUI(tura);
  zamknijKampania();

  if (typ === "parlamentarna") {
    document.getElementById("kampaniaParlamentarnaModal").style.display = "flex";
  } else if (typ === "prezydencka") {
    document.getElementById("kampaniaPrezydenckaModal").style.display = "flex";
  }
}
function otworzKampaniaPrezydencka() {
  document.getElementById("kampaniaPrezydenckaModal").style.display = "flex";
}
function zamknijKampaniaPrezydencka() {
  document.getElementById("kampaniaPrezydenckaModal").style.display = "none";
}
function akcjaKampaniiPrezydenckiej(typ) {
  let koszt = 0;
  let minBoost = 0;
  let maxBoost = 0;
  let dzialanie = "";

  switch (typ) {
    case "spotkanie":
      koszt = 20;
      minBoost = 2;
      maxBoost = 3;
      dzialanie = "spotkanie";
      break;
    case "debata":
      koszt = 200;
      minBoost = 5;
      maxBoost = 8;
      dzialanie = "debata";
      break;
    case "plakaty":
      koszt = 100;
      minBoost = 2;
      maxBoost = 5;
      dzialanie = "plakaty";
      break;
    case "konwencja":
      koszt = 190;
      minBoost = 4;
      maxBoost = 7;
      dzialanie = "konwencja";
      break;
  }

  const tura = wybranaTuraDoPlanowania;

  if (zaplanowaneAkcje[tura]) {
    alert("Tura już ma zaplanowaną akcję!");
    return;
  }

  zaplanowaneAkcje[tura] = {
    typ: "kampania",
    kampania: "prezydencka",
    dzialanie,
    efekty: {
      koszt,
      poparcie: Math.floor(Math.random() * (maxBoost - minBoost + 1)) + minBoost
    }
  };

  updateStatsUI();
  zaktualizujTureWUI(tura);
  zamknijKampaniaPrezydencka();

  alert(`Zaplanowano: ${dzialanie} na turę ${tura}`);
}

let poparciePartii = 42; // lub dynamicznie pobierane z gry

function otworzKampaniaParlamentarna() {
  document.getElementById("kampaniaParlamentarnaModal").style.display = "flex";
}

function zamknijKampaniaParlamentarna() {
  document.getElementById("kampaniaParlamentarnaModal").style.display = "none";
}

// Spotkanie z wyborcami
function akcjaSpotkanie() {
  if (budget < 20) return alert("Za mało środków!");

  zaplanowaneAkcje[wybranaTuraDoPlanowania] = {
    typ: "kampania",
    dzialanie: "spotkanie",
    efekty: { koszt: 20, poparcie: Math.floor(Math.random() * 2) + 2 }
  };

  zaktualizujTureWUI(wybranaTuraDoPlanowania);
  zamknijKampaniaParlamentarna(); // lub zamknijKampaniaPrezydencka()
  alert(`Zaplanowano spotkanie z wyborcami na turę ${wybranaTuraDoPlanowania}`);
}

// Debata
function akcjaDebata() {
  if (budget < 150) return alert("Za mało środków!");
  budget -= 150;
  const wzrost = Math.floor(Math.random() * 6) + 5; // 5-10%
  poparciePartii += wzrost;
  updateStatsUI();
  alert(`Udział w debacie. Wzrost poparcia: +${wzrost}%`);
}

// Plakaty (działa przez 20 tur)
let plakatyPozostaleTury = 0;
function akcjaPlakaty() {
  if (budget < 100) return alert("Za mało środków!");
  budget -= 100;
  plakatyPozostaleTury = 20;
  updateStatsUI();
  alert("Plakaty rozwieszone. Będą zwiększać poparcie przez 20 tur.");
}

// w każdej turze (dodaj w skipTura lub updateTurn)
function sprawdzPlakaty() {
  if (plakatyPozostaleTury > 0) {
    const wzrost = Math.floor(Math.random() * 3) + 4; // 4-6%
    poparciePartii += wzrost;
    plakatyPozostaleTury--;
    alert(`Plakaty zadziałały. Wzrost poparcia: +${wzrost}%. Pozostało tur: ${plakatyPozostaleTury}`);
  }
}
window.addEventListener("DOMContentLoaded", () => {
  const prezydencka = document.getElementById("kampaniaPrezydenckaModal");
  if (prezydencka) {
    prezydencka.style.display = "none";
  }
});
let wybranyPoselDoUstawy = null;
function zlozUstawe(typ) {
  if (!wybranyPoselDoUstawy) {
    alert("Najpierw wybierz posła!");
    return;
  }
  alert(`${wybranyPoselDoUstawy.name} złożył ustawę: ${typ}`);
  // TODO: Dodaj logikę głosowania, poparcia, kosztów, efektów...
  zamknijUstaweModal();
}
function zamknijUstaweModal() {
  const modal = document.getElementById("ustawaModal");
  if (modal) modal.style.display = "none";
}
document.addEventListener("DOMContentLoaded", () => {
  const zamknijBtn = document.getElementById("zamknijUstaweBtn");
  if (zamknijBtn) {
    zamknijBtn.addEventListener("click", zamknijUstaweModal);
  }
});
function zatwierdzUstawe() {
  const poselId = document.getElementById("poselSelect").value;
  const ustawa = document.getElementById("ustawaSelect").value;
  const tura = wybranaTuraDoPlanowania;

  if (!tura) return alert("Nie wybrano tury!");

  zaplanowaneAkcje[tura] = {
    typ: "ustawa",
    poselId,
    ustawa
  };
  zaktualizujTureWUI(tura);

  alert(`Poseł ID ${poselId} zgłosił projekt ustawy: ${ustawa}`);
  zamknijUstaweModal();
}

function zaplanujKampanieParlamentarna(typ) {
  const tura = wybranaTuraDoPlanowania;
  if (zaplanowaneAkcje[tura]) {
    alert("Na tę turę jest już zaplanowana akcja.");
    return;
  }

  let dane = {};
  if (typ === "spotkanie") {
    dane = { koszt: 20, poparcie: Math.floor(Math.random() * 2) + 2, dzialanie: "spotkanie" };
  } else if (typ === "debata") {
    dane = { koszt: 150, poparcie: Math.floor(Math.random() * 6) + 5, dzialanie: "debata" };
  } else if (typ === "plakaty") {
    dane = { koszt: 100, poparcie: Math.floor(Math.random() * 3) + 4, dzialanie: "plakaty", trwanie: 20 };
  }

  zaplanowaneAkcje[tura] = {
    typ: "kampania",
    kampania: "parlamentarna",
    efekty: dane
  };

 zaplanowaneAkcje[wybranaTuraDoPlanowania] = {
  typ: "kampania",
  dzialanie: "spotkanie",
  efekty: { koszt: 20, poparcie: Math.floor(Math.random() * 2) + 2 }
 };
zaktualizujTureWUI(wybranaTuraDoPlanowania);

  updateStatsUI();
  zaktualizujTureWUI(tura);
  zamknijKampaniaParlamentarna();
}
function zaplanujUstawe() {
  const turaDocelowa = wybranaTuraDoPlanowania;
  if (zaplanowaneAkcje[turaDocelowa]) {
    alert("Na tę turę jest już zaplanowana akcja!");
    return;
  }

  // Dodaj dane ustawy (tu przykładowo)
  zaplanowaneAkcje[turaDocelowa] = {
    typ: "ustawa",
    poselId: wybranyPoselDoUstawy,
    ustawa: wybranaUstawa
  };

  zaktualizujTureWUI(turaDocelowa);
  alert("Ustawa zaplanowana na turę " + turaDocelowa);
  document.getElementById("ustawaModal").style.display = "none";
}
function otworzInterviewModal() {
  // Wyczyść poprzednią listę mediów
  const mediaList = document.querySelector("#interviewModal .mediaList");
  mediaList.innerHTML = "";

  // Dodaj przyciski dla każdego medium
  mediaOptions.forEach(media => {
    const btn = document.createElement("button");
    btn.className = "mediaBtn";
    btn.innerHTML = `<img src="${media.logo}" style="height:24px;vertical-align:middle;margin-right:8px;">${media.name} (${media.cost} 💸)`;
    btn.onclick = function() {
      wybranaStacjaWywiadu = media;
      zamknijInterview();
      otworzInterviewPerson();
    };
    mediaList.appendChild(btn);
  });

  document.getElementById("interviewModal").style.display = "flex";
}
// --- MODAL WYWIADU Z WYBOREM POSŁA I TELEWIZJI ---

// Dodaj do HTML (np. na końcu <body> w gameplay.html):
// <div id="interviewModal" class="modal" style="display:none;">
//   <div class="modalContent" id="interviewModalContent"></div>
// </div>

// Funkcja otwierająca modal po kliknięciu mikrofonu
// --- Fragmenty do podmiany w funkcjach wyboru posła ---
// 1. Wybór posła do wywiadu
function otworzInterviewModal() {
  const modal = document.getElementById("interviewModal");
  const content = document.getElementById("interviewModalContent");
  modal.style.display = "flex";

  // Pobierz wybraną partię (własna lub standardowa)
  const czyWlasna = localStorage.getItem("czyUzywaWlasnejPartii") === "true";
  const wybranaNazwa = czyWlasna
    ? localStorage.getItem("wlasnaPartiaNazwa")
    : localStorage.getItem("wybranaPartiaNazwa");

  // Filtrowanie posłów po partii
  const poslowieZPartii = poslowie.filter(posel => posel.party === wybranaNazwa);

  // Krok 1: wybór posła
  content.innerHTML = `
    <h2>Wybierz posła do wywiadu</h2>
    <select id="interviewPersonSelect" style="width:90%;margin:10px 0;">
      <option value="">-- Wybierz posła --</option>
      ${poslowieZPartii.map(posel => 
        `<option value="${posel.id}">
          ${posel.name} (${posel.party}) — ❤️: ${posel.stats.popularnosc}
        </option>`
      ).join("")}
    </select>
    <div class="btn-row">
      <button id="goToMediaBtn" class="nice-btn" disabled>Dalej</button>
      <button onclick="zamknijInterviewModal()" class="nice-btn cancel">Anuluj</button>
    </div>
    <div id="mediaChoiceStep" style="display:none;"></div>
  `;
  const select = document.getElementById("interviewPersonSelect");
  const dalejBtn = document.getElementById("goToMediaBtn");
  let wybranyPosel = null;

  select.onchange = function() {
    wybranyPosel = poslowie.find(p => p.id == select.value);
    dalejBtn.disabled = !wybranyPosel;
  };

  dalejBtn.onclick = function() {
    if (!wybranyPosel) return;
    pokazMediaChoice(wybranyPosel);
  };
}

// 2. Wybór posła do usuwania ustawy
function otworzUsunUstaweModal() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.style.position = "fixed";
  modal.style.left = 0;
  modal.style.top = 0;
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.45)";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  // Pobierz wybraną partię
  const czyWlasna = localStorage.getItem("czyUzywaWlasnejPartii") === "true";
  const wybranaNazwa = czyWlasna
    ? localStorage.getItem("wlasnaPartiaNazwa")
    : localStorage.getItem("wybranaPartiaNazwa");
  const poslowieZPartii = poslowie.filter(posel => posel.party === wybranaNazwa);

  modal.innerHTML = `
    <div class="modalContent" style="
      max-width: 400px;
      width: 95%;
      background:rgb(92, 92, 94);
      border-radius: 16px;
      box-shadow: 0 8px 32px #0002;
      padding: 32px 28px 24px 28px;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    ">
      <h2 style="margin-bottom: 18px; text-align:center; color:#222;">🗑️ Usuń ustawę</h2>
      <label style="font-weight:600; margin-bottom:6px;">Wybierz posła:</label>
      <select id="usunPoselSelect" style="
        width:100%;margin-bottom:18px;padding:10px 12px;
        border-radius:7px;border:2px solid #b6b6d6;font-size:1.08rem;
        background:#504E4E;outline:none;transition:.2s;border-color:#b6b6d6;
        color:#fff;
      ">
        <option value="">-- Wybierz posła --</option>
        ${poslowieZPartii.map(posel =>
          `<option value="${posel.id}">
            ${posel.name} (${posel.party}) — 🧠: ${posel.stats.doswiadczenie}
          </option>`
        ).join("")}
      </select>
      <div id="usunUstawaDiv" style="display:none;">
        <label style="font-weight:600; margin-bottom:6px;">Wybierz ustawę do usunięcia:</label>
        <select id="usunUstawaSelect" style="
          width:100%;margin-bottom:18px;padding:10px 12px;
          border-radius:7px;border:2px solid #b6b6d6;font-size:1.08rem;
          background:#504E4E;outline:none;transition:.2s;border-color:#b6b6d6;
          color:#fff;
        ">
          <option value="">-- Wybierz ustawę --</option>
          ${aktywneUstawy.map(ustawa => {
            // Opis efektów
            const efekty = ustawa.efekty
              ? Object.entries(ustawa.efekty)
                  .map(([k, v]) => {
                    let ikona = "";
                    if (k === "budget") ikona = "💰";
                    if (k === "happiness") ikona = "😊";
                    if (k === "research") ikona = "🧪";
                    return `${ikona}${v > 0 ? "+" : ""}${v}`;
                  })
                  .join(", ")
              : "";
            return `<option value="${ustawa.id}">${ustawa.nazwa}${efekty ? " (" + efekty + ")" : ""}</option>`;
          }).join("")}
        </select>
        <button id="zatwierdzUsuniecieUstawyBtn" class="nice-btn" disabled style="
          width:100%;padding:10px 0;font-size:1.1rem;
          background:#e74c3c;color:#fff;border:none;border-radius:7px;
          font-weight:600;cursor:pointer;transition:.2s;
          box-shadow:0 2px 8px #e74c3c22;
        ">Usuń ustawę</button>
      </div>
      <button onclick="document.body.removeChild(this.closest('.modal'))" class="nice-btn cancel" style="
        margin-top:14px;width:100%;padding:9px 0;font-size:1rem;
        background:#bbb;color:#222;border:none;border-radius:7px;
        font-weight:500;cursor:pointer;transition:.2s;
      ">Anuluj</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  const poselSelect = modal.querySelector("#usunPoselSelect");
  const ustawaDiv = modal.querySelector("#usunUstawaDiv");
  const ustawaSelect = modal.querySelector("#usunUstawaSelect");
  const zatwierdzBtn = modal.querySelector("#zatwierdzUsuniecieUstawyBtn");

  poselSelect.onchange = function() {
    ustawaDiv.style.display = poselSelect.value ? "block" : "none";
    zatwierdzBtn.disabled = true;
    ustawaSelect.value = "";
  };

  ustawaSelect.onchange = function() {
    zatwierdzBtn.disabled = !ustawaSelect.value;
  };

  zatwierdzBtn.onclick = function() {
    const poselId = poselSelect.value;
    const ustawaId = ustawaSelect.value;
    if (!poselId || !ustawaId) return;

    zaplanowaneAkcje[wybranaTuraDoPlanowania] = {
      typ: "usunUstawe",
      poselId,
      ustawaId
    };
    zaktualizujTureWUI(wybranaTuraDoPlanowania);

    alert(`Poseł ID ${poselId} złoży projekt usunięcia ustawy ID ${ustawaId} w turze ${wybranaTuraDoPlanowania}`);
    document.body.removeChild(modal);
  };
}
// 3. Wybór posła do proponowania nowej ustawy
function otworzUstaweModal() {
  const modal = document.getElementById("ustawaModal");
  const poselSelect = document.getElementById("poselSelect");
  const ustawaOpcje = document.getElementById("ustawaOpcje");
  const ustawaSelect = document.getElementById("ustawaSelect");

  // Pobierz wybraną partię
  const czyWlasna = localStorage.getItem("czyUzywaWlasnejPartii") === "true";
  const wybranaNazwa = czyWlasna
    ? localStorage.getItem("wlasnaPartiaNazwa")
    : localStorage.getItem("wybranaPartiaNazwa");
  const poslowieZPartii = poslowie.filter(posel => posel.party === wybranaNazwa);

  poselSelect.innerHTML = ""; // wyczyść starą listę
  ustawaOpcje.style.display = "none";

  poslowieZPartii.forEach(posel => {
    const opt = document.createElement("option");
    opt.value = posel.id;
    opt.textContent = `${posel.name} (${posel.party}) — 🧠: ${posel.stats.doswiadczenie}`;
    poselSelect.appendChild(opt);
  });

  // Dodaj efekty ustaw w select
  if (ustawaSelect) {
    ustawaSelect.innerHTML = `<option value="">-- Wybierz ustawę --</option>` +
      aktywneUstawy.map(ustawa => {
        const efekty = ustawa.efekty
          ? Object.entries(ustawa.efekty)
              .map(([k, v]) => {
                let ikona = "";
                if (k === "budget") ikona = "💰";
                if (k === "happiness") ikona = "😊";
                if (k === "research") ikona = "🧪";
                return `${ikona}${v > 0 ? "+" : ""}${v}`;
              })
              .join(", ")
          : "";
        return `<option value="${ustawa.id}">${ustawa.nazwa}${efekty ? " (" + efekty + ")" : ""}</option>`;
      }).join("");
  }

  poselSelect.onchange = () => {
    ustawaOpcje.style.display = "block";
  };

  modal.style.display = "flex";
}
// Funkcja pokazująca wybór telewizji
function pokazMediaChoice(posel) {
  const mediaDiv = document.getElementById("mediaChoiceStep");
  mediaDiv.style.display = "block";
  mediaDiv.innerHTML = `
  <h3>Wybierz telewizję</h3>
  <div class="media-list">
    ${mediaOptions.map(media => `
      <button class="mediaBtn" onclick="zaplanujWywiad(${posel.id}, '${media.name}', wybranaTuraDoPlanowania)">
        <img src="${media.logo}" alt="${media.name}">
        <div class="media-info">
          <span><b>${media.name}</b></span>
          <div class="media-row">
            <span class="media-cost">${media.cost}</span>
            <span class="media-reach">${media.reach.toLocaleString()}</span>
          </div>
        </div>
      </button>
    `).join("")}
  </div>
`;
}
// Funkcja wykonująca wywiad
function wykonajWywiad(poselId, mediaName) {
  const posel = poslowie.find(p => p.id == poselId);
  const media = mediaOptions.find(m => m.name === mediaName);
  if (!posel || !media) return;

  if (budget < media.cost) {
    alert("Za mało środków na wywiad!");
    return;
  }
  budget -= media.cost;

  // Przykładowy wzrost poparcia: 1% za każde 200 tys. publiczności
  const wzrost = Math.max(1, Math.round(media.reach / 200000));
  poparciePartii += wzrost;

  updateStatsUI();
  zamknijInterviewModal();
  alert(`Wywiad posła ${posel.name} w ${media.name}!\nKoszt: ${media.cost} 💸\nPubliczność: ${media.reach.toLocaleString()}\nPoparcie partii wzrosło o +${wzrost}%`);
}

// Funkcja zamykająca modal
function zamknijInterviewModal() {
  document.getElementById("interviewModal").style.display = "none";
}
function zaplanujWywiad(poselId, mediaName, turaDocelowa) {
  if (zaplanowaneAkcje[turaDocelowa]) {
    alert("Na tę turę jest już zaplanowana akcja!");
    return;
  }
  const media = mediaOptions.find(m => m.name === mediaName);
  if (budget < media.cost) {
    alert("Za mało środków na wywiad!");
    return;
  }
  budget -= media.cost;
  updateStatsUI();

  zaplanowaneWywiady[turaDocelowa] = { poselId, mediaName };
  zaplanowaneAkcje[turaDocelowa] = "wywiad";
  zaktualizujTureWUI(turaDocelowa);

  alert(`Wywiad zaplanowany na turę ${turaDocelowa}!`);
  zamknijInterviewModal();
}
// Dodaj na górze pliku lub w odpowiednim miejscu:
const WYPOWIEDZI_WYWIAD = [
  { tekst: "Obiecuję reformy w edukacji", typ: "obietnica" },
  { tekst: "Krytykuję opozycję za brak działań", typ: "zwykla" },
  { tekst: "Chwalę własną partię za sukcesy", typ: "zwykla" },
  { tekst: "Zapowiadam obniżkę podatków", typ: "obietnica" },
  { tekst: "Podkreślam znaczenie dialogu społecznego", typ: "zwykla" },
  { tekst: "Atakuję media za nierzetelność", typ: "zwykla" },
  { tekst: "Zapowiadam wsparcie dla przedsiębiorców", typ: "obietnica" },
  { tekst: "Mówię o walce z korupcją", typ: "zwykla" }
];
function wykonajWywiadWTejTurze({ poselId, mediaName }) {
  const posel = poslowie.find(p => p.id == poselId);
  const media = mediaOptions.find(m => m.name === mediaName);
  if (!posel || !media) return;

  // Stwórz modal wyboru wypowiedzi z logo stacji w rogu
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.display = "flex";
  modal.style.zIndex = 9999;
  modal.style.position = "fixed";
  modal.style.left = 0;
  modal.style.top = 0;
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.4)";
  modal.innerHTML = `
    <div class="modalContent" style="max-width:440px; position:relative; padding-top:38px;">
      <img src="${media.logo}" alt="${media.name}" style="position:absolute; top:12px; right:18px; width:48px; height:48px; border-radius:8px; box-shadow:0 2px 8px #0003; background:#fff; object-fit:contain;">
      <h2 style="margin-bottom:8px;">Wywiad: ${posel.name} w ${media.name}</h2>
      <p style="margin-bottom:18px;">Wybierz <b>3 różne</b> rzeczy, które chcesz powiedzieć w wywiadzie:</p>
      <div style="display:flex; flex-direction:column; gap:16px; margin:18px 0;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="min-width:32px; font-weight:600; color:#2563eb;">1.</span>
          <select id="wywiadSelect1" class="nice-btn" style="flex:1; font-size:1.08rem; padding:8px 12px; border-radius:7px; border:2px solid #2563eb;"></select>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="min-width:32px; font-weight:600; color:#2563eb;">2.</span>
          <select id="wywiadSelect2" class="nice-btn" style="flex:1; font-size:1.08rem; padding:8px 12px; border-radius:7px; border:2px solid #2563eb;"></select>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="min-width:32px; font-weight:600; color:#2563eb;">3.</span>
          <select id="wywiadSelect3" class="nice-btn" style="flex:1; font-size:1.08rem; padding:8px 12px; border-radius:7px; border:2px solid #2563eb;"></select>
        </div>
      </div>
      <button id="zakonczWywiadBtn" class="nice-btn" style="margin-top:18px; font-size:1.1rem; padding:10px 32px;" disabled>Zakończ wywiad</button>
    </div>
  `;
  document.body.appendChild(modal);

  function fillSelect(select, exclude1, exclude2) {
    select.innerHTML = `<option value="">-- Wybierz wypowiedź --</option>` +
      WYPOWIEDZI_WYWIAD
        .filter(w => w.tekst !== exclude1 && w.tekst !== exclude2)
        .map(w => {
          const isPromise = w.tekst.startsWith("Obiecuję") || w.tekst.startsWith("Zapowiadam");
          const bg = isPromise ? "background:#38d46b;color:#fff;" : "background:#4e9af1;color:#fff;";
          return `<option value="${w.tekst}" style="${bg}">${w.tekst}</option>`;
        })
        .join("");
  }
  const s1 = modal.querySelector("#wywiadSelect1");
  const s2 = modal.querySelector("#wywiadSelect2");
  const s3 = modal.querySelector("#wywiadSelect3");
  fillSelect(s1);
  fillSelect(s2);
  fillSelect(s3);

  function updateSelects() {
    const v1 = s1.value;
    const v2 = s2.value;
    const v3 = s3.value;
    fillSelect(s1, v2, v3);
    s1.value = v1;
    fillSelect(s2, v1, v3);
    s2.value = v2;
    fillSelect(s3, v1, v2);
    s3.value = v3;

    const ok = v1 && v2 && v3 && v1 !== v2 && v1 !== v3 && v2 !== v3;
    modal.querySelector("#zakonczWywiadBtn").disabled = !ok;
  }
  s1.onchange = updateSelects;
  s2.onchange = updateSelects;
  s3.onchange = updateSelects;

  modal.querySelector("#zakonczWywiadBtn").onclick = function() {
    const v1 = s1.value, v2 = s2.value, v3 = s3.value;
    function efekt(tekst) {
      const w = WYPOWIEDZI_WYWIAD.find(x => x.tekst === tekst);
      if (!w) return 0;
      if (w.tekst.startsWith("Obiecuję") || w.tekst.startsWith("Zapowiadam")) {
        return Math.floor(Math.random() * 2) + 2; // 2-3%
      }
      return Math.floor(Math.random() * 2); // 0-1%
    }
    const e1 = efekt(v1);
    const e2 = efekt(v2);
    const e3 = efekt(v3);
    const sumaSurowa = e1 + e2 + e3 + Math.max(1, Math.round(media.reach / 200000));

    // Ogranicz efekt do zakresu [-2, 2]
    const suma = Math.max(-2, Math.min(2, sumaSurowa));
    poparciePartii += suma;
    updateStatsUI();
    alert(
      `Wywiad zakończony!\n\n${v1} (+${e1}%)\n${v2} (+${e2}%)\n${v3} (+${e3}%)\n` +
      `Efekt mediów: +${Math.max(1, Math.round(media.reach / 200000))}%\n\nPoparcie partii ${suma >= 0 ? "wzrosło" : "spadło"} o ${suma > 0 ? "+" : ""}${suma}% (maksymalnie +/-2%)`
    );
    document.body.removeChild(modal);
  };
}

// Przykładowa tablica aktywnych ustaw (umieść na górze pliku lub tam, gdzie masz inne dane gry)
// Przykładowa tablica aktywnych ustaw z efektami
const aktywneUstawy = [
  { id: 1, nazwa: "Ustawa o podatkach", efekty: { budget: +50, happiness: -1 } },
  { id: 2, nazwa: "Ustawa o edukacji", efekty: { budget: -20, research: +2, happiness: +1 } },
  { id: 3, nazwa: "Ustawa o zdrowiu publicznym", efekty: { budget: -30, happiness: +2 } },
  { id: 4, nazwa: "Ustawa o ochronie środowiska", efekty: { budget: -15, happiness: +1, research: +1 } }
];

// Funkcja do przeliczania efektów wszystkich aktywnych ustaw
function przeliczEfektyUstaw() {
  let sumaBudget = 0;
  let sumaHappiness = 0;
  let sumaResearch = 0;

  aktywneUstawy.forEach(u => {
    if (u.efekty) {
      if (u.efekty.budget) sumaBudget += u.efekty.budget;
      if (u.efekty.happiness) sumaHappiness += u.efekty.happiness;
      if (u.efekty.research) sumaResearch += u.efekty.research;
    }
  });

  // Dodaj do globalnych statystyk
  budget += sumaBudget;
  // Załóżmy, że masz zmienne happiness i research
  if (typeof happiness !== "undefined") happiness += sumaHappiness;
  if (typeof research !== "undefined") research += sumaResearch;

  updateStatsUI();
}

// Wywołuj tę funkcję np. po każdej turze lub po dodaniu/uchyleniu ustawy
// przeliczEfektyUstaw();
// Skrypt do podpięcia otwierania modala po kliknięciu ikony kosza
// Załóżmy, że kosz ma klasę .usun-ustawe-btn lub id="usunUstaweBtn"
// Jeśli masz wiele koszy, użyj querySelectorAll i pętli

document.addEventListener("DOMContentLoaded", () => {
  // Jeśli masz jeden kosz:
  const kosz = document.getElementById("usunUstaweBtn");
  if (kosz) {
    kosz.onclick = otworzUsunUstaweModal;
  }

  // Jeśli masz wiele koszy (np. przy każdej turze):
  document.querySelectorAll(".usun-ustawe-btn").forEach(btn => {
    btn.onclick = otworzUsunUstaweModal;
  });
});
function zaplanujSondazPrezydencki() {
  const turaDocelowa = wybranaTuraDoPlanowania;
  if (zaplanowaneAkcje[turaDocelowa]) {
    alert("Na tę turę jest już zaplanowana akcja!");
    return;
  }
  if (budget < 50) {
    alert("Za mało środków na sondaż! (koszt: 50 💸)");
    return;
  }
  budget -= 50;
  updateStatsUI();

  zaplanowaneAkcje[turaDocelowa] = "prezydencki";
  zaktualizujTureWUI(turaDocelowa);
  alert("Sondaż prezydencki zaplanowany na turę " + turaDocelowa);
  zamknijPoll();

  // Ikonka na pasku tury
  const divs = document.querySelectorAll(".turnBar .turn");
  const turaDiv = Array.from(divs).find(div => parseInt(div.textContent) === turaDocelowa);
  if (turaDiv) {
    turaDiv.innerHTML = "📊";
  }
}

// Funkcja wywoływana automatycznie w wykonajSkip gdy przyjdzie odpowiednia tura
function wykonajSondazPrezydent() {
  // Tworzenie modala 1:1 jak na zdjęciu
  let modal = document.getElementById("prezydentSondazModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "prezydentSondazModal";
    modal.className = "modal";
    modal.style.display = "flex";
    modal.style.position = "fixed";
    modal.style.left = 0;
    modal.style.top = 0;
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.45)";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="modalContent" style="
      background: #f7f7fa;
      border-radius: 16px;
      box-shadow: 0 8px 32px #0002;
      padding: 32px 28px 24px 28px;
      min-width: 900px;
      max-width: 98vw;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <h2 style="margin-bottom: 38px; text-align:center; color:#222;">
        <span style="font-size:1.2em; vertical-align:middle;">📊</span> Sondaż: Na którego kandydata oddał(a)by Pan(i) głos?
      </h2>
      <div class="pollBars" style="display:flex;justify-content:center;align-items:end;gap:38px;margin-bottom:18px; margin-top:38px;">
      </div>
      <button onclick="document.body.removeChild(this.closest('.modal'))" style="
        margin-top:18px;padding:10px 32px;font-size:1.1rem;
        background:#bbb;color:#222;border:none;border-radius:7px;
        font-weight:500;cursor:pointer;transition:.2s;
      ">Zamknij</button>
    </div>
  `;

  // Kandydaci 1:1 jak na zdjęciu
  const kandydaci = [
    { imie: "Jan", nazwisko: "Kowalski", percent: 28.5, zmiana: -1.3, kolor: "#1a237e", avatar: "#1a237e" },
    { imie: "Anna", nazwisko: "Nowak", percent: 26.1, zmiana: +2.1, kolor: "#1565c0", avatar: "#1565c0" },
    { imie: "Piotr", nazwisko: "Wiśniewski", percent: 19.3, zmiana: +0.5, kolor: "#388e3c", avatar: "#388e3c" },
    { imie: "Maria", nazwisko: "Wójcik", percent: 8.2, zmiana: -0.7, kolor: "#fbc02d", avatar: "#fbc02d" },
    { imie: "Tomasz", nazwisko: "Kamiński", percent: 6.4, zmiana: -0.4, kolor: "#009688", avatar: "#009688" },
    { imie: "Ewa", nazwisko: "Lewandowska", percent: 5.1, zmiana: +0.2, kolor: "#c62828", avatar: "#c62828" }
  ];

  const container = modal.querySelector(".pollBars");
  container.innerHTML = "";

  kandydaci.forEach(k => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "0 4px";

    // Słupek
    const bar = document.createElement("div");
    bar.style.height = `${k.percent * 6}px`;
    bar.style.width = "70px";
    bar.style.background = k.kolor;
    bar.style.position = "relative";
    bar.style.borderRadius = "10px";
    bar.style.display = "flex";
    bar.style.alignItems = "center";
    bar.style.justifyContent = "center";
    bar.style.marginBottom = "8px";
    bar.style.boxShadow = "0 2px 8px #0002";

    // Procent na górze
    const topText = document.createElement("div");
    topText.textContent = `${k.percent.toFixed(1)}%`;
    topText.style.position = "absolute";
    topText.style.top = "-28px";
    topText.style.color = "#222";
    topText.style.fontSize = "20px";
    topText.style.fontWeight = "bold";
    topText.style.width = "100%";
    topText.style.textAlign = "center";

    // Zmiana pod słupkiem
    const zmianaDiv = document.createElement("div");
    zmianaDiv.textContent = (k.zmiana > 0 ? "+" : "") + k.zmiana.toFixed(1) + "%";
    zmianaDiv.style.position = "absolute";
    zmianaDiv.style.bottom = "-22px";
    zmianaDiv.style.fontSize = "18px";
    zmianaDiv.style.color = k.zmiana > 0 ? "#0f0" : "#f00";
    zmianaDiv.style.width = "100%";
    zmianaDiv.style.textAlign = "center";

    bar.appendChild(topText);
    bar.appendChild(zmianaDiv);

    // Ludzik pod słupkiem
    const avatar = document.createElement("div");
    avatar.style.width = "38px";
    avatar.style.height = "38px";
    avatar.style.borderRadius = "50%";
    avatar.style.background = k.avatar;
    avatar.style.display = "flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.marginTop = "18px";
    avatar.style.marginBottom = "4px";
    avatar.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="6" fill="#fff"/>
      <rect x="5" y="14" width="14" height="7" rx="4" fill="#fff"/>
    </svg>`;

    // Imię i nazwisko pod ludzikiem
    const nameDiv = document.createElement("div");
    nameDiv.textContent = `${k.imie} ${k.nazwisko}`;
    nameDiv.style.marginTop = "8px";
    nameDiv.style.fontSize = "16px";
    nameDiv.style.color = "#222";
    nameDiv.style.fontWeight = "500";
    nameDiv.style.textAlign = "center";

    wrapper.appendChild(bar);
    wrapper.appendChild(avatar);
    wrapper.appendChild(nameDiv);

    container.appendChild(wrapper);
  });

  modal.style.display = "flex";
}
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mainMenuBtn");
  if (menuBtn) {
    menuBtn.addEventListener("click", pokazMainMenuModal);
  }
});
function pokazMainMenuModal() {
  if (document.getElementById("mainMenuModal")) return;
  const modal = document.createElement("div");
  modal.id = "mainMenuModal";
  modal.innerHTML = `
    <div class="mainMenuModalContent">
      <button class="mainMenuModalBtn" onclick="window.location.href='senat.html'">Senat</button>
      <button class="mainMenuModalBtn" onclick="window.location.href='prezydentpalac.html'">Pałac Prezydencki</button>
      <button class="mainMenuModalBtn" onclick="window.location.href='trybunalkonstytucyjny.html'">Trybunał Konstytucyjny</button>
      <button class="mainMenuModalBtn" onclick="window.location.href='gameplay.html'">Sejm</button>
      <button class="mainMenuModalBtn" onclick="window.location.href='parlamenteuropejski.html'">Parlament Europejski</button>
      <button class="mainMenuModalBtn" onclick="document.body.removeChild(document.getElementById('mainMenuModal'))" style="margin-top:18px;">Zamknij</button>
    </div>
  `;
  modal.addEventListener("click", e => {
    if (e.target === modal) document.body.removeChild(modal);
  });
  document.body.appendChild(modal);
}
console.log(localStorage.getItem("wybranaPartiaNazwa"));
document.getElementById("chosenPartyLogo").addEventListener("click", function () {
  pokazModalPartii();
});
function pokazModalPartii() {
  // Pobierz dane partii z localStorage
  const czyWlasna = localStorage.getItem("czyUzywaWlasnejPartii") === "true";
  const nazwa = czyWlasna
    ? localStorage.getItem("wlasnaPartiaNazwa")
    : localStorage.getItem("wybranaPartiaNazwa");
  const logo = czyWlasna
    ? localStorage.getItem("wlasnaPartiaLogo")
    : localStorage.getItem("wybranaPartiaLogo");

  // Przykładowe dane (możesz pobrać z localStorage lub ustawić domyślne)
  const czlonkowie = 6;
  const ustawodawcy = 9;
  const popularnosc = 0.8;
  const sredniWiek = 48.0;
  const wybory = 17;
  const wywiady = 41;
  const najwiecejWyborcow = 29.3;
  const ideologia = [
    { icon: "🛡️", value: 2 },
    { icon: "🌐", value: 2 },
    { icon: "💵", value: 1 },
    { icon: "🌿", value: 0 },
    { icon: "⭐", value: -1 },
    { icon: "🧡", value: -2 },
    { icon: "📜", value: 0 }
  ];
  const zalozony = 2000;

  // Tworzenie modala
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.left = 0;
  modal.style.top = 0;
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.35)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = 9999;

  // Kafelki po lewej
  const kafelki = [
    { icon: "👥", label: "Informacje", modal: "Informacje o partii", color: "#6c6c6c" },
    { icon: "💵", label: "Pieniądze", modal: "Finanse Partii", color: "#6c6c6c" },
    { icon: "💷", label: "Brudne pieniądze", modal: "Korupcja", color: "#6c6c6c" },
    { icon: "👤", label: "Członkowie", modal: "Członkowie Partii", color: "#6c6c6c" },
    { icon: "💞", label: "Relacje", modal: "Relacje z innymi partiami", color: "#6c6c6c" },
    { icon: "🎯", label: "Obietnice", modal: "Lista Obietnic", color: "#6c6c6c" },
    { icon: "📧", label: "Kontakt", modal: "Wiadomości z partii", color: "#6c6c6c" }
  ];

  // Funkcja generująca główną zawartość (informacje)
  function getMainContent() {
    return `
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
        <img src="${logo}" alt="${nazwa}" style="width:54px;height:54px;border-radius:12px;background:#fff;box-shadow:0 2px 8px #0002;">
        <div style="font-size:1.3em;font-weight:bold;">${nazwa}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div><b>Członkowie:</b> ${czlonkowie} 👥</div>
        <div><b>Ustawodawcy:</b> ${ustawodawcy} 🧑‍⚖️</div>
        <div><b>Popularność:</b> ${popularnosc} ❤️</div>
        <div><b>Średni wiek:</b> ${sredniWiek}</div>
        <div><b>Wybory:</b> ${wybory} 🗳️</div>
        <div><b>Wywiady:</b> ${wywiady} 🎙️</div>
        <div><b>Największa Liczba Wyborców:</b> ${najwiecejWyborcow}%</div>
        <div><b>Ideologia:</b> ${ideologia.map(i => `${i.value}${i.icon}`).join(" ")}</div>
        <div><b>Założony:</b> ${zalozony}</div>
      </div>
    `;
  }

  modal.innerHTML = `
    <div style="display:flex;flex-direction:row;align-items:stretch;min-width:420px;">
      <div style="display:flex;flex-direction:column;gap:12px;justify-content:flex-start;padding:12px 0 12px 12px;">
        ${kafelki.map((k, i) => `
          <button class="kafelek-btn" data-kafelek="${i}" style="
            width:48px;height:48px;display:flex;align-items:center;justify-content:center;
            background:${k.color};border:none;border-radius:12px;margin-bottom:2px;
            font-size:1.6em;color:#fff;cursor:pointer;transition:.2s;
            box-shadow:0 2px 8px #0002;
          ">${k.icon}</button>
        `).join("")}
      </div>
      <div id="partiaMainContent" style="
        background: #444;
        border-radius: 18px;
        box-shadow: 0 8px 32px #0004;
        padding: 32px 28px 24px 28px;
        min-width: 340px;
        max-width: 98vw;
        color: #fff;
        font-family: inherit;
        position: relative;
        margin-left:18px;
      ">
        <button style="
          position:absolute;top:12px;right:12px;
          background:#888;border:none;color:#fff;
          font-size:1.5em;border-radius:50%;width:36px;height:36px;cursor:pointer;" onclick="this.closest('div[style]').parentNode.parentNode.remove()">&times;</button>
        <div id="partiaContentArea">
          ${getMainContent()}
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Obsługa kliknięć w kafelki
  const contentArea = modal.querySelector("#partiaContentArea");
  modal.querySelectorAll(".kafelek-btn").forEach(btn => {
    btn.onclick = function () {
      const idx = parseInt(btn.getAttribute("data-kafelek"));
      const k = kafelki[idx];

      if (idx === 0) {
        // Pokaż główne info (przeładuj główną zawartość)
        contentArea.innerHTML = getMainContent();
      } else if (idx === 1) {
        // Finanse Partii – zawartość jak na zdjęciu (tylko tekstowo, ale z przyciskami)
        contentArea.innerHTML = `
          <div style="font-size:1.5em;margin-bottom:18px;">💵 Finanse Partii</div>
          <div>
            <b>Ustawodawcy:</b> 1<br>
            <b>Ustawy</b><br>
            <b>Pożyczki</b><br>
            <button id="bankNarodowyBtn" style="margin:6px 0 6px 0;padding:6px 14px;border-radius:8px;background:#2a7cff;color:#fff;font-weight:600;border:none;cursor:pointer;">
              Bank Narodowy: 170 (1) 💵
            </button><br>
            <button id="bankSzwajcarskiBtn" style="margin:6px 0 6px 0;padding:6px 14px;border-radius:8px;background:#1e90ff;color:#fff;font-weight:600;border:none;cursor:pointer;">
              Bank Szwajcarski: 250 (2) 💵
            </button>
          </div>
        `;

        // Dodaj obsługę kliknięć na przyciski banków
        const bankNarodowyBtn = contentArea.querySelector("#bankNarodowyBtn");
        const bankSzwajcarskiBtn = contentArea.querySelector("#bankSzwajcarskiBtn");

        bankNarodowyBtn.onclick = function () {
          budget += 170;
          alert("Dodano pożyczkę z Banku Narodowego! Otrzymujesz 170 💵.");
          updateStatsUI?.();
        };

        bankSzwajcarskiBtn.onclick = function () {
          budget += 250;
          alert("Dodano pożyczkę z Banku Szwajcarskiego! Otrzymujesz 250 💵.");
          updateStatsUI?.();
        };
      } else if (idx === 2) {
        // Brudne pieniądze (korupcja)
        contentArea.innerHTML = `
          <div style="font-size:1.5em;margin-bottom:18px;">💷 Brudne pieniądze</div>
          <div style="background:#4f5250;border-radius:18px;padding:18px 18px 12px 18px;box-shadow:0 2px 8px #0002;">
            <div style="font-weight:bold;font-size:1.2em;color:#fff;margin-bottom:8px;">Korupcja</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="color:#fff;font-size:1.1em;">Korupcja</span>
              <span style="color:#fff;font-weight:bold;font-size:1.1em;">2 <span style="font-size:1.1em;">💷</span></span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
              <span style="color:#fff;font-size:1.1em;">Pranie Brudnych</span>
              <button id="pranieBrudnychBtn" style="background:#3cc97e;color:#fff;font-weight:700;border:none;border-radius:8px;padding:8px 18px;font-size:1.1em;cursor:pointer;box-shadow:0 2px 8px #0002;">
                1 💷 ➔ 1 <span style="color:#b6ffb6;">💵</span>
              </button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="color:#fff;font-size:1.1em;">Brudna gotówka</span>
              <span style="color:#fff;font-weight:bold;font-size:1.1em;">276 <span style="font-size:1.1em;">💷</span></span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
              <span style="color:#fff;font-size:1.1em;">Czysta gotówka</span>
              <span style="color:#fff;font-weight:bold;font-size:1.1em;">174 <span style="font-size:1.1em;">💵</span></span>
            </div>
          </div>
        `;

        // Obsługa przycisku "Pranie Brudnych"
        const pranieBtn = contentArea.querySelector("#pranieBrudnychBtn");
        pranieBtn.onclick = function () {
          if (typeof corruption === "undefined") window.corruption = 276;
          if (typeof budget === "undefined") window.budget = 174;
          if (corruption > 0) {
            corruption -= 1;
            budget += 1;
            alert("Wyprano 1 brudną gotówkę na czystą 💵!");
            updateStatsUI?.();
            // Odśwież widok
            contentArea.querySelectorAll("span").forEach(span => {
              if (span.textContent.includes("Brudna gotówka")) span.innerHTML = `Brudna gotówka</span><span style="color:#fff;font-weight:bold;font-size:1.1em;">${corruption} <span style="font-size:1.1em;">💷</span>`;
              if (span.textContent.includes("Czysta gotówka")) span.innerHTML = `Czysta gotówka</span><span style="color:#fff;font-weight:bold;font-size:1.1em;">${budget} <span style="font-size:1.1em;">💵</span>`;
            });
          } else {
            alert("Brak brudnej gotówki do prania!");
          }
        };
      } else if (idx === 3) {
        // Członkowie partii – tylko z wybranej partii!
        // Pobierz nazwę wybranej partii (własna lub standardowa)
        const wybranaNazwa = czyWlasna
          ? localStorage.getItem("wlasnaPartiaNazwa")
          : localStorage.getItem("wybranaPartiaNazwa");

        // Filtrowanie posłów po partii
        const czlonkowiePartii = poslowie.filter(posel => posel.party === wybranaNazwa);

        // Funkcja do renderowania listy członków
        function renderCzlonkowie() {
          contentArea.innerHTML = `
            <div style="font-size:1.5em;margin-bottom:18px;">👤 Członkowie</div>
            <div class="custom-scrollbar" style="background:#797d7a;border-radius:18px;padding:18px 8px 12px 8px;box-shadow:0 2px 8px #0002;max-height:340px;overflow-y:auto;">
              ${czlonkowiePartii.map((czl, i) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 8px;margin-bottom:6px;border-radius:10px;background:#e7c09a;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <button class="move-up-btn" data-idx="${i}" style="background:none;border:none;cursor:pointer;font-size:1.3em;color:#b36b1a;${i === 0 ? 'opacity:0.3;pointer-events:none;' : ''}">⬆️</button>
                    <button class="move-down-btn" data-idx="${i}" style="background:none;border:none;cursor:pointer;font-size:1.3em;color:#b36b1a;${i === czlonkowiePartii.length-1 ? 'opacity:0.3;pointer-events:none;' : ''}">⬇️</button>
                    <span style="font-weight:bold;font-size:1.1em;color:#3a2a1a;">${i+1}.</span>
                    <span style="color:#1a7c1a;font-size:1.3em;margin-right:2px;">🧑‍💼</span>
                    <span style="font-size:1.1em;font-weight:500;color:#3a2a1a;">
                      ${czl.name}
                      ${czl.lider ? '<span style="color:#ffd700;font-size:1.1em;margin-left:2px;">⭐</span>' : ''}
                      ${czl.nieobecnosci > 0 ? '<span style="color:#1a7cfa;font-size:1.1em;margin-left:2px;">⏰</span>' : ''}
                    </span>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="color:#e74c3c;font-size:1.1em;font-weight:bold;">${czl.stats?.popularnosc ?? czl.popularnosc} <span style="font-size:1.1em;">❤️</span></span>
                    <span style="color:#27ae60;font-size:1.1em;font-weight:bold;">${czl.stats?.doswiadczenie ?? czl.doswiadczenie} <span style="font-size:1.1em;">🧠</span></span>
                    <span style="color:#3498db;font-size:1.1em;font-weight:bold;">${czl.stats?.lojalnosc ?? czl.lojalnosc} <span style="font-size:1.1em;">🤝</span></span>
                  </div>
                </div>
              `).join("")}
            </div>
          `;

          // Obsługa strzałek
          contentArea.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.onclick = function() {
              const idx = parseInt(btn.getAttribute('data-idx'));
              if (idx > 0) {
                [czlonkowiePartii[idx-1], czlonkowiePartii[idx]] = [czlonkowiePartii[idx], czlonkowiePartii[idx-1]];
                renderCzlonkowie();
              }
            };
          });
          contentArea.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.onclick = function() {
              const idx = parseInt(btn.getAttribute('data-idx'));
              if (idx < czlonkowiePartii.length-1) {
                [czlonkowiePartii[idx+1], czlonkowiePartii[idx]] = [czlonkowiePartii[idx], czlonkowiePartii[idx+1]];
                renderCzlonkowie();
              }
            };
          });
        }

        renderCzlonkowie();
      } else if (idx === 4) {
        // --- WKLEJ TU KOD RELACJI ---
        // Relacje z innymi partiami
        const wybranaNazwa = localStorage.getItem("wybranaPartiaNazwa") || PARTIE[0].nazwa;
        const innePartie = PARTIE.filter(p => p.nazwa !== wybranaNazwa);

        // Przykładowe relacje (możesz pobierać z gry)
        const relacje = [
          { partia: innePartie[0], wartosc: 15 },
          { partia: innePartie[1], wartosc: 19 },
          { partia: innePartie[2], wartosc: 20 },
          { partia: innePartie[3], wartosc: 20 },
          { partia: innePartie[4], wartosc: 20 }
        ];

        contentArea.innerHTML = `
          <div style="font-size:1.5em;margin-bottom:18px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.3em;">👥</span>
            <span>Relacje</span>
          </div>
          <div style="background:#797d7a;border-radius:18px;padding:18px 8px 12px 8px;box-shadow:0 2px 8px #0002;">
            ${relacje.map(r => {
              // Kolory i ikony
              let kolor = "#e74c3c", liczbaKolor = "#e74c3c", pasek = "#e74c3c";
              let ikona = "🟠";
              if (r.partia.kolor === "#129de3") { ikona = "🔵"; }
              if (r.partia.kolor === "#e0670b") { ikona = "🟠"; }
              if (r.partia.kolor === "#10317d") { ikona = "🔵"; }
              if (r.partia.kolor === "#e0bd0b") { ikona = "🟡"; }
              if (r.partia.kolor === "#1fc242") { ikona = "🟢"; }
              if (r.partia.kolor === "#be2bcf") { ikona = "🟣"; }
              // Zielony pasek i liczba jeśli relacja pozytywna
              if (r.wartosc > 0 && r.wartosc < 18) { pasek = "#3ecf4a"; liczbaKolor = "#3ecf4a"; }
              return `
                <div style="background:#e7c09a;border-radius:10px;padding:10px 12px;margin-bottom:10px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.3em;">${ikona}</span>
                    <span style="font-size:1.1em;font-weight:500;color:#3a2a1a;">
                      ${r.partia.nazwa} (${r.partia.nazwa.split(" ").map(w=>w[0]).join("")})
                    </span>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
                    <div style="flex:1;height:8px;background:#d7b07a;border-radius:6px;position:relative;">
                      <div style="position:absolute;left:0;top:0;height:8px;width:${Math.min(100, r.wartosc*5)}%;background:${pasek};border-radius:6px;"></div>
                    </div>
                    <span style="font-size:1.1em;font-weight:bold;color:${liczbaKolor};min-width:24px;text-align:right;">${r.wartosc}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      // ...w funkcji pokazModalPartii, w obsłudze kafelków...
      } else if (idx === 5) {
        // Obietnice partii
        // Przykładowe dane obietnic (możesz dynamicznie pobierać z gry)
        const obietnice = [
          { tekst: "Bądź pierwszym krajem, który osiągnie 100 🏆", spelniona: false },
          { tekst: "Osiągnij budżet 20 💰", spelniona: true },
          { tekst: "Znieś podatek 📜💰", spelniona: false },
          { tekst: "Podnieś szczęście do 3 😊", spelniona: true },
          { tekst: "Podnieś szczęście do 5 😊", spelniona: false },
          { tekst: "Zainwestuj więcej w badania 🧪", spelniona: false },
          { tekst: "Podnieś szczęście do 4 😊", spelniona: true }
        ];

        contentArea.innerHTML = `
          <div style="font-size:1.5em;margin-bottom:18px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.3em;">🎯</span>
            <span>Obietnice</span>
          </div>
          <div class="custom-scrollbar" style="background:#e7c09a;border-radius:18px;padding:18px 8px 12px 8px;box-shadow:0 2px 8px #0002;max-height:340px;overflow-y:auto;">
            ${obietnice.map(o => `
              <div style="display:flex;align-items:center;gap:12px;background:${o.spelniona ? '#d4f7c5' : '#ffe6c5'};border-radius:12px;padding:10px 12px;margin-bottom:10px;">
                <span style="font-size:1.3em;">🎯</span>
                <span style="flex:1;font-size:1.08em;color:#3a2a1a;">${o.tekst}</span>
                <span style="font-size:1.3em;">${o.spelniona ? '✅' : '❌'}</span>
              </div>
            `).join("")}
          </div>
        `;
      } else if (idx === 6) {
        // Kontakt / Wiadomości partii
        // Przykładowe wiadomości (możesz dynamicznie pobierać z gry)
        const wiadomosci = [
          { tekst: "Członek opuścił partię", data: "22.2017" },
          { tekst: "Członek zmienił partię", data: "17.2017" },
          { tekst: "Członek zmienił partię", data: "42.2016" },
          { tekst: "Członek opuścił partię", data: "20.2016" },
          { tekst: "Członek opuścił partię", data: "8.2016" },
          { tekst: "Członek ukradł pieniądze z partii", data: "6.2016" },
          { tekst: "Członek zmienił partię", data: "49.2015" },
          { tekst: "Członek ukradł pieniądze z partii", data: "46.2015" },
          { tekst: "Członek opuścił partię", data: "44.2015" },
          { tekst: "Członek zmienił partię", data: "27.2015" },
          { tekst: "Członek ukradł pieniądze z partii", data: "21.2015" },
          { tekst: "Członek zmienił partię", data: "17.2015" },
          { tekst: "Ustawodawca jest uwikłany w skandal korupcyjny", data: "1.2015" }
        ];

        contentArea.innerHTML = `
          <div style="font-size:1.5em;margin-bottom:18px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.3em;">📧</span>
            <span>Wiadomości</span>
          </div>
          <div class="custom-scrollbar" style="background:#e7c09a;border-radius:18px;padding:18px 8px 12px 8px;box-shadow:0 2px 8px #0002;max-height:340px;overflow-y:auto;">
            ${wiadomosci.map(msg => `
              <div style="display:flex;align-items:center;justify-content:space-between;background:#fff3e0;border-radius:12px;padding:10px 14px;margin-bottom:10px;box-shadow:0 1px 4px #0001;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-size:1.3em;">✉️</span>
                  <span style="font-size:1.08em;color:#3a2a1a;">${msg.tekst}</span>
                </div>
                <span style="color:#b36b1a;font-weight:bold;font-size:1.08em;">${msg.data}</span>
              </div>
            `).join("")}
          </div>
        `;
      }
    };
  });
}
