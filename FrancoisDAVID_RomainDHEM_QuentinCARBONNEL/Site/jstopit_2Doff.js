// offlineFFOptimization.js

// Fonction pour charger les données à partir d'une chaîne JSON
export function loadDataFromJsonString(jsonString) {
    try {
        const jsonData = JSON.parse(jsonString);
        return jsonData;
    } catch (e) {
        throw new Error(`Error loading JSON data: ${e.message}`);
    }
}

// Fonction pour vérifier et faire la rotation des items
export function checkAndRotateItems(data) {
    const items = data.map(row => {
        const name = row.name;
        const length = row.length;
        const width = row.width;
        const area = length * width;
        if (length > width) {
            if (width <= 2.294) {
                return { name, width, length, rotated: true, area };
            } else {
                return { name, length, width, rotated: false, area };
            }
        } else {
            return { name, length, width, rotated: false, area };
        }
    });
    return items.sort((a, b) => b.area - a.area);
}

// Fonction pour emballer les items
export function packItems(items, wagonDimensions) {
    const wagons = [{ free_spaces: [{ x: 0, y: 0, width: wagonDimensions[0], height: wagonDimensions[1] }], contents: [] }];
    for (let item of items) {
        const { name, width, length, rotated } = item;
        let placed = false;
        for (let wagon of wagons) {
            for (let space of wagon.free_spaces) {
                if (tryPlaceItem(wagon, item, space, width, length) || tryPlaceItem(wagon, item, space, length, width)) {
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
        if (!placed) {
            const newWagon = createNewWagon(item, wagonDimensions);
            wagons.push(newWagon);
        }
    }
    return wagons;
}

// Fonction pour essayer de placer un item dans un espace libre
export function tryPlaceItem(wagon, item, space, width, length) {
    if (width <= space.width && length <= space.height) {
        wagon.contents.push({ ...item, width, length, x: space.x, y: space.y });
        updateFreeSpaces(wagon, width, length, space.x, space.y);
        return true;
    }
    return false;
}

// Fonction pour créer un nouveau wagon
export function createNewWagon(item, dimensions) {
    const newWagon = { free_spaces: [{ x: 0, y: 0, width: dimensions[0], height: dimensions[1] }], contents: [] };
    tryPlaceItem(newWagon, item, newWagon.free_spaces[0], item.width, item.length);
    return newWagon;
}

// Fonction pour mettre à jour les espaces libres dans un wagon
export function updateFreeSpaces(wagon, itemWidth, itemLength, itemX, itemY) {
    const newSpaces = [];
    for (let space of wagon.free_spaces) {
        if (!(itemX + itemWidth <= space.x || itemX >= space.x + space.width || itemY + itemLength <= space.y || itemY >= space.y + space.height)) {
            if (itemX > space.x) newSpaces.push({ x: space.x, y: space.y, width: itemX - space.x, height: space.height });
            if (itemX + itemWidth < space.x + space.width) newSpaces.push({ x: itemX + itemWidth, y: space.y, width: space.x + space.width - (itemX + itemWidth), height: space.height });
            if (itemY > space.y) newSpaces.push({ x: space.x, y: space.y, width: space.width, height: itemY - space.y });
            if (itemY + itemLength < space.y + space.height) newSpaces.push({ x: space.x, y: itemY + itemLength, width: space.width, height: space.y + space.height - (itemY + itemLength) });
        } else {
            newSpaces.push(space);
        }
    }
    wagon.free_spaces = newSpaces.filter(space => space.width > 0 && space.height > 0);
}

// Fonction pour convertir en JSON
export function convertToJson(wagons) {
    const structure = {};
    wagons.forEach((wagon, i) => {
        const wagonName = `Wagon ${i + 1}`;
        structure[wagonName] = {};
        wagon.contents.forEach((content, j) => {
            const objectName = `Objet ${j + 1}`;
            structure[wagonName][objectName] = {
                largeur: content.length,
                longueur: content.width,
                designation: content.name,
                position_x: content.x,
                position_y: content.y
            };
        });
    });
    return { d2: { Offline_FF: { structure } } };
}

// Fonction principale pour traiter les données
export function processDataoff(inputJson) {
    const data = loadDataFromJsonString(inputJson);
    const items = checkAndRotateItems(data);
    const wagonDimensions = [11.583, 2.294];  // Length x Width

    const startTime = performance.now();
    const wagons = packItems(items, wagonDimensions);
    const stopTime = performance.now();

    console.log(`Elapsed time: ${stopTime - startTime} milliseconds`);
    console.log(`Total wagons used: ${wagons.length}`);

    // Convert to JSON and return
    return convertToJson(wagons);
}
