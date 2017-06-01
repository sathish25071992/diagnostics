import { loadstyle } from "../../load";
import * as path from 'path';
loadstyle(path.join(__dirname, './media/workbench.css'));

import { dom, quickDom, emptyDom } from '../../dom/dom'
import { component } from '../component'

export class workbenchAction {

}

export class workbench extends component {
    private parent: dom;
    public currentChild: dom
    private children: dom[];
    constructor(
        parent: dom
    ) {
        super();
        if (!parent) {
            throw new Error('Invalid call to workbench');
        }
        this.container = emptyDom().element('div', 'workbench');
        this.container.apendTo(parent);
    }
    updateStyle() {
        super.updateStyle();
        let container = this.getcontainer();
    }

    addWorkbench(child: dom) {
        this.container.clearChildren();
        this.currentChild = child;
        child.apendTo(this.container);
    }
}