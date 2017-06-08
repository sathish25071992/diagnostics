import { loadstyle } from "../../../load";
import * as jlink from '../../../util/jlink';
import * as path from 'path'
loadstyle(path.join(__dirname, './media/flash.css'));

import { workbench, workbenchAction } from '../workbench'
import { dom, emptyDom, quickDom } from '../../../dom/dom'
import { activity, activitybar } from '../../activitybar/activitybar'
import { messageHandle, writeMessage } from '../message'


const { dialog } = require('electron').remote;

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

	private binaryPath: string;

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

		this.createElement();

		this.button.on('click', (e: Event) => {
			this.setPath(dialog.showOpenDialog({ properties: ['openFile'] }));
		});

		process.stdout.on('data', (data) => {
			console.log(data);
		})

		this.flashTrigger.on('click', (e: Event) => {
			var i = 0;
			jlink.checkJLinkConnection().then(() => {
				jlink.flashProgram(this.binaryPath, percent => {
					console.log(percent);
					this.setPercentage(percent);

				});
			}).catch(e => {
				writeMessage('error', 'JLink debugger not connected / some-one else using the JLink debugger');
			});


			// var timer = setInterval((x) => {
			// 	if(i === 10) {
			// 		clearInterval(timer);
			// 	}
			// 	this.setPercentage(i * 10);
			// 	console.log(i);
			// 	i++;
			// }, 500, i);
		});

	}

	setPercentage(percent: number) {
		if ((percent < 0) && (percent > 100)) {
			return;
		}
		if (!this.progress_text.getHTMLElement().hasChildNodes()) {
			console.log('creating child');
			var a = emptyDom().element('a', '');
			a.apendTo(this.progress_text);
		} else {
			var a = quickDom(this.progress_text.getHTMLElement().firstElementChild);
		}
		console.log(percent);

		this.progress.getHTMLElement().style.width = percent + '%';
		a.getHTMLElement().innerHTML = percent + '%' + ' completed';
	}

	setPath(path: string) {
		(<HTMLInputElement>this.textbox.getHTMLElement()).value = path;
		this.binaryPath = path;
	}
	private createElement() {

		this.info = emptyDom().element('div', 'flash-info');
		this.info.apendTo(this.flashActionElement);

		var a = emptyDom().element('a', '');

		a.getHTMLElement().innerText = 'Select the hex file to flash';
		a.apendTo(this.info);

		var getPath = emptyDom().element('div', 'flash-getpath');
		getPath.apendTo(this.flashActionElement);

		var userInput = emptyDom().element('div', 'flash-textbox');
		userInput.apendTo(getPath);

		this.textbox = emptyDom().element('input', 'textbox');
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

		var progress = emptyDom().element('div', 'progress');
		progress.apendTo(flash_progress);
		this.progress = emptyDom().element('div', 'progress-bar');
		this.progress.apendTo(progress);

		this.progress_text = emptyDom().element('div', 'progress-text');
		this.progress_text.apendTo(flash_progress);

		var a = emptyDom().element('a', '');
		a.getHTMLElement().innerText = 'Browse';
		a.apendTo(this.button);

		a = emptyDom().element('a', '');
		a.getHTMLElement().innerText = 'Flash Binary';
		a.apendTo(this.flashTrigger);

		a = emptyDom().element('a', '');
		a.getHTMLElement().innerText = 'Flash not yet started';
		a.apendTo(this.progress_text);
	}

}