// 3D Comet-like Shapes in Elegant Space Scene with Enhanced Interaction
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const FOV = 600;
const NUM_STARS = 500;
const NUM_COMETS = 6;
const cometShapes = ['cube', 'tetrahedron', 'octahedron', 'pyramid', 'prism'];
const stars = [], comets = [];
let selectedComet = null;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

canvas.addEventListener('mousedown', e => {
    const mx = e.clientX;
    const my = e.clientY;
    for (let c of comets) {
        const p = project(c.x, c.y, c.z);
        const dist = Math.hypot(mx - p.x, my - p.y);
        if (dist < 60) {
            selectedComet = c;
            lastMouse.x = mx;
            lastMouse.y = my;
            isDragging = true;
            break;
        }
    }
});

canvas.addEventListener('mousemove', e => {
    if (isDragging && selectedComet) {
        const dx = e.clientX - lastMouse.x;
        const dy = e.clientY - lastMouse.y;

        selectedComet.x += dx;
        selectedComet.y += dy;

        selectedComet.rotation.x += dy * 0.01;
        selectedComet.rotation.y += dx * 0.01;

        lastMouse.x = e.clientX;
        lastMouse.y = e.clientY;
    }
});

canvas.addEventListener('mouseup', () => {
    selectedComet = null;
    isDragging = false;
});

function project(x, y, z) {
    const rawScale = FOV / (FOV + z);
    const scale = Math.max(0.05, Math.min(rawScale, 2.5));
    return {
        x: x * rawScale + canvas.width / 2,
        y: y * rawScale + canvas.height / 2,
        scale,
        rawScale
    };
}

function rotate(v, r) {
    let { x, y, z } = v;
    let dy = y * Math.cos(r.x) - z * Math.sin(r.x);
    let dz = y * Math.sin(r.x) + z * Math.cos(r.x);
    y = dy; z = dz;
    let dx = x * Math.cos(r.y) + z * Math.sin(r.y);
    dz = -x * Math.sin(r.y) + z * Math.cos(r.y);
    x = dx; z = dz;
    dx = x * Math.cos(r.z) - y * Math.sin(r.z);
    dy = x * Math.sin(r.z) + y * Math.cos(r.z);
    x = dx; y = dy;
    return { x, y, z };
}

function createStar() {
    return {
        x: Math.random() * 4000 - 2000,
        y: Math.random() * 4000 - 2000,
        z: Math.random() * 2000 + 100,
        speed: 0.5 + Math.random() * 1.5,
        size: 0.5 + Math.random()
    };
}

function createComet() {
    const type = cometShapes[Math.floor(Math.random() * cometShapes.length)];
    return {
        type,
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: 2200 + Math.random() * 500,
        speed: 1 + Math.random() * 1.5,
        size: 40 + Math.random() * 30,
        rotation: {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 2
        },
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01
        },
        trail: []
    };
}

function getVertices(type, size, rot) {
    let v = [];
    const s = size;
    switch (type) {
        case 'cube':
            for (let x = -1; x <= 1; x += 2)
                for (let y = -1; y <= 1; y += 2)
                    for (let z = -1; z <= 1; z += 2)
                        v.push(rotate({ x: x * s, y: y * s, z: z * s }, rot));
            break;
        case 'tetrahedron':
            v = [
                { x: s, y: s, z: s }, { x: -s, y: -s, z: s },
                { x: -s, y: s, z: -s }, { x: s, y: -s, z: -s }
            ].map(v => rotate(v, rot));
            break;
        case 'octahedron':
            v = [
                { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 },
                { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 },
                { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s }
            ].map(v => rotate(v, rot));
            break;
        case 'pyramid':
            v = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
                { x: s, y: -s, z: s }, { x: -s, y: -s, z: s },
                { x: 0, y: s, z: 0 }
            ].map(v => rotate(v, rot));
            break;
        case 'prism':
            v = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
                { x: 0, y: -s, z: s },
                { x: -s, y: s, z: -s }, { x: s, y: s, z: -s },
                { x: 0, y: s, z: s }
            ].map(v => rotate(v, rot));
            break;
    }
    return v;
}

function update() {
    stars.forEach(s => {
        s.z -= s.speed;
        if (s.z < 1) Object.assign(s, createStar());
    });
    comets.forEach(c => {
        if (!isDragging || selectedComet !== c) {
            c.z -= c.speed;
            c.rotation.x += c.rotationSpeed.x;
            c.rotation.y += c.rotationSpeed.y;
            c.rotation.z += c.rotationSpeed.z;
        }
        const center = project(c.x, c.y, c.z);
        c.trail.push(center);
        if (c.trail.length > 20) c.trail.shift();
    });
    for (let i = comets.length - 1; i >= 0; i--) {
        if (comets[i].z < -FOV - 500) comets[i] = createComet();
    }
}

function draw() {
    ctx.fillStyle = 'rgba(0,0,15,0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
        const p = project(s.x, s.y, s.z);
        ctx.fillStyle = `rgba(255,255,255,${1 - s.z / 2000})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
    });

    comets.forEach(c => {
        if (c.z < -1000) return;

        const proj = project(c.x, c.y, c.z);
        const scale = proj.scale;
        const fade = Math.max(0, Math.min(1, (2200 - c.z) / 800));

        for (let i = c.trail.length - 1; i > 0; i--) {
            const p1 = c.trail[i], p2 = c.trail[i - 1];
            ctx.strokeStyle = `rgba(255,255,255,${(i / c.trail.length) * fade})`;
            ctx.lineWidth = 0.5 * scale;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        const verts = getVertices(c.type, c.size * scale, c.rotation).map(v => ({
            x: v.x + c.x,
            y: v.y + c.y,
            z: v.z + c.z
        }));

        const edges = getEdges(c.type);
        ctx.strokeStyle = `rgba(255,255,255,${fade})`;
        ctx.lineWidth = 0.5 * scale;

        edges.forEach(([a, b]) => {
            const pa = project(verts[a].x, verts[a].y, verts[a].z);
            const pb = project(verts[b].x, verts[b].y, verts[b].z);
            if (isFinite(pa.x) && isFinite(pa.y) && isFinite(pb.x) && isFinite(pb.y)) {
                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.stroke();
            }
        });
    });
}

function getEdges(type) {
    switch (type) {
        case 'cube': return [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
        case 'tetrahedron': return [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
        case 'octahedron': return [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]];
        case 'pyramid': return [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]];
        case 'prism': return [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[0,3],[1,4],[2,5]];
        default: return [];
    }
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

function init() {
    for (let i = 0; i < NUM_STARS; i++) stars.push(createStar());
    for (let i = 0; i < NUM_COMETS; i++) comets.push(createComet());
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

init();
animate();
