const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const numStars = 1000;
const stars = [];
let speed = 4;

function initStars() {
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width - canvas.width / 2,
            y: Math.random() * canvas.height - canvas.height / 2,
            z: Math.random() * canvas.width,
            prevZ: 0
        });
    }
}

function updateStars() {
    for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.prevZ = star.z;
        star.z -= speed;

        if (star.z <= 0) {
            star.x = Math.random() * canvas.width - canvas.width / 2;
            star.y = Math.random() * canvas.height - canvas.height / 2;
            star.z = canvas.width;
            star.prevZ = star.z;
        }
    }
}

function drawStars() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        
        // Calculate star position in 2D space
        const prevX = (star.x / star.prevZ) * canvas.width + canvas.width / 2;
        const prevY = (star.y / star.prevZ) * canvas.height + canvas.height / 2;
        const x = (star.x / star.z) * canvas.width + canvas.width / 2;
        const y = (star.y / star.z) * canvas.height + canvas.height / 2;
        
        // Calculate star size based on distance 
        const maxSize = 5; 
        const minSize = 0.5;
        const sizeRange = maxSize - minSize;
        const size = minSize + sizeRange * (1 - star.z / canvas.width);
        
        // Draw a line from previous position to create motion trail
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${1 - star.z / canvas.width})`;
        ctx.lineWidth = size;
        ctx.stroke();
        
        // Draw the star itself
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function animate() {
    updateStars();
    drawStars();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

initStars();
animate();