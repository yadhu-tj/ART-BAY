/* Main Entry Point for Head Logic */
import { initSearch } from './modules/search.js';
import { initModals } from './modules/modal-manager.js';
import { initAuth } from './modules/auth.js';
import { initArtist } from './modules/artist.js';
import { initUI } from './modules/ui.js';

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded - initializing modules...");

    initSearch();
    initModals();
    initAuth();
    initArtist();
    initUI();

    console.log("All modules initialized.");
});