import { loadstyle } from "../../../load";
import * as jlink from '../../../util/jlink';
import * as loader from '../../../util/loader';
import * as path from 'path'
loadstyle(path.join(__dirname, './media/flash.css'));

import * as fs from 'fs';
import { workbench, workbenchAction } from '../workbench'
import { dom, emptyDom, quickDom } from '../../../dom/dom'
import { activity, activitybar } from '../../activitybar/activitybar'
import { messageHandle, writeMessage } from '../message'
import * as request from 'ajax-request';


const { dialog } = require('electron').remote;

function flashCb(act: activity, context: any) {
	// check for internet connection

	// var dns = require('dns');
	// dns.lookupService('8.8.8.8', 53, function (err, hostname, service) {
	// 	console.log(hostname, service);
	// 	if (err) {
	// 		console.log('Not connected');
	// 		writeMessage('warning', 'Please connect to internet to get configuration from server');
	// 	} else {
	// 		console.log('connected');
	// 	}
	// });
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

		this.flashTrigger.on('click', async (e: Event) => {
			var i = 0;
			if ((typeof this.binaryPath === 'undefined') || (!fs.existsSync(this.binaryPath[0]))) {
				writeMessage('error', 'Please select a valid file path');
				return;
			}
			// Get cofiguration from server
			loader.startLoader();
			try {
				var deviceInfo = await getDeviceInfo();
			} catch (err) {
				console.error('Not able to get the configuration from the server');
				console.error(err);
				writeMessage('error', 'Not able to get the configuration from the server');
				loader.stopLoader();
				return;

			}
			console.log(deviceInfo);
			console.log(deviceInfo[0].MacAddress);
			// Generate bin file from the configuration got from the server

			// Get binary from the user and join the config bin to the main hex file

			loader.stopLoader();
			jlink.checkJLinkConnection().then(() => {
				// Join the hex file and the config bin file

				jlink.flashProgram(this.binaryPath, percent => {
					console.log(percent);
					this.setPercentage(percent);
				}).then(result => {
					this.setPercentage(0);
					// Acknowledge the server

				}).catch(e => {
					writeMessage('error', e.message);
				});
			}).catch(e => {
				writeMessage('error', 'JLink debugger not connected / some-one else using the JLink debugger');
			});
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

function getDeviceInfo(): Promise<any> {
	return new Promise((r, e) => {
		request({
			url: 'http://debug-portal.coolrgroup.com/Controllers/DeviceRawData.ashx?action=getNewDeviceList&asarray=0',
			method: 'GET',
			json: true
		}, (err, res, body) => {
			if (err) {
				console.error('Error has happened ' + err);
				e(err);
			} else {
				r(JSON.parse(body));
			}
		});
	});
}