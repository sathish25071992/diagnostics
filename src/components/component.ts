import {dom} from '../dom/dom'
import {layout} from './layout'

export class component {
	public container: dom;
	private layout: layout;
	constructor() {

	}
	getcontainer(): dom {
		return this.container;
	}

	create(container: dom) {
		this.container = container;
	}
	updateStyle() {
		// dummy
	}
}