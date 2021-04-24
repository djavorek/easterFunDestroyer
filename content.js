'use strict';

var setup;

const addModule = (filename) => {
    const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;

    const newModule = document.createElement('script');
    newModule.setAttribute("type", "module");
    newModule.setAttribute("src", chrome.extension.getURL(filename));

    head.insertBefore(newModule, head.lastChild);
}

if (!setup) {
    setup = true;
    addModule('grid.js');
    addModule('expectimax.js');
    addModule('solver.js');
    addModule('start.js');
    

    // const solver = document.createElement('script');
    // solver.setAttribute("type", "module");
    // solver.setAttribute("src", chrome.extension.getURL('solver.js'));

    // head.insertBefore(solver, head.lastChild);

    // const starter = document.createElement('script');
    // starter.setAttribute("type", "module");
    // starter.setAttribute("src", chrome.extension.getURL('start.js'));

    // head.insertBefore(starter, head.lastChild);
}