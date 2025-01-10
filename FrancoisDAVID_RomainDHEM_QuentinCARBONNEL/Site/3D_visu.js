(function() {
    var scene, camera, renderer, controls, composer;
    var wagons = [];
    var txt = [];
    var locomotive;
    var scrollTarget = 0;
    var scrollSpeed = 0.1; // Adjust for smoother scrolling
    var scrollEnabled = false; // Flag to enable/disable scroll

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var annotations = [];

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
        document.getElementById('container').appendChild(renderer.domElement);
        renderer.domElement.style.aspectRatio = '16 / 9';  // Respecter le format standard
        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enablePan = false;
        controls.enableZoom = false;

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        var directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight1.position.set(-10, 10, 10);
        directionalLight1.castShadow = true;
        directionalLight1.shadow.mapSize.width = 2048;
        directionalLight1.shadow.mapSize.height = 2048;
        directionalLight1.shadow.camera.left = -20;
        directionalLight1.shadow.camera.right = 20;
        directionalLight1.shadow.camera.top = 20;
        directionalLight1.shadow.camera.bottom = -20;
        scene.add(directionalLight1);

        var directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight2.position.set(10, 10, -10);
        directionalLight2.castShadow = true;
        directionalLight2.shadow.mapSize.width = 2048;
        directionalLight2.shadow.mapSize.height = 2048;
        directionalLight2.shadow.camera.left = -20;
        directionalLight2.shadow.camera.right = 20;
        directionalLight2.shadow.camera.top = 20;
        directionalLight2.shadow.camera.bottom = -20;
        scene.add(directionalLight2);

        var planeGeometry = new THREE.PlaneGeometry(100, 75);
        var planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x151515,
            metalness: 0.6,
            roughness: 1
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0.3;
        plane.receiveShadow = true;
        scene.add(plane);

        var fogColor = new THREE.Color(0x17171b);
        scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 30, 40);

        loadWagons();

        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));

        var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(fxaaPass);

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('mousemove', onMouseMove, false);

        var container = document.getElementById('container');
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
            var delta = event.deltaY;
            var scrollPercent = delta / (document.body.scrollHeight - window.innerHeight);
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

    function loadWagons() {
        const loader = new THREE.GLTFLoader();
        var infoDiv = document.getElementById('accordion-list');

        // Charger la locomotive d'abord
        loader.load('loco/scene.gltf', function (locoGltf) {
            locomotive = locoGltf.scene;
            locomotive.scale.set(0.7, 0.7, 0.7);
            locomotive.position.set(26, 0, 0); // Ajustez la position de la locomotive selon votre scène

            scene.add(locomotive);

            // Charger les wagons après avoir chargé la locomotive
            //fetch('wagontest.json')
            fetch('d3online.json')
                .then(response => response.json())
                .then(wagonData => {
                    var wagonDimensions = { longueur: 11.583, largeur: 2.294, hauteur: 2.56 };
                    infoDiv.innerHTML = ''; // Clear existing info

                    Object.keys(wagonData).forEach((wagonKey, index) => {
                        loader.load('scene2.gltf', function (gltf) {
                            var wagon = gltf.scene.clone();
                            wagon.position.x = -index * 12; // Initialize with negative positions
                            wagon.rotation.y = Math.PI / 2;

                            var containerGeometry = new THREE.BoxGeometry(wagonDimensions.longueur, wagonDimensions.hauteur, wagonDimensions.largeur);
                            var containerMaterial = new THREE.MeshStandardMaterial({
                                color: 0x0000ff,
                                opacity: 0,
                                transparent: true,
                                side: THREE.DoubleSide
                            });
                            var containerBox = new THREE.Mesh(containerGeometry, containerMaterial);

                            containerBox.position.set(0, wagonDimensions.hauteur + 0.4, 0);
                            containerBox.rotation.y = Math.PI / 2;
                            containerBox.castShadow = true;
                            containerBox.receiveShadow = true;
                            wagon.add(containerBox);

                            // Calculate the volume of the container box
                            var containerVolume = wagonDimensions.longueur * wagonDimensions.largeur * wagonDimensions.hauteur;

                            var totalBoxVolume = 0; // To accumulate the volume of boxes

                            // Charger la texture une seule fois
                            var textureLoader = new THREE.TextureLoader();
                            var texture = textureLoader.load('text.jpg');

                            var dt = document.createElement('dt');
                            var a = document.createElement('a');
                            a.href = "#";
                            a.textContent = `${wagonKey}`;
                            dt.appendChild(a);

                            var dd = document.createElement('dd');
                            dd.style.display = "none";
                            var p = document.createElement('p');
                            dd.appendChild(p);

                            Object.keys(wagonData[wagonKey]).forEach((objetKey, idx) => {
                                var item = wagonData[wagonKey][objetKey];
                                var itemGeometry = new THREE.BoxGeometry(item.longueur, item.hauteur, item.largeur);

                                var itemMaterial = new THREE.MeshStandardMaterial({
                                    //map: texture,
                                    color: idx === 0 ? 0xFAD02E : idx === 1 ? 0xFF6F61 : idx === 2 ? 0x8ED2C9 : 0xF9A8D4,
                                    opacity: 1.0,
                                    transparent: false,
                                    side: THREE.DoubleSide
                                });
                                var itemBox = new THREE.Mesh(itemGeometry, itemMaterial);

                                itemBox.position.set(
                                    item.position.x - wagonDimensions.longueur / 2 + item.longueur / 2,
                                    item.position.z - wagonDimensions.hauteur / 2 + item.hauteur / 2,
                                    item.position.y - wagonDimensions.largeur / 2 + item.largeur / 2
                                );

                                itemBox.castShadow = true;
                                itemBox.receiveShadow = true;
                                containerBox.add(itemBox);

                                // Calculate the volume of the current box
                                var boxVolume = item.longueur * item.largeur * item.hauteur;
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
                            var volumeDifference = containerVolume - totalBoxVolume;

                            // Create text to display the volumes and difference
                            var fontLoader = new THREE.FontLoader();
                            fontLoader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
                                var textGeometry = new THREE.TextGeometry(`Volume Container : ${containerVolume.toFixed(2)} m³\nVolume Boites : ${totalBoxVolume.toFixed(2)} m³\nVolume libre : ${volumeDifference.toFixed(2)} m³`, {
                                    font: font,
                                    size: 0.5, // Adjust size as needed
                                    height: 0.01, // Adjust height as needed
                                    curveSegments: 12,
                                    bevelEnabled: false // Disable bevel for simpler text appearance
                                });

                                var textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                                var textMesh = new THREE.Mesh(textGeometry, textMaterial);

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
                                var offsetX = 500; // Adjust this value to move the text
                                textMesh.position.x += offsetX;

                            });

                            wagons.push(wagon);
                            scene.add(wagon);

                        }, undefined, function (error) {
                            console.error('Error loading GLTF model:', error);
                        });
                    });

                })
                .catch(error => console.error('Error fetching wagontest.json:', error));
        }, undefined, function (error) {
            console.error('Error loading locomotive:', error);
        });
    }

// Ensure event listeners are added after the DOM is updated
    setTimeout(function() {
        var allPanels = document.querySelectorAll('.accordion > dd');

        document.querySelectorAll('.accordion > dt > a').forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                scrollEnabled = false; // Disable scroll on click
                var panel = this.parentNode.nextElementSibling;

                allPanels.forEach(function(p) {
                    if (p !== panel) {
                        p.style.maxHeight = '0px';
                        p.style.display = 'none';
                    }
                });

                if (panel.style.display === 'block') {
                    panel.style.maxHeight = '0px';
                    panel.addEventListener('transitionend', function() {
                        panel.style.display = 'none';
                    }, { once: true });
                } else {
                    panel.style.display = 'block';
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });
    }, 1000); // Adjust timeout as needed to ensure elements are in the DOM

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
})();

(function() {
    var scene, camera, renderer, controls, composer;
    var wagons = [];
    var txt = [];
    var locomotive;
    var scrollTarget = 0;
    var scrollSpeed = 0.1; // Adjust for smoother scrolling
    var scrollEnabled = false; // Flag to enable/disable scroll

    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var annotations = [];

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
        document.getElementById('container2').appendChild(renderer.domElement);
        renderer.domElement.style.aspectRatio = '16 / 9';  // Respecter le format standard
        renderer.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight, false);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enablePan = false;
        controls.enableZoom = false;

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        var directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight1.position.set(-10, 10, 10);
        directionalLight1.castShadow = true;
        directionalLight1.shadow.mapSize.width = 2048;
        directionalLight1.shadow.mapSize.height = 2048;
        directionalLight1.shadow.camera.left = -20;
        directionalLight1.shadow.camera.right = 20;
        directionalLight1.shadow.camera.top = 20;
        directionalLight1.shadow.camera.bottom = -20;
        scene.add(directionalLight1);

        var directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight2.position.set(10, 10, -10);
        directionalLight2.castShadow = true;
        directionalLight2.shadow.mapSize.width = 2048;
        directionalLight2.shadow.mapSize.height = 2048;
        directionalLight2.shadow.camera.left = -20;
        directionalLight2.shadow.camera.right = 20;
        directionalLight2.shadow.camera.top = 20;
        directionalLight2.shadow.camera.bottom = -20;
        scene.add(directionalLight2);

        var planeGeometry = new THREE.PlaneGeometry(100, 75);
        var planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x151515,
            metalness: 0.6,
            roughness: 1
        });
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0.3;
        plane.receiveShadow = true;
        scene.add(plane);

        var fogColor = new THREE.Color(0x17171b);
        scene.background = fogColor;
        scene.fog = new THREE.Fog(fogColor, 30, 40);

        loadWagons();

        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));

        var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
        fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        composer.addPass(fxaaPass);

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('mousemove', onMouseMove, false);

        var container = document.getElementById('container2');
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
            var delta = event.deltaY;
            var scrollPercent = delta / (document.body.scrollHeight - window.innerHeight);
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

    function loadWagons() {
        const loader = new THREE.GLTFLoader();
        var infoDiv = document.getElementById('accordion-list2');

        // Charger la locomotive d'abord
        loader.load('loco/scene.gltf', function (locoGltf) {
            locomotive = locoGltf.scene;
            locomotive.scale.set(0.7, 0.7, 0.7);
            locomotive.position.set(26, 0, 0); // Ajustez la position de la locomotive selon votre scène

            scene.add(locomotive);

            // Charger les wagons après avoir chargé la locomotive
            //fetch('wagontest.json')
            fetch('d3offline.json')
                .then(response => response.json())
                .then(wagonData => {
                    var wagonDimensions = { longueur: 11.583, largeur: 2.294, hauteur: 2.56 };
                    infoDiv.innerHTML = ''; // Clear existing info

                    Object.keys(wagonData).forEach((wagonKey, index) => {
                        loader.load('scene2.gltf', function (gltf) {
                            var wagon = gltf.scene.clone();
                            wagon.position.x = -index * 12; // Initialize with negative positions
                            wagon.rotation.y = Math.PI / 2;

                            var containerGeometry = new THREE.BoxGeometry(wagonDimensions.longueur, wagonDimensions.hauteur, wagonDimensions.largeur);
                            var containerMaterial = new THREE.MeshStandardMaterial({
                                color: 0x0000ff,
                                opacity: 0,
                                transparent: true,
                                side: THREE.DoubleSide
                            });
                            var containerBox = new THREE.Mesh(containerGeometry, containerMaterial);

                            containerBox.position.set(0, wagonDimensions.hauteur + 0.4, 0);
                            containerBox.rotation.y = Math.PI / 2;
                            containerBox.castShadow = true;
                            containerBox.receiveShadow = true;
                            wagon.add(containerBox);

                            // Calculate the volume of the container box
                            var containerVolume = wagonDimensions.longueur * wagonDimensions.largeur * wagonDimensions.hauteur;

                            var totalBoxVolume = 0; // To accumulate the volume of boxes

                            // Charger la texture une seule fois
                            var textureLoader = new THREE.TextureLoader();
                            var texture = textureLoader.load('text.jpg');

                            var dt = document.createElement('dt');
                            var a = document.createElement('a');
                            a.href = "#";
                            a.textContent = `${wagonKey}`;
                            dt.appendChild(a);

                            var dd = document.createElement('dd');
                            dd.style.display = "none";
                            var p = document.createElement('p');
                            dd.appendChild(p);

                            Object.keys(wagonData[wagonKey]).forEach((objetKey, idx) => {
                                var item = wagonData[wagonKey][objetKey];
                                var itemGeometry = new THREE.BoxGeometry(item.longueur, item.hauteur, item.largeur);

                                var itemMaterial = new THREE.MeshStandardMaterial({
                                    //map: texture,
                                    color: idx === 0 ? 0xFAD02E : idx === 1 ? 0xFF6F61 : idx === 2 ? 0x8ED2C9 : 0xF9A8D4,
                                    opacity: 1,
                                    transparent: false,
                                    side: THREE.DoubleSide
                                });
                                var itemBox = new THREE.Mesh(itemGeometry, itemMaterial);

                                itemBox.position.set(
                                    item.position.x - wagonDimensions.longueur / 2 + item.longueur / 2,
                                    item.position.z - wagonDimensions.hauteur / 2 + item.hauteur / 2,
                                    item.position.y - wagonDimensions.largeur / 2 + item.largeur / 2
                                );

                                itemBox.castShadow = true;
                                itemBox.receiveShadow = true;
                                containerBox.add(itemBox);

                                // Calculate the volume of the current box
                                var boxVolume = item.longueur * item.largeur * item.hauteur;
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
                            var volumeDifference = containerVolume - totalBoxVolume;

                            // Create text to display the volumes and difference
                            var fontLoader = new THREE.FontLoader();
                            fontLoader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_regular.typeface.json', function (font) {
                                var textGeometry = new THREE.TextGeometry(`Volume Container : ${containerVolume.toFixed(2)} m³\nVolume Boites : ${totalBoxVolume.toFixed(2)} m³\nVolume libre : ${volumeDifference.toFixed(2)} m³`, {
                                    font: font,
                                    size: 0.5, // Adjust size as needed
                                    height: 0.01, // Adjust height as needed
                                    curveSegments: 12,
                                    bevelEnabled: false // Disable bevel for simpler text appearance
                                });

                                var textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                                var textMesh = new THREE.Mesh(textGeometry, textMaterial);

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
                                var offsetX = 500; // Adjust this value to move the text
                                textMesh.position.x += offsetX;

                            });

                            wagons.push(wagon);
                            scene.add(wagon);

                        }, undefined, function (error) {
                            console.error('Error loading GLTF model:', error);
                        });
                    });

                })
                .catch(error => console.error('Error fetching wagontest.json:', error));
        }, undefined, function (error) {
            console.error('Error loading locomotive:', error);
        });
    }

// Ensure event listeners are added after the DOM is updated
    setTimeout(function() {
        var allPanels = document.querySelectorAll('.accordion2 > dd');

        document.querySelectorAll('.accordion2 > dt > a').forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                scrollEnabled = false; // Disable scroll on click
                var panel = this.parentNode.nextElementSibling;

                allPanels.forEach(function(p) {
                    if (p !== panel) {
                        p.style.maxHeight = '0px';
                        p.style.display = 'none';
                    }
                });

                if (panel.style.display === 'block') {
                    panel.style.maxHeight = '0px';
                    panel.addEventListener('transitionend', function() {
                        panel.style.display = 'none';
                    }, { once: true });
                } else {
                    panel.style.display = 'block';
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });
    }, 1000); // Adjust timeout as needed to ensure elements are in the DOM

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

})();
