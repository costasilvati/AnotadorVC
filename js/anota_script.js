// Classes disponíveis
const CLASSES = ["Folha sadia", "Folha com molicute", "Cigarrinha presente", "Outros"];

const imageLoader = document.getElementById("imageLoader");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const annotationList = document.getElementById("annotationList");

let img = new Image();
let annotations = [];

// Controle de zoom
let scale = 1;
let originX = 0;
let originY = 0;

// Controle de desenho
let isDrawing = false;
let startX = 0, startY = 0;
let currentRect = null;


imageLoader.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        img.onload = function () {

            // 🟢 MÁXIMO Tamanho de exibição na tela
            const maxWidth = 900;   // ajuste se quiser maior
            const maxHeight = 600;

            // 🟢 Calcular escala que mantém proporção
            const widthScale = maxWidth / img.width;
            const heightScale = maxHeight / img.height;
            const fitScale = Math.min(widthScale, heightScale);

            // 🟢 Canvas recebe o tamanho ajustado
            canvas.width = img.width * fitScale;
            canvas.height = img.height * fitScale;

            // Reset de zoom
            scale = fitScale;
            originX = 0;
            originY = 0;

            annotations = [];
            annotationList.innerHTML = "";

            draw();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});


function draw() {
    // aplicar zoom e pan
    ctx.setTransform(scale, 0, 0, scale, originX, originY);

    // limpar
    ctx.clearRect(-originX / scale, -originY / scale, canvas.width / scale, canvas.height / scale);

    // desenhar imagem ORIGINAL
    ctx.drawImage(img, 0, 0);

    // desenhar caixas existentes
    annotations.forEach((a, i) => {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = "red";
        ctx.strokeRect(a.x, a.y, a.width, a.height);

        // número da caixa
        ctx.fillStyle = "yellow";
        ctx.fillRect(a.x, a.y - 20 / scale, 25 / scale, 20 / scale);

        ctx.fillStyle = "black";
        ctx.font = `${16 / scale}px Arial`;
        ctx.fillText((i + 1).toString(), a.x + 6 / scale, a.y - 5 / scale);
    });

    // desenhar caixa atual
    if (currentRect) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    }
}

canvas.addEventListener("wheel", function (e) {
    e.preventDefault();

    const mouseX = (e.offsetX - originX) / scale;
    const mouseY = (e.offsetY - originY) / scale;

    const zoomFactor = 1.1;

    if (e.deltaY < 0) {
        scale *= zoomFactor; // zoom in
    } else {
        scale /= zoomFactor; // zoom out
    }

    // manter zoom no ponto do mouse
    originX = e.offsetX - mouseX * scale;
    originY = e.offsetY - mouseY * scale;

    draw();
});


canvas.addEventListener("mousedown", function (e) {
    isDrawing = true;

    const x = (e.offsetX - originX) / scale;
    const y = (e.offsetY - originY) / scale;

    startX = x;
    startY = y;

    currentRect = { x, y, width: 0, height: 0 };
});

canvas.addEventListener("mousemove", function (e) {
    if (!isDrawing) return;

    const x = (e.offsetX - originX) / scale;
    const y = (e.offsetY - originY) / scale;

    currentRect.width = x - startX;
    currentRect.height = y - startY;

    draw();
});

canvas.addEventListener("mouseup", function () {
    isDrawing = false;

    if (currentRect && Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
        currentRect.class = CLASSES[0];
        annotations.push(currentRect);
        addAnnotationToList(currentRect, annotations.length - 1);
    }

    currentRect = null;
    draw();
});


function addAnnotationToList(rect, index) {
    const div = document.createElement("div");
    div.className = "annotation-item";

    div.innerHTML = `
        Caixa ${index + 1}:
        <span>[x:${rect.x.toFixed(1)}, y:${rect.y.toFixed(1)},
        w:${rect.width.toFixed(1)}, h:${rect.height.toFixed(1)}]</span>
        <select onchange="updateClass(${index}, this.value)">
            ${CLASSES.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
    `;

    annotationList.appendChild(div);
}

function updateClass(index, newClass) {
    annotations[index].class = newClass;
}
