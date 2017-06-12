import { loadstyle } from "../load";
import * as path from 'path';
loadstyle(path.join(__dirname, './media/loader.css'));

import {emptyDom, quickDom} from '../dom/dom'

export function loaderInitialize() {
    var gridContainer = emptyDom().element('div', 'sk-cube-grid-container');
    gridContainer.apendTo(quickDom(document.body));
    var grid = emptyDom().element('div', 'sk-cube-grid');
    grid.apendTo(gridContainer);
    emptyDom().element('div', 'sk-cube sk-cube1').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube2').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube3').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube4').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube5').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube6').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube7').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube8').apendTo(grid);
    emptyDom().element('div', 'sk-cube sk-cube9').apendTo(grid);    
}

export function startLoader() {
    var container = document.getElementsByClassName('sk-cube-grid-container');
    (<HTMLElement>container.item(0)).style.zIndex = '10';
    var cubes = document.querySelectorAll('.sk-cube-grid .sk-cube');
    for(let i = 0; i < cubes.length; i++) {
        (<HTMLElement>cubes.item(i)).style.animationPlayState = 'running';
    }
}

export function stopLoader() {
    var container = document.getElementsByClassName('sk-cube-grid-container');
     var cubes = document.querySelectorAll('.sk-cube-grid .sk-cube');
    for(let i = 0; i < cubes.length; i++) {
        (<HTMLElement>cubes.item(i)).style.animationPlayState = 'paused';
    }
    (<HTMLElement>container.item(0)).style.zIndex = '-1';
}