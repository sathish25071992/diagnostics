'use strict';

import {Dimension} from '../workspace/util'

export class dom {
    private currentElement: HTMLElement;

    constructor (
        element?: HTMLElement                  // chage to attr ???
    ) {
        // Create the element
        if(typeof element !== 'undefined') {
            this.currentElement = element;
        }
    }

    title(val?: string):string {
        if(typeof val != 'undefined') {
            this.currentElement.title = val;
        }
        return this.currentElement.title;
    }

    element( name: string, classname: string): dom { // change classname to multiple attr ???
        let element = document.createElement(name);
        this.currentElement = element;
        this.currentElement.setAttribute('class', classname);
        return this;
    }

    getHTMLElement(): HTMLElement {
        return this.currentElement;
    }
    apendTo(parent: dom): void {
        // if(typeof parent !== 'dom') {
        //     throw new Error('Invalid argument');
        // }
        
        parent.getHTMLElement().appendChild(this.getHTMLElement());
    }

    style(prop: string, value: ByteString) {
        if(prop.indexOf('-') >= 0) {
            let segments = prop.split('-');
            let key = segments[0];
            for(let i = 1; i < segments.length; i++) {
                let segment = segments[i];
                key = key + segment.charAt(0).toUpperCase() + segment.substr(1);
            }
            this.currentElement.style[key] = value;
        }
    }

    getClientArea(): Dimension {
        if (this.currentElement !== document.body) {
			return new Dimension(this.currentElement.clientWidth, this.currentElement.clientHeight);
		}

		// 1.) Try innerWidth / innerHeight
		if (window.innerWidth && window.innerHeight) {
			return new Dimension(window.innerWidth, window.innerHeight);
		}

		// 2.) Try with document.body.clientWidth / document.body.clientHeigh
		if (document.body && document.body.clientWidth && document.body.clientWidth) {
			return new Dimension(document.body.clientWidth, document.body.clientHeight);
		}

		// 3.) Try with document.documentElement.clientWidth / document.documentElement.clientHeight
		if (document.documentElement && document.documentElement.clientWidth && document.documentElement.clientHeight) {
			return new Dimension(document.documentElement.clientWidth, document.documentElement.clientHeight);
		}
        
        throw new Error('Unable to figure out browser width and height');
    }

    position (top: number, right?: number, bottom?: number, left?: number) {
        if(typeof top !== 'undefined') {
            this.currentElement.style.top = top + 'px';
        }
        if(typeof right !== 'undefined') {
            this.currentElement.style.right = right + 'px';
        }
        if(typeof bottom !== 'undefined') {
            this.currentElement.style.bottom = bottom + 'px';
        }
        if(typeof left !== 'undefined') {
            this.currentElement.style.left = left + 'px';            
        }

        this.currentElement.style.position = 'absolute';
    }

    on(type: string, fn: (e: Event) => void) {
        this.currentElement.addEventListener(type, fn);
    }

    addClass(name: string) {
        this.currentElement.classList.add(name);
    }
    removeClass(name: string) {
        this.currentElement.classList.remove(name);
    }
    clearChildren() {
        for(let i = 0; i < this.currentElement.childElementCount; i++) {
            this.currentElement.removeChild(this.currentElement.childNodes[i]);
        }
    }
}

export function quickDom(element: any) {
    // Add check codition for different elements ex.HTMLElement / window
    return new dom(element);
}

export function emptyDom(): dom {

    return new dom();
}