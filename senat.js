const canvas = document.getElementById("senatCanvas");
const ctx = canvas.getContext("2d");
canvas.height = 800;

// PRZESUNIĘCIE WSZYSTKICH W PRAWO (zmień offsetX jak chcesz)
const offsetX = 100;

const centerX = canvas.width / 2 + offsetX;

const deskHeight = 22;
const marszalekBodyHeight = 20;
const marszalekHeadRadius = 10;

// Biurko "bliżej przodu" (niżej, aby nie zasłaniało marszałka)
const deskY = 60;

// Marszałek NAD biurkiem, nie ucięty, nie zasłania biurka
const marszalekY = deskY - marszalekBodyHeight / 2 - marszalekHeadRadius + 5;

// Senatorowie niżej, żeby nie wchodzili na biurko
const centerY = deskY + deskHeight + 35;

const firstRadius = 0;
const rowSpacing = 45;
const minGap = 38;
const startAngle = Math.PI * 0.18;
const endAngle = Math.PI * 0.82;
const totalSenators = 72;

let miejsca = [];
let num = 1;
let senatorsLeft = totalSenators;
let maxRows = 10;

for (let r = 0; r < maxRows && senatorsLeft > 0; r++) {
    let radius = firstRadius + r * rowSpacing;
    let arcLen = radius * (endAngle - startAngle);
    let count = Math.floor(arcLen / minGap);
    if (senatorsLeft - count < 0) count = senatorsLeft;
    for (let i = 0; i < count; i++) {
        let angle = (count === 1)
            ? (startAngle + endAngle) / 2
            : startAngle + (endAngle - startAngle) * (i / (count - 1));
        let x = centerX + Math.cos(angle) * radius;
        let y = centerY + Math.sin(angle) * radius;
        miejsca.push({ x, y, num: num++ });
    }
    senatorsLeft -= count;
}

function drawSenator(x, y, color = "#2196f3", num = "") {
    const headRadius = 10;
    const bodyWidth = 14;
    const bodyHeight = 20;

    // Głowa
    ctx.beginPath();
    ctx.arc(x, y - bodyHeight / 2 - 4, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tułów
    ctx.beginPath();
    ctx.moveTo(x - bodyWidth / 2, y);
    ctx.quadraticCurveTo(x, y + bodyHeight, x + bodyWidth / 2, y);
    ctx.quadraticCurveTo(x, y - 8, x - bodyWidth / 2, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();

    // Podstawa
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 5, y + bodyHeight / 2 + 4, 10, 10);
    ctx.strokeRect(x - 5, y + bodyHeight / 2 + 4, 10, 10);
}

function drawDesk(x, y, width = 120, height = 22) {
    ctx.fillStyle = "#8D5524";
    ctx.fillRect(x - width / 2, y, width, height);
    ctx.strokeStyle = "#5a3c16";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width / 2, y, width, height);
}

function drawAllSenators() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Najpierw biurko (w tle)
    drawDesk(centerX, deskY);
    // Potem marszałek (nad biurkiem, nie nachodzi na nie)
    drawSenator(centerX, marszalekY, "#c62828");
    // Potem senatorowie
    miejsca.forEach(m => drawSenator(m.x, m.y, "#2196f3", m.num));
}

drawAllSenators();
window.addEventListener('DOMContentLoaded', function() {
  // funkcja wyświetlania modala
  function pokazMainMenuModal() {
    if (document.getElementById("mainMenuModal")) return;
    const modal = document.createElement("div");
    modal.id = "mainMenuModal";
    modal.style.position = "fixed";
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = "100vw";
    modal.style.height = "100vh";
    modal.style.background = "rgba(0,0,0,0.28)";
    modal.style.display = "flex";
    modal.style.alignItems = "flex-start";
    modal.style.justifyContent = "flex-end";
    modal.style.zIndex = "4000";
    modal.innerHTML = `
      <div class="mainMenuModalContent" style="margin-top:70px;margin-right:32px;background:#6b6b6b;border-radius:16px;box-shadow:0 8px 32px #0002;padding:32px 38px 24px 38px;min-width:220px;display:flex;flex-direction:column;align-items:stretch;gap:14px;">
        <button class="mainMenuModalBtn" onclick="window.location.href='senat.html'">Senat</button>
        <button class="mainMenuModalBtn" onclick="window.location.href='prezydentpalac.html'">Pałac Prezydencki</button>
        <button class="mainMenuModalBtn" onclick="window.location.href='trybunalkonstytucyjny.html'">Trybunał Konstytucyjny</button>
        <button class="mainMenuModalBtn" onclick="window.location.href='gameplay.html'">Sejm</button>
        <button class="mainMenuModalBtn" onclick="window.location.href='parlamenteuropejski.html'">Parlament Europejski</button>
        <button class="mainMenuModalBtn" id="zamknijMenuBtn" style="margin-top:18px;">Zamknij</button>
      </div>
    `;
    modal.addEventListener("click", function(e) {
      if (e.target === modal || e.target.id === "zamknijMenuBtn") {
        document.body.removeChild(modal);
      }
    });
    document.body.appendChild(modal);
  }

  // podpinanie przycisku
  var btn = document.getElementById('mainMenuBtn');
  if (btn) {
    btn.onclick = pokazMainMenuModal;
  } else {
    console.error('Nie znaleziono przycisku mainMenuBtn!');
  }
});
// Przykładowe wartości – możesz podmieniać w dowolnym momencie gry:
let currentPartyLogo = "img/pis.png";
let currentPartyCount = 15;
let currentMoney = 250;
let currentCorruption = 7;
let currentSupport = 42;
let currentVoters = 2000;

// Ustawianie wartości na pasku statystyk:
function updateStatsBar() {
  document.getElementById("chosenPartyLogo").src = currentPartyLogo;
  document.getElementById("partyCount").textContent = currentPartyCount;
  document.getElementById("moneyDisplay").textContent = currentMoney;
  document.getElementById("corruptionDisplay").textContent = currentCorruption;
  document.getElementById("supportDisplay").textContent = currentSupport + "%";
  document.getElementById("votersDisplay").textContent = currentVoters;
}

// Funkcja do obsługi kliknięcia przycisku skipowania tury
document.getElementById("skipTurnBtn").onclick = function() {
  skipTura();
};

// Przykład funkcji skipowania tury
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
// Przykład funkcji otwierania okienka tury po kliknięciu kwadracika
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

// Wywołaj raz na start:
updateStatsBar();
