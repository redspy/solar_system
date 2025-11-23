const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 1000;

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
scene.add(pointLight);

// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Starfield Background
function createStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 10000; i++) {
        vertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000)
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}
createStars();

// Sun
const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load('textures/sun.png'),
    color: 0xffdd00 // Fallback/Tint
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Sun Glow (Simple Sprite)
const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(generateGlowTexture()),
    color: 0xffaa00,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const sprite = new THREE.Sprite(spriteMaterial);
sprite.scale.set(40, 40, 1);
sun.add(sprite);

function generateGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return canvas;
}

// Planets Data
const planetsData = [
    { name: 'Mercury', radius: 2, distance: 20, speed: 0.02, rotationSpeed: 0.004, texture: 'textures/mercury.png' },
    { name: 'Venus', radius: 3, distance: 30, speed: 0.015, rotationSpeed: 0.002, texture: 'textures/venus.png' },
    { name: 'Earth', radius: 3.2, distance: 45, speed: 0.01, rotationSpeed: 0.02, texture: 'textures/earth.png' },
    { name: 'Mars', radius: 2.5, distance: 60, speed: 0.008, rotationSpeed: 0.018, texture: 'textures/mars.png' },
    { name: 'Jupiter', radius: 8, distance: 90, speed: 0.004, rotationSpeed: 0.04, texture: 'textures/jupiter.png' },
    { name: 'Saturn', radius: 7, distance: 130, speed: 0.003, rotationSpeed: 0.038, texture: 'textures/saturn.png', hasRing: true },
    { name: 'Uranus', radius: 5, distance: 170, speed: 0.002, rotationSpeed: 0.03, color: 0x7ED6DF }, // No texture fallback
    { name: 'Neptune', radius: 5, distance: 210, speed: 0.001, rotationSpeed: 0.032, color: 0x4834D4 } // No texture fallback
];

const planets = [];
const labelsContainer = document.getElementById('labels-container');

planetsData.forEach(data => {
    // Planet Mesh
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    let material;
    if (data.texture) {
        material = new THREE.MeshStandardMaterial({ map: textureLoader.load(data.texture) });
    } else {
        material = new THREE.MeshStandardMaterial({ color: data.color });
    }
    const planet = new THREE.Mesh(geometry, material);

    // Orbit Group (Pivot)
    const orbitGroup = new THREE.Group();
    orbitGroup.add(planet);
    scene.add(orbitGroup);

    // Initial Position
    planet.position.x = data.distance;

    // Orbit Path (Visual)
    const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.1 });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);

    // Saturn Ring
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.radius + 2, data.radius + 6, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load('textures/saturn.png'), // Reuse saturn texture for ring color variation
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        // Adjust UVs for ring mapping if needed, or just use simple color
        // For simplicity, let's use a basic color ring if texture looks weird, but let's try texture
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    // Label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = data.name;
    labelsContainer.appendChild(labelDiv);

    planets.push({ mesh: planet, group: orbitGroup, data: data, label: labelDiv });
});

camera.position.set(0, 100, 200);
controls.update();

let isPlaying = true; // Auto-play by default for 3D
const playPauseBtn = document.getElementById('play-pause-btn');
const iconSpan = document.getElementById('icon');
const textSpan = document.getElementById('text');

function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        iconSpan.textContent = '⏸';
        textSpan.textContent = 'Pause';
    } else {
        iconSpan.textContent = '▶';
        textSpan.textContent = 'Play';
    }
}
playPauseBtn.addEventListener('click', togglePlay);

function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        planets.forEach(obj => {
            // Orbit (Revolution)
            obj.group.rotation.y += obj.data.speed;

            // Spin (Rotation)
            obj.mesh.rotation.y += obj.data.rotationSpeed;
        });
    }

    controls.update();
    renderer.render(scene, camera);
    updateLabels();
}

function updateLabels() {
    planets.forEach(obj => {
        // Get planet's world position
        const position = new THREE.Vector3();
        obj.mesh.getWorldPosition(position);

        // Project to 2D screen space
        position.project(camera);

        const x = (position.x * .5 + .5) * window.innerWidth;
        const y = (-(position.y * .5) + .5) * window.innerHeight;

        // Check if planet is behind the camera or too far
        // Simple check: if z > 1, it's behind
        if (position.z < 1) {
            obj.label.style.display = 'block';
            obj.label.style.transform = `translate(-50%, -150%) translate(${x}px, ${y}px)`;
        } else {
            obj.label.style.display = 'none';
        }
    });
}

// Compass
function createCompass() {
    const loader = new THREE.FontLoader();
    // Since we don't have a font file easily accessible without another request, 
    // let's use Sprites for text labels which is easier and standard for this.

    const directions = [
        { text: 'N', x: 0, z: -300, color: '#ff5555' },
        { text: 'S', x: 0, z: 300, color: '#5555ff' },
        { text: 'E', x: 300, z: 0, color: '#55ff55' },
        { text: 'W', x: -300, z: 0, color: '#ffff55' }
    ];

    directions.forEach(dir => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = dir.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dir.text, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(dir.x, 0, dir.z);
        sprite.scale.set(20, 20, 1);
        scene.add(sprite);

        // Optional: Grid lines to center
        const points = [];
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(dir.x, 0, dir.z));
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: dir.color, transparent: true, opacity: 0.3 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
    });
}
createCompass();

// Settings UI Logic
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings');
const slidersContainer = document.getElementById('sliders-container');

settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
});

// Generate Sliders
planetsData.forEach(data => {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const label = document.createElement('div');
    label.className = 'slider-label';
    label.innerHTML = `<span>${data.name}</span> <span id="val-${data.name}">${data.rotationSpeed.toFixed(3)}</span>`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider-input';
    slider.min = '0';
    slider.max = '0.1';
    slider.step = '0.001';
    slider.value = data.rotationSpeed;

    slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        data.rotationSpeed = val;
        document.getElementById(`val-${data.name}`).textContent = val.toFixed(3);
    });

    group.appendChild(label);
    group.appendChild(slider);
    slidersContainer.appendChild(group);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
