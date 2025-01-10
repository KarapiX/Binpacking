// Fonction pour charger les données à partir d'une chaîne JSON
export function loadDataFromJsonString(jsonString) {
    try {
        const jsonData = JSON.parse(jsonString);
        return jsonData;
    } catch (e) {
        throw new Error(`Error loading JSON data: ${e.message}`);
    }
}

// Fonction d'optimisation pour d=1 Offline avec FFD
export function d1_ffd(cargoItems, containerLength) {
    let wagons = [];
    let assignments = []; // Pour garder la trace des marchandises dans chaque wagon

    cargoItems.forEach(item => {
        const { length, name } = item;
        let placed = false;
        for (let i = 0; i < wagons.length; i++) {
            if (wagons[i] + length <= containerLength) {
                wagons[i] += length;
                assignments[i].push({ length, name });
                placed = true;
                break;
            }
        }
        if (!placed) {
            wagons.push(length);
            assignments.push([{ length, name }]);
        }
    });

    const usedSpace = wagons.reduce((a, b) => a + b, 0);
    const unusedSpace = containerLength * wagons.length - usedSpace;

    return { numberOfWagons: wagons.length, unusedSpace, assignments };
}

// Fonction d'optimisation pour d=1 Online avec FF
export function d1_ff(cargoItems, containerLength) {
    let wagons = [];
    let assignments = []; // Pour garder la trace des marchandises dans chaque wagon

    cargoItems.forEach(item => {
        const { length, name } = item;
        let placed = false;
        for (let i = 0; i < wagons.length; i++) {
            if (wagons[i] + length <= containerLength) {
                wagons[i] += length;
                assignments[i].push({ length, name });
                placed = true;
                break;
            }
        }
        if (!placed) {
            wagons.push(length);
            assignments.push([{ length, name }]);
        }
    });

    const usedSpace = wagons.reduce((a, b) => a + b, 0);
    const unusedSpace = containerLength * wagons.length - usedSpace;

    return { numberOfWagons: wagons.length, unusedSpace, assignments };
}

// Créer une structure JSON selon le format demandé
export function createJsonStructure(assignments) {
    let jsonData = {};
    assignments.forEach((wagon, wagonIndex) => {
        let wagonKey = `wagon ${wagonIndex + 1}`;
        jsonData[wagonKey] = {};
        wagon.forEach((obj, objIndex) => {
            let objectKey = `objet ${objIndex + 1}`;
            jsonData[wagonKey][objectKey] = {
                "longueur": obj.length,
                "designation": obj.name
            };
        });
    });
    return jsonData;
}

// Fonction principale pour traiter les données
export function processData(inputJson) {
    const data = loadDataFromJsonString(inputJson);
    const containerLength = 11.583;
    const cargoItems = data.map(item => ({
        length: item.length,
        name: item.name
    }));

    // Tri des articles de cargaison avant d'appeler d1_ffd
    const sortedCargoItems = [...cargoItems].sort((a, b) => b.length - a.length);

    const d1OfflineResult = d1_ffd(sortedCargoItems, containerLength);
    const d1OnlineResult = d1_ff(cargoItems, containerLength);

    const outputData = {
        "d1": {
            "Offline_FFD": createJsonStructure(d1OfflineResult.assignments),
            "Online_FF": createJsonStructure(d1OnlineResult.assignments)
        }
    };

    return outputData;
}
