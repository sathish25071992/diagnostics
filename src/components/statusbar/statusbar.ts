import {dom, quickDom, emptyDom} from '../../dom/dom'
import {component} from '../../components/component'

import { loadstyle } from "../../load";
import * as path from 'path'
loadstyle(path.join(__dirname, './media/statusbar.css'));

export class statusbar extends component {
    // private container: dom;
    constructor (
        parent: dom
    ) {
        super();
        if(!parent) {
            throw new Error('Invalid call to statubar');
        }
        this.container = emptyDom().element('div', 'statusbar');
        this.container.apendTo(parent);

        var progress = emptyDom().element('div', 'statusbar-progress');
        progress.apendTo(this.container);

        var info = emptyDom().element('ul', 'status-info');
        info.apendTo(progress);
    }

    updateStyle() {
        // style update for statusbar
        super.updateStyle();
        let container = this.getcontainer();
    }
}

export interface statusInfo {
    name: string;
    element: dom
}

export function registerStatusInfo(name: string): statusInfo | null {
    var statusInfo = document.querySelectorAll('ul.status-info');
    if(statusInfo === null) {
        console.error('not able to find the status bar. Please create the instance of statusbar first.');
        return null;
    }
    var info: statusInfo = {name: name, element: emptyDom().element('li', 'status-info-element')}
    info.element.setID(name);
    info.element.apendTo(quickDom(statusInfo.item(0)));

    return info;
}

function generateProgressBar(parent:dom) {
    emptyDom().element('div', 'css-load-shaft1').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft2').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft3').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft4').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft5').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft6').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft7').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft8').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft9').apendTo(parent);
    emptyDom().element('div', 'css-load-shaft10').apendTo(parent);

}