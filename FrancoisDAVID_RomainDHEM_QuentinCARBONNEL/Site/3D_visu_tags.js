export function initializeWagonLoader3D(containerId, data, accordionId) {
    let scene, camera, renderer, controls, composer;
    let wagons = [];
    let txt = [];
    let locomotive;
    let scrollTarget = 0;
    const scrollSpeed = 0.1; // Adjust for smoother scrolling
    let scrollEnabled = false; // Flag to enable/disable scroll

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const annotations = [];
    init();
    animate();

    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(15, 13, 15); // Adjusted for a more perspective view from the other side

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        renderer.outputEncoding = THREE.sRGBEncoding;
        document.getElementById(containerId).appendChild(renderer.domElement);
        renderer.domElement.style.aspectRatio = '16 / 9';  // Respect the standard aspect ratio
        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enablePan = false;
        controls.enableZoom = false;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight1.position.set(-10, 10, 10);
        directionalLight1.castShadow = true;
        directionalLight1.shadow.mapSize.width = 2048;
        directionalLight1.shadow.mapSize.height = 2048;
        directionalLight1.shadow.camera.left = -20;
        directionalLight1.shadow.camera.right = 20;
        directionalLight1.shadow.camera.top = 20;
        directionalLight1.shadow.camera.bottom = -20;
        scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight2.position.set(10, 10, -10);
        directionalLight2.castShadow = true;
        directionalLight2.shadow.mapSize.width = 2048;
        directionalLight2.shadow.mapSize.height = 2048;
        directionalLight2.shadow.camera.left = -20;
        directionalLight2.shadow.camera.right = 20;
        directionalLight2.shadow.camera.top = 20;
        directionalLight2.shadow.camera.bottom = -20;
        scene.add(directionalLight2);

        const planeGeometry = new THREE.PlaneGeometry(100, 75);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x151515,
            metalness: 0.6,
            roughness: 1
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0.3;
        plane.receiveShadow = true;
        scene.add(plane);

        const fogColor = new THREE.Color(0x17171b);
        scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 30, 40);

        // Check if data is a JSON object, otherwise fetch the appropriate JSON file
        if (typeof data === 'object' && data !== null) {
            loadWagons(data);
        } else if (typeof data === 'string' && data.endsWith('.json')) {
            fetch(data)
                .then(response => response.json())
                .then(wagonData => loadWagons(wagonData))
                .catch(error => console.error('Error fetching JSON data:', error));
        } else {
            console.error('Invalid data provided:', data);
        }

        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));

        const fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(fxaaPass);

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('mousemove', onMouseMove, false);

        const container = document.getElementById(containerId);
        container.addEventListener('mouseenter', () => {
            scrollEnabled = true;
        });
        container.addEventListener('mouseleave', () => {
            scrollEnabled = false;
        });
        container.addEventListener('wheel', onScroll, { passive: false });
    }

    function onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components.
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    function onScroll(event) {
        if (scrollEnabled) {
            event.preventDefault(); // Prevent default scrolling behavior
            event.stopPropagation(); // Stop the event from propagating to parent elements
            const delta = event.deltaY;
            const scrollPercent = delta / (document.body.scrollHeight - window.innerHeight);
            scrollTarget -= scrollPercent * (wagons.length * 12); // Adjust scroll speed as needed
        }
    }

    function onWindowResize() {
        // Define a maximum height as 90% of the viewport height
        const maxHeight = window.innerHeight * 0.95;

        // Calculate the width based on the maximum height to maintain a 16:9 aspect ratio
        const height = Math.min(window.innerHeight * 0.95, maxHeight);
        const width = 0.95 * window.innerWidth; // Calculate width to maintain the 16:9 ratio

        // Update the aspect ratio of the camera
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Resize the renderer and composer to the new dimensions
        renderer.setSize(width, height);
        composer.setSize(width, height);

        // Update the size of the renderer's DOM element to reflect the new size
        renderer.domElement.style.width = `${width}px`;
        renderer.domElement.style.height = `${height}px`;
    }

    onWindowResize();

    function loadWagons(wagonData) {
        const loader = new THREE.GLTFLoader();
        const infoDiv = document.getElementById(accordionId);

        // Load locomotive first
        loader.load('loco/scene.gltf', function (locoGltf) {
            locomotive = locoGltf.scene;
            locomotive.scale.set(0.7, 0.7, 0.7);
            locomotive.position.set(26, 0, 0); // Adjust locomotive position based on your scene

            scene.add(locomotive);

            // Load wagons after locomotive
            const wagonDimensions = { longueur: 11.583, largeur: 2.294, hauteur: 2.56 };
            infoDiv.innerHTML = ''; // Clear existing info

            Object.keys(wagonData).forEach((wagonKey, index) => {
                loader.load('scene2.gltf', function (gltf) {
                    const wagon = gltf.scene.clone();
                    wagon.position.x = -index * 12; // Initialize with negative positions
                    wagon.rotation.y = Math.PI / 2;

                    const containerGeometry = new THREE.BoxGeometry(wagonDimensions.longueur, wagonDimensions.hauteur, wagonDimensions.largeur);
                    const containerMaterial = new THREE.MeshStandardMaterial({
                        color: 0x0000ff,
                        opacity: 0,
                        transparent: true,
                        side: THREE.DoubleSide
                    });
                    const containerBox = new THREE.Mesh(containerGeometry, containerMaterial);

                    containerBox.position.set(0, wagonDimensions.hauteur + 0.4, 0);
                    containerBox.rotation.y = Math.PI / 2;
                    containerBox.castShadow = true;
                    containerBox.receiveShadow = true;
                    wagon.add(containerBox);

                    // Calculate the volume of the container box
                    const containerVolume = wagonDimensions.longueur * wagonDimensions.largeur * wagonDimensions.hauteur;

                    let totalBoxVolume = 0; // To accumulate the volume of boxes

                    // Load texture only once
                    const textureLoader = new THREE.TextureLoader();
                    const texture = textureLoader.load('text.jpg');

                    const dt = document.createElement('dt');
                    const a = document.createElement('a');
                    a.href = "#";
                    a.textContent = `${wagonKey}`;
                    dt.appendChild(a);

                    const dd = document.createElement('dd');
                    dd.style.display = "none";
                    const p = document.createElement('p');
                    dd.appendChild(p);

                    Object.keys(wagonData[wagonKey]).forEach((objetKey, idx) => {
                        const item = wagonData[wagonKey][objetKey];
                        const itemGeometry = new THREE.BoxGeometry(item.longueur, item.hauteur, item.largeur);

                        const itemMaterial = new THREE.MeshStandardMaterial({
                            color: idx === 0 ? 0xFAD02E :   // Jaune vif
                                idx === 1 ? 0xFF6F61 :   // Corail
                                    idx === 2 ? 0x8ED2C9 :   // Vert menthe
                                        idx === 3 ? 0xF9A8D4 :   // Rose pastel
                                            idx === 4 ? 0xFFB347 :   // Orange pastel
                                                idx === 5 ? 0x77DD77 :   // Vert pastel
                                                    idx === 6 ? 0xAEC6CF :   // Bleu pastel
                                                        idx === 7 ? 0xFFD1DC :   // Rose pâle
                                                            idx === 8 ? 0xB39EB5 :   // Lavande
                                                                0xFF6961,                // Rouge pastel
                            opacity: 1,
                            transparent: false,
                            side: THREE.DoubleSide
                        });
                        const itemBox = new THREE.Mesh(itemGeometry, itemMaterial);

                        itemBox.position.set(
                            item.position.x - wagonDimensions.longueur / 2 + item.longueur / 2,
                            item.position.z - wagonDimensions.hauteur / 2 + item.hauteur / 2,
                            item.position.y - wagonDimensions.largeur / 2 + item.largeur / 2
                        );

                        itemBox.castShadow = true;
                        itemBox.receiveShadow = true;
                        containerBox.add(itemBox);

                        // Calculate the volume of the current box
                        const boxVolume = item.longueur * item.largeur * item.hauteur;
                        totalBoxVolume += boxVolume;

                        // Append item info to the paragraph
                        p.innerHTML += `
                            <p><strong class="strongfirstletter">${objetKey} :</strong></p>
                            <p>Designation : ${item.designation}</p>
                            <p>Position : (${item.position.x}, ${item.position.y}, ${item.position.z})</p>
                            <p>Dimensions : (${item.longueur} x ${item.largeur} x ${item.hauteur})</p>
                            <p>Volume : ${boxVolume.toFixed(2)} m³</p>
                        `;
                    });

                    infoDiv.appendChild(dt);
                    infoDiv.appendChild(dd);

                    // Calculate the difference in volume
                    const volumeDifference = containerVolume - totalBoxVolume;

                    // Create text to display the volumes and difference
                    const fontLoader = new THREE.FontLoader();
                    fontLoader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
                        const textGeometry = new THREE.TextGeometry(`Volume Container : ${containerVolume.toFixed(2)} m³\nVolume Boites : ${totalBoxVolume.toFixed(2)} m³\nVolume libre : ${volumeDifference.toFixed(2)} m³`, {
                            font: font,
                            size: 0.5, // Adjust size as needed
                            height: 0.01, // Adjust height as needed
                            curveSegments: 12,
                            bevelEnabled: false // Disable bevel for simpler text appearance
                        });

                        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

                        // Initial placement of the text
                        textMesh.position.set(
                            wagon.position.x, // Initial x position
                            0.5, // Slightly above the ground
                            wagon.position.z + wagonDimensions.largeur / 2 + 1 // Position to the right of the wagon
                        );

                        // Rotate the text to lay flat and parallel to the wagon
                        textMesh.rotation.x = -Math.PI / 2; // Rotate text to lay flat on the ground

                        // Add text to the scene
                        txt.push(textMesh);
                        scene.add(textMesh);

                        // Change the x position after placement
                        const offsetX = 500; // Adjust this value to move the text
                        textMesh.position.x += offsetX;

                    });

                    wagons.push(wagon);
                    scene.add(wagon);

                }, undefined, function (error) {
                    console.error('Error loading GLTF model:', error);
                });
            });
        }, undefined, function (error) {
            console.error('Error loading locomotive:', error);
        });
    }

    function animate() {
        requestAnimationFrame(animate);

        if (locomotive) {
            // Smooth scroll effect for wagons
            wagons.forEach((wagon, index) => {
                wagon.position.x += (-index * 12 - scrollTarget - wagon.position.x) * scrollSpeed;
            });
            txt.forEach((textMesh, index) => {
                textMesh.position.x += (-index * 12 - scrollTarget - textMesh.position.x - 4.5) * scrollSpeed;
            });

            // Update locomotive position based on wagons
            locomotive.position.x += (-scrollTarget - locomotive.position.x + 17) * scrollSpeed;
        }

        controls.update();
        composer.render();
    }
}
