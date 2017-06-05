import { loadstyle } from "../../load";
import * as path from 'path';
loadstyle(path.join(__dirname, './media/workbench.css'));

import { dom, quickDom, emptyDom } from '../../dom/dom'
import { component } from '../component'
import { diagnostics, startDiagnostics } from '../workbench/diagnostics/diagnostics'

export class workbenchAction {
    title: string;
    private activateCb;
    actionElement: dom;    
    parent: dom;

    public workbench: workbench;

    private _active: boolean;
    set active(val: boolean) {
        this._active = val;
        if(typeof this.parent === 'undefined') {
            return;
        }
        if(val != true) {
        this.actionElement.addClass('hide');

        if(this.parent.getHTMLElement().contains(this.actionElement.getHTMLElement())) {
            this.parent.getHTMLElement().removeChild(this.actionElement.getHTMLElement());

        }
        } else {
        this.actionElement.removeClass('hide');
        this.actionElement.apendTo(this.parent);
        this.workbench.setTitle(this.title);
        console.log('setting title to ', this.title);
                    
        }
        // this.activateCb(this);
    }
    get active() {
        return this._active;
    }
    registeractivateHandler(fn:(workbenchAction) => void) {
        this.activateCb = fn;
    }
    

    constructor(title: string, action: dom){
        this.title = title || '';
        this.actionElement = action;
        this.active = false;
    }
}

export class workbench extends component {
    private parent: dom;
    public currentChild: dom
    private children: dom[];
    diagnostics: workbenchAction;
    actionList: workbenchAction[];

    actionContainer: dom;
    titleContainer: dom
    titlebar: dom;

    constructor(
        parent: dom
    ) {
        super();
        if (!parent) {
            throw new Error('Invalid call to workbench');
        }
        this.container = emptyDom().element('div', 'workbench');
        this.container.apendTo(parent);
        this.actionList = new Array();

        this.actionContainer = emptyDom().element('div', 'workbench-action');

        this.titleContainer = emptyDom().element('div', 'workbench-title');

        this.titlebar = emptyDom().element('div', 'workbench-titlebar');
        this.titlebar.apendTo(this.titleContainer);

        var workbenchFill = emptyDom().element('div', 'workbench-fill');
        workbenchFill.apendTo(this.titleContainer);

        var titleLine = emptyDom().element('div', 'workbench-titleline');
        titleLine.apendTo(this.titleContainer);

        this.titleContainer.apendTo(this.container);
        this.actionContainer.apendTo(this.container);
    }

    setTitle(title:string) {
        if(!this.titlebar.getHTMLElement().hasChildNodes()) {
            console.log('creating child');
        var a = emptyDom().element('a', '');
        } else {
            var a = quickDom(this.titlebar.getHTMLElement().firstElementChild);
        }
        a.apendTo(this.titlebar);
        console.log(title);
        a.getHTMLElement().innerHTML = title;
    }

    updateStyle() {
        super.updateStyle();
    }

    addWorkbench(action: workbenchAction): workbenchAction {
        this.actionList.push(action);
        action.actionElement.apendTo(this.actionContainer);
        action.parent = this.actionContainer;
        action.workbench = this;        
        action.active= false;
        this.setTitle(action.title);
        return action;
    }
}