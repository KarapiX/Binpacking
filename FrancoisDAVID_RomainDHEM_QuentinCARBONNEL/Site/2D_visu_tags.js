function createWagon2D(wagonData, wagonNumber, colors) {
    const wagonContainer = document.createElement("div");
    wagonContainer.classList.add("wagon-2d");

    const wagonNumDiv = document.createElement("div");
    wagonNumDiv.classList.add("wagon-number-2d");
    wagonNumDiv.innerHTML = `Wagon ${wagonNumber}`;
    wagonContainer.appendChild(wagonNumDiv);

    const wagonDetailsDiv = document.createElement("div");
    wagonDetailsDiv.classList.add("wagon-details-2d");
    wagonContainer.appendChild(wagonDetailsDiv);

    let colorIndex = 0;
    let totalArea = 0;
    const scale = 1; // Factor to reduce size

    Object.keys(wagonData).forEach(objKey => {
        const objet = wagonData[objKey];
        const block = document.createElement("div");
        block.classList.add("block-2d");
        let blockWidth = (objet.longueur / 11.583) * 100 * scale;
        let blockHeight = (objet.largeur / 2.294) * 100 * scale;
        block.style.width = `${blockWidth}%`;
        block.style.height = `${blockHeight}%`;
        block.style.backgroundColor = colors[colorIndex % colors.length];
        block.style.left = `${(objet.position_x / 11.583) * 100}%`;
        block.style.bottom = `${(objet.position_y / 2.294) * 100}%`;
        block.innerHTML = `<div>${objet.designation}</div><div>${objet.longueur} x ${objet.largeur} m</div>`;
        wagonContainer.appendChild(block);
        totalArea += objet.longueur * objet.largeur;
        colorIndex++;
    });

    const totalSpace = 11.583 * 2.294;
    const usedSpace = totalArea;
    const freeSpace = totalSpace - usedSpace;

    wagonDetailsDiv.innerHTML = `
                <div>Place totale: ${totalSpace.toFixed(2)} m²</div>
                <div>Place prise: ${usedSpace.toFixed(2)} m²</div>
                <div>Place libre: ${freeSpace.toFixed(2)} m²</div>
            `;

    return wagonContainer;
}

function loadAndDisplayJSON(data, container, key, colors) {
    // Fonction pour gérer le chargement et l'affichage des données JSON
    function handleJSONData(jsonData) {
        if (jsonData.d2 && jsonData.d2[key] && jsonData.d2[key].structure) {
            const wagonsData = jsonData.d2[key].structure;
            Object.keys(wagonsData).forEach((wagonKey, index) => {
                const wagon = createWagon2D(wagonsData[wagonKey], index + 1, colors);
                container.appendChild(wagon);
                if (index < Object.keys(wagonsData).length - 1) {
                    const connector = document.createElement("div");
                    connector.classList.add("connector-2d");
                    container.appendChild(connector);
                }
            });
        } else {
            console.error(`Key "${key}" not found in the JSON data`);
        }
    }

    // Charger les données à partir d'un fichier ou d'une variable
    if (typeof data === 'string') {
        // Si c'est une chaîne, supposer que c'est un chemin de fichier
        fetch(data)
            .then(response => response.json())
            .then(jsonData => handleJSONData(jsonData))
            .catch(error => console.error('Error loading JSON:', error));
    } else if (typeof data === 'object') {
        // Si c'est un objet JSON direct
        handleJSONData(data);
    } else {
        console.error('Invalid data type. Expected JSON string (file path) or JSON object.');
    }
}

export function initializeWagonLoader(onlineData = null, offlineData = null) {
    const colors = ["#3498dbcc", "#e74c3ccc", "#2ecc71cc", "#f39c12cc", "#9b59b6cc", "#16a085cc", "#e67e22cc", "#34495ecc"];
    const onlineContainer = document.getElementById("online-wagons-container");
    const offlineContainer = document.getElementById("offline-wagons-container");

    if (onlineData && offlineData) {
        // Utilisation des données fournies en paramètres
        loadAndDisplayJSON(onlineData, onlineContainer, 'Online_FF', colors);
        loadAndDisplayJSON(offlineData, offlineContainer, 'Offline_FF', colors);
    } else {
        // Chargement à partir des fichiers JSON par défaut
        loadAndDisplayJSON('2D_online_francois.json', onlineContainer, 'Online_FF', colors);
        loadAndDisplayJSON('2D_offline_francois.json', offlineContainer, 'Offline_FF', colors);
    }

    let isScrolling = false;
    let scrollAmount = 0;

    function smoothScroll(container) {
        if (scrollAmount !== 0) {
            const step = scrollAmount / 10;
            container.scrollLeft += step;
            scrollAmount -= step;

            if (Math.abs(scrollAmount) < 1) {
                scrollAmount = 0;
                isScrolling = false;
            } else {
                requestAnimationFrame(() => smoothScroll(container));
            }
        }
    }

    function MouseWheelHandler(e, container) {
        e = e || window.event;
        const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail || e.deltaY)));

        if (delta) {
            e.preventDefault();
            e.stopPropagation();
            scrollAmount -= delta * 120; // Ajustez la vitesse de défilement selon vos besoins
            if (!isScrolling) {
                isScrolling = true;
                smoothScroll(container);
            }
        }
    }

    if (onlineContainer.addEventListener) {
        // Navigateurs modernes
        onlineContainer.addEventListener("wheel", (e) => MouseWheelHandler(e, onlineContainer), { passive: false });
        offlineContainer.addEventListener("wheel", (e) => MouseWheelHandler(e, offlineContainer), { passive: false });
        // Firefox
        onlineContainer.addEventListener("DOMMouseScroll", (e) => MouseWheelHandler(e, onlineContainer), false);
        offlineContainer.addEventListener("DOMMouseScroll", (e) => MouseWheelHandler(e, offlineContainer), false);
    } else {
        // IE 6/7/8
        onlineContainer.attachEvent("onmousewheel", (e) => MouseWheelHandler(e, onlineContainer));
        offlineContainer.attachEvent("onmousewheel", (e) => MouseWheelHandler(e, offlineContainer));
    }
}
