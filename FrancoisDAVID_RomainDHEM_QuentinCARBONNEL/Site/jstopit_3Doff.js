// containerOptimization.js


// Définition des dimensions du conteneur
const CONTAINER_LENGTH = 11.5;
const CONTAINER_WIDTH = 2.2;
const CONTAINER_HEIGHT = 2.5;

class Marchandise {
    constructor(num_objet, designation, length, width, height) {
        this.num_objet = num_objet;
        this.designation = designation;
        this.length = length;
        this.width = width;
        this.height = height;
        this.position = null;  // Coordonnées x, y, z dans le conteneur
    }
}

class Conteneur {
    constructor(wagon) {
        this.wagon = wagon;
        this.contents = [];  // Liste des marchandises
        // Création d'une grille 3D représentant le conteneur
        this.grid = Array.from({ length: Math.ceil(CONTAINER_LENGTH * 10) }, () =>
            Array.from({ length: Math.ceil(CONTAINER_WIDTH * 10) }, () =>
                Array(Math.ceil(CONTAINER_HEIGHT * 10)).fill(false)
            )
        );
    }

    peutPlacer(marchandise) {
        for (let x = 0; x < Math.ceil(CONTAINER_LENGTH * 10) - Math.ceil(marchandise.length * 10) + 1; x++) {
            for (let y = 0; y < Math.ceil(CONTAINER_WIDTH * 10) - Math.ceil(marchandise.width * 10) + 1; y++) {
                for (let z = 0; z < Math.ceil(CONTAINER_HEIGHT * 10) - Math.ceil(marchandise.height * 10) + 1; z++) {
                    if (this.estLibre(x, y, z, marchandise)) {
                        return { x: x / 10.0, y: y / 10.0, z: z / 10.0 };
                    }
                }
            }
        }
        return null;
    }

    estLibre(x, y, z, marchandise) {
        for (let dx = 0; dx < Math.ceil(marchandise.length * 10); dx++) {
            for (let dy = 0; dy < Math.ceil(marchandise.width * 10); dy++) {
                for (let dz = 0; dz < Math.ceil(marchandise.height * 10); dz++) {
                    if (this.grid[x + dx][y + dy][z + dz]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placeMarchandise(marchandise, position) {
        const { x, y, z } = position;
        for (let dx = 0; dx < Math.ceil(marchandise.length * 10); dx++) {
            for (let dy = 0; dy < Math.ceil(marchandise.width * 10); dy++) {
                for (let dz = 0; dz < Math.ceil(marchandise.height * 10); dz++) {
                    this.grid[Math.floor(x * 10) + dx][Math.floor(y * 10) + dy][Math.floor(z * 10) + dz] = true;
                }
            }
        }
        marchandise.position = position;
        this.contents.push(marchandise);
    }

    getDimensions() {
        return { length: CONTAINER_LENGTH, width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT };
    }

    getContentsWithPositions() {
        return this.contents.map(marchandise => ({
            num_objet: marchandise.num_objet,
            longueur: marchandise.length,
            largeur: marchandise.width,
            hauteur: marchandise.height,
            designation: marchandise.designation,
            position: {
                x: marchandise.position.x,
                y: marchandise.position.y,
                z: marchandise.position.z
            }
        }));
    }
}

export function lireMarchandises(jsonData) {
    const marchandises = jsonData.map(row => new Marchandise(row.num_objet, row.name, row.length, row.width, row.height));
    marchandises.sort((a, b) => (b.length * b.width * b.height) - (a.length * a.width * a.height));
    return marchandises;
}

export function chargerMarchandises(marchandises) {
    const conteneurs = [];
    let wagonId = 1;

    const startTime = Date.now();

    marchandises.forEach(marchandise => {
        let place = false;
        for (let conteneur of conteneurs) {
            const position = conteneur.peutPlacer(marchandise);
            if (position) {
                conteneur.placeMarchandise(marchandise, position);
                place = true;
                break;
            }
        }

        if (!place) {
            const nouveauConteneur = new Conteneur(wagonId++);
            const position = nouveauConteneur.peutPlacer(marchandise);
            nouveauConteneur.placeMarchandise(marchandise, position);
            conteneurs.push(nouveauConteneur);
        }
    });

    const endTime = Date.now();
    console.log(`Temps d'exécution pour charger les marchandises: ${(endTime - startTime) / 1000} secondes`);

    return conteneurs;
}

export function genererStructureJson(conteneurs) {
    const structure = {};
    conteneurs.forEach(conteneur => {
        const wagonKey = `wagon ${conteneur.wagon}`;
        structure[wagonKey] = {};

        conteneur.contents.forEach((marchandise, idx) => {
            const objetKey = `objet ${idx + 1}`;
            const positionObjet = {
                x: marchandise.position.x,
                y: marchandise.position.y,
                z: marchandise.position.z
            };
            structure[wagonKey][objetKey] = {
                longueur: marchandise.length,
                largeur: marchandise.width,
                hauteur: marchandise.height,
                designation: marchandise.designation,
                position: positionObjet
            };
        });
    });

    return structure;
}

export function processData3off(jsonString) {
    const jsonData = JSON.parse(jsonString);
    const marchandises = lireMarchandises(jsonData);

    const startReadingTime = Date.now();
    const endReadingTime = Date.now();
    console.log(`Temps d'exécution pour lire les marchandises: ${(endReadingTime - startReadingTime) / 1000} secondes`);

    const startLoadingTime = Date.now();
    const conteneurs = chargerMarchandises(marchandises);
    const endLoadingTime = Date.now();
    console.log(`Temps d'exécution pour charger les marchandises dans les conteneurs: ${(endLoadingTime - startLoadingTime) / 1000} secondes`);

    const structureJson = genererStructureJson(conteneurs);
    return structureJson;
}

// Fonction pour afficher un conteneur en 3D
export function plotConteneur3d(conteneur) {
    const { length: conteneurLength, width: conteneurWidth, height: conteneurHeight } = conteneur.getDimensions();
    // Placeholder for 3D plot function
    console.log("Plotting conteneur in 3D is not implemented in Node.js.");
}
