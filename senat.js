const canvas = document.getElementById("senatCanvas");
const ctx = canvas.getContext("2d");
canvas.height = 800; // ustaw wysokość na 800

const centerX = canvas.width / 2;

const deskHeight = 22;
const marszalekBodyHeight = 20;
const marszalekHeadRadius = 10;

const deskY = 0;
const marszalekY = deskY + deskHeight + marszalekBodyHeight / 2 + marszalekHeadRadius + 2;
const centerY = marszalekY + 50;

const minGap = 38;
const startAngle = Math.PI * 0.18;
const endAngle   = Math.PI * 0.82;
const firstRadius = 60;
const rowSpacing = 45;
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

    ctx.beginPath();
    ctx.arc(x, y - bodyHeight / 2 - 4, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - bodyWidth / 2, y);
    ctx.quadraticCurveTo(x, y + bodyHeight, x + bodyWidth / 2, y);
    ctx.quadraticCurveTo(x, y - 8, x - bodyWidth / 2, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.fillRect(x - 5, y + bodyHeight / 2 + 4, 10, 10);
    ctx.strokeRect(x - 5, y + bodyHeight / 2 + 4, 10, 10);
}

function drawDesk(x, y, width = 120, height = 22) {
    ctx.fillStyle = "#8D5524";
    ctx.fillRect(x - width/2, y, width, height);
    ctx.strokeStyle = "#5a3c16";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - width/2, y, width, height);
}

function drawAllSenators() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDesk(centerX, deskY);
    drawSenator(centerX, marszalekY, "#c62828");
    miejsca.forEach(m => drawSenator(m.x, m.y, "#2196f3", m.num));
}

drawAllSenators();