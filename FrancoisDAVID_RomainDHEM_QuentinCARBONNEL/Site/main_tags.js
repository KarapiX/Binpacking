// main_tags.js
import { initializeWagonLoader3D } from './3D_visu_tags.js';
import { loadWagonData } from './1D_visu_tags.js';
import { initializeWagonLoader } from './2D_visu_tags.js';

document.addEventListener("DOMContentLoaded", function() {
    initializeWagonLoader3D('container', 'd3online.json', 'accordion-list');
    initializeWagonLoader3D('container2', 'd3offline.json', 'accordion-list2');
    loadWagonData('1D_wagon.json');
    initializeWagonLoader();

    function attachAccordionEvents() {

        setTimeout(function() {

            const allPanels = document.querySelectorAll(`.accordion > dd`);
            document.querySelectorAll(`.accordion > dt > a`).forEach(function(trigger) {

                trigger.addEventListener('click', function(e) {
                    e.preventDefault();
                    const panel = this.parentNode.nextElementSibling;

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
        }, 1000);
    }
    function attachAccordionEvents2() {

        setTimeout(function() {

            const allPanels = document.querySelectorAll(`.accordion2 > dd`);
            document.querySelectorAll(`.accordion2 > dt > a`).forEach(function(trigger) {

                trigger.addEventListener('click', function(e) {
                    e.preventDefault();
                    const panel = this.parentNode.nextElementSibling;

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
        }, 1000);
    }
    attachAccordionEvents2()
    attachAccordionEvents()
});
