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
// funkcja guziczków prawym górnym rogu
document.getElementById('themeBtn').onclick = function() {
  document.body.classList.toggle('dark-theme');
  // Dodaj swoją logikę zmiany motywu!
};
document.getElementById('menuBtn').onclick = function() {
  alert('Tutaj możesz otworzyć menu!');
  // Zamień na własne menu/modal
};
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
