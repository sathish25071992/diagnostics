import { loadstyle } from "../../load";
import * as path from 'path';

import { dom, quickDom, emptyDom } from '../../dom/dom'
import { component } from '../component'

export class activity {
    public name: string;
    public label: dom;
    public isActive: boolean;
    public workbench: dom;
    constructor(name: string) {
        this.name = name;
        this.isActive = false;
    }
}

console.log(path.join(__dirname, './media/activitybar.css'));

loadstyle(path.join(__dirname, './media/activitybar.css'));

export class activitybar extends component {
    private activityList: dom;
    private activities: activity[];
    constructor(
        parent: dom
    ) {
        super();
        if (!parent) {
            throw new Error('Invalid call to activitybar');
        }
        this.container = emptyDom().element('div', 'activitybar');
        this.container.apendTo(parent);
        this.activities = new Array();
        // Add containers for activity
        this.createActivity();
    }

    createActivity() {
        let activityparent = emptyDom().element('div', 'activity-container');
        activityparent.apendTo(this.container);

        this.activityList = emptyDom().element('ul', 'activity-list');
        this.activityList.apendTo(activityparent);
    }

    updateStyle() {
        // style update for statusbar
        super.updateStyle();
    }

    addActivity(name: string, workbench: dom | undefined, fn: (act: activity) => void) {
        let act = new activity(name);
        var item = emptyDom().element('li', 'activity-item');
        item.apendTo(this.activityList);

        act.label = emptyDom().element('a', 'activity-label');
        act.label.apendTo(item);
        act.label.addClass(act.name);
        act.label.title(act.name);

        if (typeof workbench !== 'undefined') {
            act.workbench = workbench;
            act.workbench.addClass('hide');
        }

        item.on('mouseover', (e: Event) => {
            act.label.addClass('active');
        })
        item.on('mouseout', (e: Event) => {
            if (act.isActive !== true) {
                act.label.removeClass('active');
            }
        })
        item.on('mousedown', (e: Event) => {
            act.label.addClass('active');
        })
        item.on('mouseup', (e: Event) => {
            if (act.isActive !== true) {
                act.label.removeClass('active');
            }
        })
        item.on('click', (e: Event) => {
            e.preventDefault();
            for (let i = 0; i < this.activities.length; i++) {
                this.activities[i].label.getHTMLElement().classList.remove('active');
                if (typeof this.activities[i].workbench !== 'undefined') {
                    this.activities[i].workbench.addClass('hide');
                }
                this.activities[i].isActive = false;
            }
            act.label.addClass('active');
            act.isActive = true;
            if (typeof act.workbench !== 'undefined') {
                act.workbench.removeClass('hide');
            }
            console.log('Invoking the registered workbench');
            console.log(act);
            //after this call the registered callback
            fn(act);
        })
        this.activities.push(act);
    }
}