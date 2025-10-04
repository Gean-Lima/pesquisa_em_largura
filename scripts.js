document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const canvasRect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const pathFound = [];

    const vertices = [];

    const configs = {
        radius: 15,
        lineWidth: 3,
        lastVertexSelect: null,

        definePoints: false,
        pointA: null,
        pointB: null
    };

    canvas.addEventListener('click', (event) => {
        if (configs.pointA && configs.pointB) return;

        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        const vertex = vertices.find((item) => detectColisionCircle(x, y, item.x, item.y));

        if (vertex) {
            if (configs.definePoints) {
                if (!configs.pointA) {
                    configs.pointA = vertex.uuid;

                    drawVertices();
                    return;
                }

                if (!configs.pointB && vertex.uuid !== configs.pointA) {
                    configs.pointB = vertex.uuid;

                    configs.definePoints = false;

                    drawVertices();
                    return;
                }

                return;
            }

            if (configs.lastVertexSelect && configs.lastVertexSelect.x !== vertex.x && configs.lastVertexSelect.y !== vertex.y) {
                const vertexChildIndex = configs.lastVertexSelect.childs.findIndex((item) => detectColisionCircle(x, y, item.x, item.y));

                if (vertexChildIndex >= 0) {
                    configs.lastVertexSelect.childs.splice(vertexChildIndex, 1);

                    drawVertices();
                    return;
                }

                configs.lastVertexSelect.childs.push(vertex);

                drawVertices();
                return;
            }

            if (vertex.selected) {
                vertex.selected = false;
                configs.lastVertexSelect = null;

                drawVertices();
                return;
            }

            vertex.selected = true;
            configs.lastVertexSelect = vertex;

            drawVertices();
            return;
        }

        if (configs.definePoints) return;

        vertices.push({ uuid: crypto.randomUUID(), x, y, childs: [], selected: false});

        drawVertices();
    });
    
    function drawVertices() {
        clearCanvas();

        drawEdges();

        for (let vertex of vertices) {
            if (vertex.selected) {
                ctx.lineWidth = 1;
    
                ctx.beginPath();
                ctx.arc(vertex.x, vertex.y, configs.radius * 1.5, 0, Math.PI * 2, true);
    
                ctx.strokeStyle = "green";
                ctx.stroke();
            }
    
            ctx.lineWidth = configs.lineWidth;
        
            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, configs.radius, 0, Math.PI * 2, true);
        
            ctx.fillStyle = "rgba(221, 92, 92, 1)";
            ctx.strokeStyle = "rgba(253, 70, 70, 1)";
        
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.fillStyle = 'black';
            ctx.fillRect(vertex.x - 18, vertex.y + 18, 74, 16); 

            ctx.beginPath();
            ctx.fillStyle = "white";
            ctx.font = "bold 12px serif";
            
            const uuid = vertex.uuid.substr(0, 10);
            ctx.fillText(`${uuid}...`, vertex.x - 15, vertex.y + 30);

            ctx.fillStyle = "red";

            if (vertex.uuid === configs.pointA) {
                ctx.beginPath();
                ctx.font = "bold 16px serif";
                ctx.fillText("Point A", vertex.x - 15, vertex.y - 30);
            }

            if (vertex.uuid === configs.pointB) {
                ctx.beginPath();
                ctx.font = "bold 16px serif";
                ctx.fillText("Point B", vertex.x - 15, vertex.y - 30);
            }
        }
    }

    function drawEdges() {
        for (let vertex of vertices) {
            for (let vertex2 of vertex.childs) {
                // Desenha a linha principal
                ctx.beginPath();
                ctx.moveTo(vertex.x, vertex.y);
                ctx.lineTo(vertex2.x, vertex2.y);
                ctx.strokeStyle = pathFound.includes(vertex.uuid) && pathFound.includes(vertex2.uuid)
                    ? 'yellow'
                    : 'black';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Calcula o ângulo da linha para posicionar a seta corretamente
                const angle = Math.atan2(vertex2.y - vertex.y, vertex2.x - vertex.x);
                const arrowLength = 15;
                const arrowAngle = Math.PI / 6; // 30 graus

                // Ponto onde a seta será desenhada (um pouco antes do centro do vértice destino)
                const arrowX = vertex2.x - Math.cos(angle) * configs.radius;
                const arrowY = vertex2.y - Math.sin(angle) * configs.radius;

                // Desenha a seta preenchida
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(
                    arrowX - arrowLength * Math.cos(angle - arrowAngle),
                    arrowY - arrowLength * Math.sin(angle - arrowAngle)
                );
                ctx.lineTo(
                    arrowX - arrowLength * Math.cos(angle + arrowAngle),
                    arrowY - arrowLength * Math.sin(angle + arrowAngle)
                );
                ctx.closePath();
                ctx.fillStyle = pathFound.includes(vertex.uuid) && pathFound.includes(vertex2.uuid)
                    ? 'yellow'
                    : 'black';
                ctx.fill();
            }
        }
    }

    function detectColisionCircle(x, y, x2, y2) {
        let radius = (configs.radius * 2) + 3;

        if ((((x2 - radius) < x) && ((x2 + radius) > x)) && (((y2 - radius) < y) && ((y2 + radius) > y)))
            return true;

        return false;
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }

    const startButton = document.querySelector("button:nth-of-type(1)");
    const resetButton = document.querySelector("button:nth-of-type(2)");
    const definePointsButton = document.querySelector("#definePoints");

    resetButton.addEventListener('click', () => {
        clearCanvas();
        vertices.splice(0);
        configs.lastVertexSelect = null;
        configs.definePoints = false;
        configs.pointA = null;
        configs.pointB = null;
    });

    definePointsButton.addEventListener('click', () => configs.definePoints = true);

    startButton.addEventListener('click', () => {
        console.log(bfs());
    });

    function bfs() {
        const fila = [];
        const verified = [];

        const vertexInitial = vertices.find((item) => item.uuid === configs.pointA);

        fila.push(...vertexInitial.childs.map((child) => Object.assign({ bedore: vertexInitial.uuid }, child)));

        console.log('Adicionados a fila: ', fila.map((item) => item.uuid.substr(0, 10)+'...').join(','));

        while (fila.length) {
            let vertex = fila.shift();

            if (verified.find((verifi) => verifi.uuid == vertex.uuid)) continue;
            
            console.log('Verificado: ', vertex.uuid.substr(0, 10)+'...');

            verified.push(vertex);

            if (vertex.uuid === configs.pointB) {
                bfsPath(vertex.uuid, verified);
                drawVertices();
                return 'OK!';
            }
            
            fila.push(...vertex.childs.map((child) => Object.assign({ before: vertex.uuid }, child)));

            console.log('Adicionados a fila: ', vertex.childs.map((item) => item.uuid.substr(0, 10)+'...').join(','));
            console.log();
        }

        return 'Not found!';
    }

    function bfsPath(uuid, verified) {
        let lastItem = uuid;

        verified.reverse().forEach((vertex) => {
            console.log(vertex.uuid);
            if (vertex.uuid == lastItem) {
                pathFound.push(vertex.uuid);
                lastItem = vertex.before;
            }
        });

        pathFound.unshift(configs.pointA);
    }
});


