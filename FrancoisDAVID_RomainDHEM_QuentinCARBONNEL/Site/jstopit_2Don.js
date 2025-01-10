// d2Optimization.js

// Fonction pour charger les données à partir d'une chaîne JSON
export function loadDataFromJsonString(jsonString) {
    try {
        const jsonData = JSON.parse(jsonString);
        return jsonData;
    } catch (e) {
        throw new Error(`Error loading JSON data: ${e.message}`);
    }
}

// Fonction pour obtenir les items
export function getItems(data) {
    return data.map(row => ({
        name: row.name,
        length: Math.max(row.length, row.width),
        width: Math.min(row.length, row.width)
    }));
}

// Fonction pour emballer les items
export function packItems(items, wagonDimensions) {
    let wagons = [];
    items.forEach(item => {
        const { name, length, width } = item;
        let placed = false;
        for (let wagon of wagons) {
            if (tryPlaceItem(wagon, name, length, width, wagonDimensions) || tryPlaceItem(wagon, name, width, length, wagonDimensions)) {
                placed = true;
                break;
            }
        }
        if (!placed) {
            wagons.push(createNewWagon(name, length, width, wagonDimensions));
        }
    });
    return wagons;
}

// Fonction pour créer un nouveau wagon
export function createNewWagon(name, length, width, dimensions) {
    let wagon = { contents: [], free_spaces: [{ x: 0, y: 0, width: dimensions[0], height: dimensions[1] }] };
    tryPlaceItem(wagon, name, length, width, dimensions);
    return wagon;
}

// Fonction pour essayer de placer un item dans un wagon
export function tryPlaceItem(wagon, name, length, width, dimensions) {
    for (let i = 0; i < wagon.free_spaces.length; i++) {
        const space = wagon.free_spaces[i];
        if (length <= space.width && width <= space.height) {
            wagon.contents.push({ name, length, width, x: space.x, y: space.y });
            updateFreeSpaces(wagon, length, width, space.x, space.y, dimensions);
            return true;
        }
    }
    return false;
}

// Fonction pour mettre à jour les espaces libres dans un wagon
export function updateFreeSpaces(wagon, itemLength, itemWidth, itemX, itemY, dimensions) {
    let newSpaces = [];
    for (let space of wagon.free_spaces) {
        if (!(itemX + itemLength <= space.x || itemX >= space.x + space.width || itemY + itemWidth <= space.y || itemY >= space.y + space.height)) {
            if (itemX > space.x) newSpaces.push({ x: space.x, y: space.y, width: itemX - space.x, height: space.height });
            if (itemX + itemLength < space.x + space.width) newSpaces.push({ x: itemX + itemLength, y: space.y, width: space.x + space.width - (itemX + itemLength), height: space.height });
            if (itemY > space.y) newSpaces.push({ x: space.x, y: space.y, width: space.width, height: itemY - space.y });
            if (itemY + itemWidth < space.y + space.height) newSpaces.push({ x: space.x, y: itemY + itemWidth, width: space.width, height: space.y + space.height - (itemY + itemWidth) });
        } else {
            newSpaces.push(space);
        }
    }
    wagon.free_spaces = newSpaces.filter(space => space.width > 0 && space.height > 0);
}

// Fonction pour convertir en JSON
export function convertToJson(wagons) {
    let structure = {};
    wagons.forEach((wagon, i) => {
        let wagonName = `Wagon ${i + 1}`;
        structure[wagonName] = {};
        wagon.contents.forEach((content, j) => {
            let objectName = `Objet ${j + 1}`;
            structure[wagonName][objectName] = {
                longueur: content.length,
                largeur: content.width,
                designation: content.name,
                position_x: content.x,
                position_y: content.y
            };
        });
    });
    return { d2: { Online_FF: { structure } } };
}

// Fonction principale pour traiter les données
export function processDataon(inputJson) {
    const data = loadDataFromJsonString(inputJson);
    const items = getItems(data);
    const wagonDimensions = [11.583, 2.294];  // Length x Width

    const startTime = performance.now();
    const wagons = packItems(items, wagonDimensions);
    const stopTime = performance.now();

    console.log(`Time taken: ${stopTime - startTime} milliseconds`);
    console.log(`Total wagons used: ${wagons.length}`);

    // Convert to JSON and return
    return convertToJson(wagons);
}
