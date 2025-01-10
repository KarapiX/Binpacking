export function loadWagonData(data) {
    // Fonction pour créer un wagon à partir des données spécifiées
    function createWagon(wagonData, wagonNumber) {
        const colors = ["#3498dbcc", "#e74c3ccc", "#2ecc71cc", "#f39c12cc", "#9b59b6cc", "#16a085cc", "#e67e22cc", "#34495ecc"];
        const wagonContainer = document.createElement("div");
        wagonContainer.classList.add("wagon-container");

        const wagon = document.createElement("div");
        wagon.classList.add("wagon");

        const wagonNumDiv = document.createElement("div");
        wagonNumDiv.classList.add("wagon-number");
        wagonNumDiv.textContent = `Wagon ${wagonNumber}`;
        wagonContainer.appendChild(wagonNumDiv);

        let totalLength = 0;
        let colorIndex = 0;
        Object.keys(wagonData).forEach(key => {
            const objet = wagonData[key];
            const block = document.createElement("div");
            block.classList.add("block");
            block.style.width = `${(objet.longueur / 11.583) * 100}%`; // Calculate the width based on the length
            block.style.backgroundColor = colors[colorIndex % colors.length]; // Assign a color from the array
            block.innerHTML = `<div>${objet.designation}</div><div>${objet.longueur} m</div>`;
            wagon.appendChild(block);
            totalLength += objet.longueur;
            colorIndex++;
        });

        const flatbed = document.createElement("div");
        flatbed.classList.add("flatbed");
        wagon.appendChild(flatbed);

        const wheel1 = document.createElement("div");
        wheel1.classList.add("wheel");
        wheel1.style.left = "10%";
        wagon.appendChild(wheel1);

        const wheel2 = document.createElement("div");
        wheel2.classList.add("wheel");
        wheel2.style.right = "10%";
        wagon.appendChild(wheel2);

        const wagonInfoDiv = document.createElement("div");
        wagonInfoDiv.classList.add("wagon-info");
        wagonInfoDiv.innerHTML = `
            <div>Place totale: 11.583 m</div>
            <div>Place prise: ${totalLength.toFixed(2)} m</div>
            <div>Place libre: ${(11.583 - totalLength).toFixed(2)} m</div>
        `;
        wagonContainer.appendChild(wagonInfoDiv);

        wagonContainer.appendChild(wagon);
        return wagonContainer;
    }

    // Fonction pour gérer le chargement des données JSON
    function handleJSONData(jsonData) {
        const scrollableContainerOnline = document.getElementById("scrollable-container-online");
        const scrollableContainerOffline = document.getElementById("scrollable-container-offline");
        if (jsonData.d1) {
            const onlineData = jsonData.d1.Online_FF || {};
            const offlineData = jsonData.d1.Offline_FFD || {};
            Object.keys(onlineData).forEach((wagonKey, index) => {
                const wagon = createWagon(onlineData[wagonKey], index + 1);
                scrollableContainerOnline.appendChild(wagon);
            });

            Object.keys(offlineData).forEach((wagonKey, index) => {
                const wagon = createWagon(offlineData[wagonKey], index + 1);
                scrollableContainerOffline.appendChild(wagon);
            });
        } else {
            console.error('Error: d1 key is missing in the JSON data.');
        }

        // Fonction pour gérer le scrolling doux
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

        // Gestionnaire d'événement pour la molette de la souris
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

        // Ajouter des écouteurs d'événements pour la molette de la souris
        if (scrollableContainerOnline.addEventListener) {
            // Navigateurs modernes
            scrollableContainerOnline.addEventListener("wheel", (e) => MouseWheelHandler(e, scrollableContainerOnline), { passive: false });
            scrollableContainerOffline.addEventListener("wheel", (e) => MouseWheelHandler(e, scrollableContainerOffline), { passive: false });
            // Firefox
            scrollableContainerOnline.addEventListener("DOMMouseScroll", (e) => MouseWheelHandler(e, scrollableContainerOnline), false);
            scrollableContainerOffline.addEventListener("DOMMouseScroll", (e) => MouseWheelHandler(e, scrollableContainerOffline), false);
        } else {
            // IE 6/7/8
            scrollableContainerOnline.attachEvent("onmousewheel", (e) => MouseWheelHandler(e, scrollableContainerOnline));
            scrollableContainerOffline.attachEvent("onmousewheel", (e) => MouseWheelHandler(e, scrollableContainerOffline));
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
