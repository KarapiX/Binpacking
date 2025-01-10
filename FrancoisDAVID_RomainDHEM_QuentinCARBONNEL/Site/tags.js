import { processData } from './jstopit_1D.js';
import {loadWagonData} from './1D_visu_tags.js';
import { processDataoff } from './jstopit_2Doff.js';
import { processDataon } from './jstopit_2Don.js';
import {initializeWagonLoader} from './2D_visu_tags.js';
import { processData3on } from "./jstopit_3Don.js";
import { processData3off } from "./jstopit_3Doff.js";
import {initializeWagonLoader3D} from './3D_visu_tags.js';

// Fonction pour ajouter un tag lorsque le bouton est cliqué
function handleAddTag() {
    const name = document.getElementById('name').value;
    const width = document.getElementById('width').value;
    const length = document.getElementById('length').value;
    const height = document.getElementById('height').value;

    const isNumber = value => /^\d+(\.\d+)?$/.test(value);

    if (name && isNumber(width) && isNumber(length) && isNumber(height)) {
        const tagContainer = document.getElementById('tags-container');

        const tagButton = createTagButton(name, width, length, height);
        tagContainer.appendChild(tagButton);

        // Clear form inputs
        document.getElementById('name').value = '';
        document.getElementById('width').value = '';
        document.getElementById('length').value = '';
        document.getElementById('height').value = '';

        // Add drag and drop functionality
        addDragAndDrop(tagButton);
    } else {
        alert('Veuillez remplir tous les champs avec des valeurs valides.');
    }
}

// Créer un élément de tag avec les données spécifiées
function createTagButton(name, width, length, height) {
    const tagButton = document.createElement('div');
    tagButton.className = 'tag-button';
    tagButton.setAttribute('draggable', 'true');

    const borderAnimation = document.createElement('div');
    borderAnimation.className = 'border-animation';

    const tagButtonInner = document.createElement('span');
    tagButtonInner.className = 'tag-button-inner';

    const tagText = document.createElement('span');
    tagText.textContent = `${name} (${width}x${length}x${height})`;

    const removeTag = document.createElement('span');
    removeTag.className = 'remove-tag';
    removeTag.innerHTML = 'x';
    removeTag.addEventListener('click', function() {
        tagButton.parentNode.removeChild(tagButton);
    });

    tagButtonInner.appendChild(tagText);
    tagButtonInner.appendChild(removeTag);
    tagButton.appendChild(borderAnimation);
    tagButton.appendChild(tagButtonInner);

    return tagButton;
}

// Gérer la génération du JSON et l'affichage simulé des résultats
function handleGenerateJSON() {
    const tags = document.querySelectorAll('.tag-button-inner');
    const tagsData = [];

    tags.forEach(tag => {
        const text = tag.childNodes[0].textContent;
        const matches = text.match(/(.*)\s\((\d+(\.\d+)?)x(\d+(\.\d+)?)x(\d+(\.\d+)?)\)/);
        if (matches) {
            const [, name, width, , length, , height] = matches;
            tagsData.push({ name, width: parseFloat(width), length: parseFloat(length), height: parseFloat(height) });
        }
    });

    const jsonData = JSON.stringify(tagsData, null, 2);
    // Affichage des résultats simulés
    displayVisualizations(jsonData);
}

// Simuler l'affichage des résultats
function displayVisualizations(data) {
    // Calcul et retour des resultats par fichier py en js
    try {
        const outputData = processData(data);
        // Utilisez outputData comme nécessaire, par exemple pour afficher ou enregistrer les résultats.
        document.getElementById('scrollable-container-online').innerHTML = '';
        document.getElementById('scrollable-container-offline').innerHTML = '';
        loadWagonData(outputData)
    } catch (error) {
        console.error('Error processing data:', error.message);
    }
    try {
        const outputData = processDataon(data);
        const outputData2 = processDataoff(data);
        // Utilisez outputData comme nécessaire, par exemple pour afficher ou enregistrer les résultats.
        document.getElementById('online-wagons-container').innerHTML = '';
        document.getElementById('offline-wagons-container').innerHTML = '';
        initializeWagonLoader(outputData, outputData2)
    } catch (error) {
        console.error('Error processing data:', error.message);
    }
    try {
        const outputData = processData3on(data);
        const outputData2 = processData3off(data);
        // Utilisez outputData comme nécessaire, par exemple pour afficher ou enregistrer les résultats.
        document.getElementById('container').innerHTML = '';
        document.getElementById('container2').innerHTML = '';
        document.getElementById('accordion-list').innerHTML = '';
        document.getElementById('accordion-list2').innerHTML = '';
        initializeWagonLoader3D('container',outputData,'accordion-list')
        initializeWagonLoader3D('container2',outputData2,'accordion-list2')
    } catch (error) {
        console.error('Error processing data:', error.message);
    }
    setTimeout(function() {
        var allPanels = document.querySelectorAll('.accordion2 > dd');

        document.querySelectorAll('.accordion2 > dt > a').forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
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
    setTimeout(function() {
        var allPanels = document.querySelectorAll('.accordion > dd');

        document.querySelectorAll('.accordion > dt > a').forEach(function(trigger) {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
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
}

// Fonction pour générer et télécharger le fichier JSON
function generateAndDownloadJSON(jsonData) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'tags_data.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Fonction d'initialisation pour ajouter les écouteurs d'événements
function initializeListeners() {
    document.getElementById('add-tag-button').addEventListener('click', handleAddTag);
    document.getElementById('generate-json-button').addEventListener('click', handleGenerateJSON);
}

// Fonction pour ajouter le drag and drop à un tag
function addDragAndDrop(tagButton) {
    tagButton.addEventListener('dragstart', function(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.outerHTML);
        gsap.to(e.target, { scale: 0.9 });
        e.target.classList.add('dragging');
        setTimeout(() => e.target.classList.add('hidden'), 0);
        gsap.to(e.target, { scale: 0.95, duration: 0.5, yoyo: true, repeat: -1, ease: "power1.inOut" });
    });

    tagButton.addEventListener('dragend', function(e) {
        gsap.to(e.target, { scale: 1 });
        e.target.classList.remove('dragging', 'hidden');
        e.target.style.position = 'static';
        gsap.killTweensOf(e.target);
        resetAllTagsSize();
    });

    const tagsContainer = document.getElementById('tags-container');

    tagsContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        const draggingElement = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(tagsContainer, e.clientX, e.clientY);
        if (afterElement == null) {
            tagsContainer.appendChild(draggingElement);
        } else {
            tagsContainer.insertBefore(draggingElement, afterElement);
        }
        if (!draggingElement.classList.contains('moving')) {
            gsap.to(draggingElement, { scale: 0.95, duration: 0.5, yoyo: true, repeat: -1, ease: "power1.inOut" });
            draggingElement.classList.add('moving');
        }
    });

    tagsContainer.addEventListener('dragleave', function(e) {
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
            gsap.killTweensOf(draggingElement);
            gsap.to(draggingElement, { scale: 0.95, duration: 0.5, yoyo: true, repeat: -1, ease: "power1.inOut" });
        }
    });

    tagsContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        const draggingElement = document.querySelector('.dragging');
        draggingElement.classList.remove('hidden');
        gsap.killTweensOf(draggingElement);
        gsap.to(draggingElement, { scale: 1, duration: 0.5 });
        draggingElement.classList.remove('moving');
        resetAllTagsSize();
    });
}

// Fonction pour obtenir l'élément le plus proche pendant un drag and drop
function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.tag-button:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offsetX = x - box.left - box.width / 2;
        const offsetY = y - box.top - box.height / 2;
        const offset = Math.abs(offsetX) + Math.abs(offsetY);
        if (offset < closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.POSITIVE_INFINITY }).element || null;
}

// Réinitialiser la taille de tous les tags après un drag and drop
function resetAllTagsSize() {
    const allTags = document.querySelectorAll('.tag-button');
    allTags.forEach(tag => {
        gsap.to(tag, { scale: 1, duration: 0.5 });
    });
}

// Initialisation du script
initializeListeners();

// Initialiser le drag and drop pour les tags existants
document.querySelectorAll('.tag-button').forEach(addDragAndDrop);

document.addEventListener('DOMContentLoaded', (event) => {
    // Fonction pour générer des valeurs aléatoires dans une plage donnée
    function getRandomValue(min, max) {
        return (Math.random() * (max - min) + min).toFixed(2);
    }

    // Fonction pour générer des valeurs aléatoires pour chaque champ
    function fillRandomValues() {
        document.getElementById('name').value = 'Random Name';
        document.getElementById('width').value = getRandomValue(0.1, 2.293);
        document.getElementById('length').value = getRandomValue(0.1, 11.582);
        document.getElementById('height').value = getRandomValue(0.1, 2.55);
    }

    // Ajouter un événement au bouton "Random"
    document.getElementById('random-button').addEventListener('click', () => {
        fillRandomValues();
        document.getElementById('add-tag-button').click();
    });
});
