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

// Planets Data (Inclinations in degrees)
const planetsData = [
    { name: 'Mercury', radius: 2, distance: 20, speed: 0.02, rotationSpeed: 0.004, texture: 'textures/mercury.png', inclination: 7.0, node: Math.random() * Math.PI * 2 },
    { name: 'Venus', radius: 3, distance: 30, speed: 0.015, rotationSpeed: 0.002, texture: 'textures/venus.png', inclination: 3.4, node: Math.random() * Math.PI * 2 },
    { name: 'Earth', radius: 3.2, distance: 45, speed: 0.01, rotationSpeed: 0.02, texture: 'textures/earth.png', inclination: 0.0, node: 0 },
    { name: 'Mars', radius: 2.5, distance: 60, speed: 0.008, rotationSpeed: 0.018, texture: 'textures/mars.png', inclination: 1.9, node: Math.random() * Math.PI * 2 },
    { name: 'Jupiter', radius: 8, distance: 90, speed: 0.004, rotationSpeed: 0.04, texture: 'textures/jupiter.png', inclination: 1.3, node: Math.random() * Math.PI * 2 },
    { name: 'Saturn', radius: 7, distance: 130, speed: 0.003, rotationSpeed: 0.038, texture: 'textures/saturn.png', hasRing: true, inclination: 2.5, node: Math.random() * Math.PI * 2 },
    { name: 'Uranus', radius: 5, distance: 170, speed: 0.002, rotationSpeed: 0.03, color: 0x7ED6DF, inclination: 0.8, node: Math.random() * Math.PI * 2 },
    { name: 'Neptune', radius: 5, distance: 210, speed: 0.001, rotationSpeed: 0.032, color: 0x4834D4, inclination: 1.8, node: Math.random() * Math.PI * 2 }
];

const planets = [];
const labelsContainer = document.getElementById('labels-container');

planetsData.forEach(data => {
    // 1. Orbital Plane Group (Handles Inclination & Node)
    const orbitalPlane = new THREE.Group();

    // Apply Longitude of Ascending Node (Rotation around Y-axis - Ecliptic Pole)
    orbitalPlane.rotation.y = data.node;

    // Apply Inclination (Rotation around X or Z axis relative to Node)
    // We rotate around X to tilt the plane
    orbitalPlane.rotation.x = THREE.MathUtils.degToRad(data.inclination);

    scene.add(orbitalPlane);

    // 2. Orbit Path (Visual Ring) - Added to Orbital Plane
    const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.1 });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2; // Lay flat on the orbital plane
    orbitalPlane.add(orbit);

    // 3. Planet Pivot (Handles Revolution around Sun) - Added to Orbital Plane
    const planetPivot = new THREE.Group();
    orbitalPlane.add(planetPivot);

    // 4. Planet Mesh - Added to Pivot
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    let material;
    if (data.texture) {
        material = new THREE.MeshStandardMaterial({ map: textureLoader.load(data.texture) });
    } else {
        material = new THREE.MeshStandardMaterial({ color: data.color });
    }
    const planet = new THREE.Mesh(geometry, material);

    // Position planet at distance from center
    planet.position.x = data.distance;
    planetPivot.add(planet);

    // Saturn Ring
    if (data.hasRing) {
        const ringGeometry = new THREE.RingGeometry(data.radius + 2, data.radius + 6, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load('textures/saturn.png'),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    // Label
    const labelDiv = document.createElement('div');
    labelDiv.className = 'planet-label';
    labelDiv.textContent = data.name;
    labelsContainer.appendChild(labelDiv);

    // Store references for animation
    planets.push({
        mesh: planet,
        pivot: planetPivot,
        data: data,
        label: labelDiv
    });
});

camera.position.set(0, 50, 250); // Lower camera to see inclination better
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
            // Orbit (Revolution) - Rotate the Pivot
            obj.pivot.rotation.y += obj.data.speed;

            // Spin (Rotation) - Rotate the Mesh
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
