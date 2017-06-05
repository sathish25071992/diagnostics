import { loadstyle } from "../../../load";
import * as path from 'path'
loadstyle(path.join(__dirname, './media/flash.css'));

import {workbench, workbenchAction} from '../workbench'
import {dom, emptyDom} from '../../../dom/dom'
import {activity, activitybar} from '../../activitybar/activitybar'

function flashCb(act: activity, context: any) {

}

export class flash extends workbenchAction {
	flashActionElement: dom;

    private action: workbenchAction;
    private activity: activity;

	private info: dom;
	private textbox: dom;
	private button: dom;
	private flashTrigger: dom;
	private progress: dom;
	private progress_text: dom;
	

    constructor(activitybar: activitybar, workbench: workbench) {
        super('Flash', emptyDom().element('div', 'flash-action'));

		console.log('Contructing flash UI');

        console.log(this.actionElement);

        this.flashActionElement = this.actionElement;

        // create a workbechAction
        this.action = workbench.addWorkbench(this);

        // Create a workbench action and append to action container


        // Create a activity
        this.activity = activitybar.addActivity('flash', this.action, this, flashCb);

		// populate content to the flash part

		this.info = emptyDom().element('div', 'flash-info');
		this.info.apendTo(this.flashActionElement);

		var a = emptyDom().element('a', '');

		a.getHTMLElement().innerText = 'Select the hex file to flash';
		a.apendTo(this.info);

		var getPath = emptyDom().element('div', 'flash-getpath');
		getPath.apendTo(this.flashActionElement);

		var userInput = emptyDom().element('div', 'flash-textbox');
		userInput.apendTo(getPath);

		this.textbox = emptyDom().element('div', 'textbox');
		this.textbox.apendTo(userInput);

		var userSelect = emptyDom().element('div', 'flash-selectbutton');
		userSelect.apendTo(getPath);

		this.button = emptyDom().element('div', 'button');
		this.button.apendTo(userSelect);		

		var flash_trigger = emptyDom().element('div', 'flash-trigger');
		flash_trigger.apendTo(this.flashActionElement);

		this.flashTrigger = emptyDom().element('div', 'trigger');
		this.flashTrigger.apendTo(flash_trigger);


		var flash_progress = emptyDom().element('div', 'flash-progress');
		flash_progress.apendTo(this.flashActionElement);

		this.progress = emptyDom().element('div', 'progress');
		this.progress.apendTo(flash_progress);

		this.progress_text = emptyDom().element('div', 'progress-text');
		this.progress_text.apendTo(flash_progress);
	}
		
}