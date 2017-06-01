import {dom, quickDom, emptyDom} from '../../dom/dom'
import {component} from '../../components/component'

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
    }

    updateStyle() {
        // style update for statusbar
        super.updateStyle();
        let container = this.getcontainer();
        container.style('background-color', 'rgba(0, 122, 204, 1)');
    }
}