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
        emptyDom().element('div', 'statusbar-progress').apendTo(this.container);
    }

    updateStyle() {
        // style update for statusbar
        super.updateStyle();
        let container = this.getcontainer();
    }
}