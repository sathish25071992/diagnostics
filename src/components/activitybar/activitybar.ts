import { loadstyle } from "../../load";
import * as path from 'path';

import { dom, quickDom, emptyDom } from '../../dom/dom'
import { workbenchAction } from '../workbench/workbench'
import { component } from '../component'

export class activity {
    public name: string;
    public label: dom;
    private _isActive: boolean;
    isCurrent: boolean;
    set isActive(val:boolean) {
        this._isActive = val;        
        if(typeof this.label == 'undefined') {
            return;
        }
        if(val == true) {
            this.label.addClass('active');
        } else {
            this.label.removeClass('active');            
        }
    }
    get isActive() {
        return this._isActive;
    }
    public workbenchaction: workbenchAction;
    public workbench: dom;
    constructor(name: string) {
        this.name = name;
        this.isActive = false;
        this.isCurrent = false;
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

        let activityparent = emptyDom().element('div', 'activity-container');
        activityparent.apendTo(this.container);

        this.activityList = emptyDom().element('ul', 'activity-list');
        this.activityList.apendTo(activityparent);        
    }

    updateStyle() {
        // style update for statusbar
        super.updateStyle();
    }

    addActivity(name: string, workbench: workbenchAction | undefined, context: any, fn: (act: activity, context: any) => void): activity {
        let act = new activity(name);

        if(typeof workbench !== undefined) {
            act.workbenchaction = <workbenchAction>workbench;
        }
        var item = emptyDom().element('li', 'activity-item');
        item.apendTo(this.activityList);

        act.label = emptyDom().element('a', 'activity-label');
        act.label.apendTo(item);
        act.label.addClass(act.name);
        act.label.title(act.name);

        // if (typeof workbench !== 'undefined') {
        //     act.workbench = workbench;
        //     act.workbench.addClass('hide');
        // }

        item.on('mouseover', (e: Event) => {
            act.isActive = true;
        })
        item.on('mouseout', (e: Event) => {
            if (act.isCurrent !== true) {
                act.isActive = false;
            }
        })
        // item.on('mousedown', (e: Event) => {
        //     act.isActive = true;
        // })
        // item.on('mouseup', (e: Event) => {
        //     if (act.isCurrent !== true) {
        //         act.isActive = false;
        //     }
        // })
        item.on('click', (e: Event) => {
            e.preventDefault();
            for (let i = 0; i < this.activities.length; i++) {
                console.log(this.activities[i]);
                if(this.activities[i] === act) {
                    if (typeof this.activities[i].workbenchaction !== 'undefined') {
                        this.activities[i].workbenchaction.active = true;
                    }
                    this.activities[i].isActive = true;
                    this.activities[i].isCurrent = true;
                    console.log(act.isCurrent);

                } else {
                    if (typeof this.activities[i].workbenchaction !== 'undefined') {
                        this.activities[i].workbenchaction.active = false;
                    }
                    this.activities[i].isActive = false;
                    console.log('de-activated');
                    this.activities[i].isCurrent = false;
                }
            }
            // act.label.addClass('active');
            // act.isActive = true;
            // if (typeof act.workbench !== 'undefined') {
            //     act.workbench.removeClass('hide');
            // }
            // console.log('Invoking the registered workbench');
            console.log(act);
            //after this call the registered callback
            fn(act, context);
        })
        this.activities.push(act);
        return act;
    }
}