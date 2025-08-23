const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height, particles, mouse, connectionDistance;

function setup() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    mouse = {
        x: width / 2,
        y: height / 2,
    };

    let numParticles;
    if (width <= 768) {
        numParticles = 100;
        connectionDistance = 100;
    } else {
        numParticles = 300;
        connectionDistance = 150;
    }

    particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(i));
    }
}

class Particle {
    constructor(index) {
        this.index = index;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2 - 1;
        this.isFollower = this.index < 4;
    }

    update() {
        if (this.isFollower) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            this.x += dx * 0.1;
            this.y += dy * 0.1;
        } else {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x > width || this.x < 0) this.vx = -this.vx;
            if (this.y > height || this.y < 0) this.vy = -this.vy;
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

function handleParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / connectionDistance})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function animate() {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#001f3f');
    gradient.addColorStop(0.5, '#8A2BE2');
    gradient.addColorStop(1, '#2ECC71');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    handleParticles();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    setup();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

setup();
animate();