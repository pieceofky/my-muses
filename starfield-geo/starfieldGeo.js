const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const FOV = 600;
const NUM_STARS = 500;
const NUM_COMETS = 6;
const cometShapes = ['cube', 'tetrahedron', 'octahedron', 'pyramid', 'prism'];
const starColors = ['#FFFFFF', '#B4C5E4', '#FFDDAA', '#FBF2E3'];
const stars = [], comets = [];

let selectedComet = null;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };

let isCameraDragging = false;
let cameraRotation = { x: 0, y: 0 };
let lastCameraMouse = { x: 0, y: 0 };


canvas.addEventListener('mousedown', e => {
    const mx = e.clientX;
    const my = e.clientY;
    let cometClicked = false;

    for (let c of comets) {
        const p = project(c.x, c.y, c.z);
        if (p) {
            const dist = Math.hypot(mx - p.x, my - p.y);
            if (dist < 60) {
                selectedComet = c;
                lastMouse.x = mx;
                lastMouse.y = my;
                isDragging = true;
                cometClicked = true;
                break;
            }
        }
    }

    if (!cometClicked) {
        isCameraDragging = true;
        lastCameraMouse.x = mx;
        lastCameraMouse.y = my;
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
    } else if (isCameraDragging) {
        const dx = e.clientX - lastCameraMouse.x;
        const dy = e.clientY - lastCameraMouse.y;
        
        cameraRotation.y += dx * 0.005;
        cameraRotation.x += dy * 0.005;
        
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));

        lastCameraMouse.x = e.clientX;
        lastCameraMouse.y = e.clientY;
    }
});

canvas.addEventListener('mouseup', () => {
    selectedComet = null;
    isDragging = false;
    isCameraDragging = false;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function project(x, y, z) {
    let rotX = cameraRotation.x;
    let rotY = cameraRotation.y;

    let rz1 = y * Math.sin(rotX) + z * Math.cos(rotX);
    let ry1 = y * Math.cos(rotX) - z * Math.sin(rotX);
    
    let rx2 = x * Math.cos(rotY) + rz1 * Math.sin(rotY);
    let rz2 = -x * Math.sin(rotY) + rz1 * Math.cos(rotY);

    const transformedZ = rz2;
    if (transformedZ < -FOV + 10) {
        return null;
    }

    const rawScale = FOV / (FOV + transformedZ);
    const scale = Math.max(0.05, Math.min(rawScale, 2.5));
    return {
        x: rx2 * rawScale + canvas.width / 2,
        y: ry1 * rawScale + canvas.height / 2,
        scale,
        cameraZ: transformedZ
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

function getVertices(type, size, rot) {
    let v = [];
    const s = size / 2;
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
            ].map(p => rotate({x: p.x, y: p.y, z: p.z}, rot));
            break;
        case 'octahedron':
            v = [
                { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 },
                { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 },
                { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s }
            ].map(p => rotate({x: p.x, y: p.y, z: p.z}, rot));
            break;
        case 'pyramid':
            v = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
                { x: s, y: -s, z: s }, { x: -s, y: -s, z: s },
                { x: 0, y: s, z: 0 }
            ].map(p => rotate({x: p.x, y: p.y, z: p.z}, rot));
            break;
        case 'prism':
            v = [
                { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
                { x: 0, y: -s, z: s },
                { x: -s, y: s, z: -s }, { x: s, y: s, z: -s },
                { x: 0, y: s, z: s }
            ].map(p => rotate({x: p.x, y: p.y, z: p.z}, rot));
            break;
    }
    return v;
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

function createStar() {
    return {
        x: Math.random() * 4000 - 2000,
        y: Math.random() * 4000 - 2000,
        z: Math.random() * 2000 + 100,
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 1.5,
        color: starColors[Math.floor(Math.random() * starColors.length)]
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
        rotation: { x: 0, y: 0, z: 0 },
        rotationSpeed: {
            x: (Math.random() - 0.5) * 0.01,
            y: (Math.random() - 0.5) * 0.01,
            z: (Math.random() - 0.5) * 0.01
        },
        trail: []
    };
}

function update() {
    if (!isCameraDragging) {
        stars.forEach(s => {
            s.z -= s.speed;
            if (s.z < 1) {
                Object.assign(s, createStar());
                s.z = 2000;
            }
        });

        comets.forEach(c => {
            if (!isDragging || selectedComet !== c) {
                c.z -= c.speed;
                c.rotation.x += c.rotationSpeed.x;
                c.rotation.y += c.rotationSpeed.y;
                c.rotation.z += c.rotationSpeed.z;
            }
        });

        for (let i = comets.length - 1; i >= 0; i--) {
            if (comets[i].z < -FOV - 500) {
                comets[i] = createComet();
            }
        }
    }
    
    comets.forEach(c => {
        const center = project(c.x, c.y, c.z);
        if (center) {
            c.trail.push(center);
            if (c.trail.length > 20) c.trail.shift();
        } else {
            if (c.trail.length > 0) c.trail.shift();
        }
    });

}

function draw() {
    ctx.fillStyle = 'rgba(0, 0, 15, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
        const p = project(s.x, s.y, s.z);
        if (p) {
            const alpha = 1 - p.cameraZ / 2000;
            const r = parseInt(s.color.slice(1, 3), 16);
            const g = parseInt(s.color.slice(3, 5), 16);
            const b = parseInt(s.color.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, s.size * p.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    comets.forEach(c => {
        const localVerts = getVertices(c.type, c.size, c.rotation);
        const worldVerts = localVerts.map(v => ({
            x: v.x + c.x,
            y: v.y + c.y,
            z: v.z + c.z
        }));
        
        const projectedVerts = worldVerts.map(v => project(v.x, v.y, v.z));
        const visibleVerts = projectedVerts.filter(p => p !== null);

        if (visibleVerts.length === 0) return;

        const avgZ = visibleVerts.reduce((sum, p) => sum + p.cameraZ, 0) / visibleVerts.length;
        const fade = Math.max(0, Math.min(1, (1500 - avgZ) / 800));
        
        if (fade <= 0) return;
        
        if (c.trail.length > 1) {
            ctx.lineWidth = 0.5;
            for (let i = c.trail.length - 1; i > 0; i--) {
                const p1 = c.trail[i];
                const p2 = c.trail[i - 1];
                ctx.strokeStyle = `rgba(255, 255, 255, ${(i / c.trail.length) * fade * 0.5})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        const edges = getEdges(c.type);
        ctx.strokeStyle = `rgba(255, 255, 255, ${fade})`;
        ctx.lineWidth = 0.5;

        edges.forEach(([a, b]) => {
            const pa = projectedVerts[a];
            const pb = projectedVerts[b];

            if (pa && pb) {
                ctx.beginPath();
                ctx.moveTo(pa.x, pa.y);
                ctx.lineTo(pb.x, pb.y);
                ctx.stroke();
            }
        });
    });
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

function init() {
    for (let i = 0; i < NUM_STARS; i++) stars.push(createStar());
    for (let i = 0; i < NUM_COMETS; i++) comets.push(createComet());
    animate();
}

init();
