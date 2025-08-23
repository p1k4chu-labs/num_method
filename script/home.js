const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height, particles, mouse;

// Configuration constants
const PARTICLE_DENSITY = 0.0001; // Adjust this value to change overall particle density
const CONNECTION_DISTANCE_FACTOR = 0.2; // Adjust this to change how far particles connect
const PARTICLE_SIZE_MIN = 0;
const PARTICLE_SIZE_MAX = 2;
const PARTICLE_SPEED_MIN = 0.5;
const PARTICLE_SPEED_MAX = 1.5;
const FOLLOWER_COUNT = 4; // Number of particles that follow the mouse
const FOLLOWER_FOLLOW_STRENGTH = 0.1;

let connectionDistance;

function setup() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    mouse = {
        x: width / 2,
        y: height / 2,
    };

    // Calculate number of particles based on screen area
    const area = width * height;
    const numParticles = Math.floor(area * PARTICLE_DENSITY);

    // Calculate connection distance based on the smaller dimension
    connectionDistance = Math.min(width, height) * CONNECTION_DISTANCE_FACTOR;

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
        this.size = Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN;
        this.vx = Math.random() * (PARTICLE_SPEED_MAX * 2) - PARTICLE_SPEED_MAX;
        this.vy = Math.random() * (PARTICLE_SPEED_MAX * 2) - PARTICLE_SPEED_MAX;
        this.isFollower = this.index < FOLLOWER_COUNT;
    }

    update() {
        if (this.isFollower) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            this.x += dx * FOLLOWER_FOLLOW_STRENGTH;
            this.y += dy * FOLLOWER_FOLLOW_STRENGTH;
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