import { loadstyle } from "../../../load";
import * as path from 'path'
loadstyle(path.join(__dirname, './media/configuration.css'));


import { workbench, workbenchAction } from '../workbench'
import { dom, emptyDom, quickDom } from '../../../dom/dom'
import { activity, activitybar } from '../../activitybar/activitybar'
import { messageHandle, writeMessage } from '../message'

const defaultConfig = require('./configuration.json');

export var config = JSON.parse(JSON.stringify(defaultConfig));

var alignFlag = true;

function configCb() {

}

export class configuration extends workbenchAction {

	private configActionElement: dom;
	private action: workbenchAction;
	private activity: activity;

	private containerLeft: dom;
	private containerRight: dom;

	private save: dom;
	private reset: dom;
	private cancel: dom;

	constructor(activitybar: activitybar, workbench: workbench) {
		super('Configuration', emptyDom().element('div', 'configuration-action'));

		console.log('Contructing configuration UI');

		console.log(defaultConfig.name);

		console.log(this.actionElement);

		this.configActionElement = this.actionElement;

		// create a workbechAction
		this.action = workbench.addWorkbench(this);

		// Create a workbench action and append to action container


		// Create a activity
		this.activity = activitybar.addActivity('configuration', this.action, this, configCb);

		// populate content to the flash part

		var container = emptyDom().element('div', 'configuration-container');
		container.apendTo(this.configActionElement);

		var buttonsContainer = emptyDom().element('div', 'buttons-container');
		buttonsContainer.apendTo(this.configActionElement);

		var saveButton = emptyDom().element('div', 'save-button');
		saveButton.apendTo(buttonsContainer);

		this.save = emptyDom().element('div', 'save');
		this.save.apendTo(saveButton);

		var resetButton = emptyDom().element('div', 'reset-button');
		resetButton.apendTo(buttonsContainer);

		this.reset = emptyDom().element('div', 'reset');
		this.reset.apendTo(resetButton);

		var cancelButton = emptyDom().element('div', 'cancel-button');
		cancelButton.apendTo(buttonsContainer);

		this.cancel = emptyDom().element('div', 'cancel');
		this.cancel.apendTo(cancelButton);

		this.containerLeft = emptyDom().element('div', 'configuration-container-left');
		this.containerLeft.apendTo(container);

		this.containerRight = emptyDom().element('div', 'configuration-container-right');
		this.containerRight.apendTo(container);

		// register handlers

		this.save.on('click', saveConfig);
		this.reset.on('click', resetConfig);
		this.cancel.on('click', cancelConfig);

		this.createElement();

	}


	createElement() {
		for (var prop in defaultConfig) {
			this.addEntry(prop, defaultConfig[prop]);
		}
	}

	addEntry(name: string, value: string) {

		alignFlag = !alignFlag;
		var container: dom;

		if (alignFlag) {
			container = emptyDom().element('div', 'configuration-userInput');
			container.apendTo(this.containerRight);
		} else {
			container = emptyDom().element('div', 'configuration-userInput');
			container.apendTo(this.containerLeft);
		}


		var configName = emptyDom().element('div', 'configuration-name');
		configName.apendTo(container);
		configName.getHTMLElement().innerText = name;

		var configSeparator = emptyDom().element('div', 'configuration-separator');
		configSeparator.apendTo(container);
		configSeparator.getHTMLElement().innerText = ':';

		var config = emptyDom().element('input', 'configuration-user-input');
		config.apendTo(container);

		config.getHTMLElement().id = name;
		// (<HTMLInputElement>config.getHTMLElement()).value = value;


	}

}

function saveConfig() {
	//get all the config

	var configList = document.querySelectorAll('.configuration-user-input');

	// Check the configurations

	console.log('Config before save');
	console.log(config);

	var j = 0;
	var i = 0;

	for (i = 0; i < configList.length; i++) {
		// Do type check
		if (configList.item(i).id === '9-axis tolarence') {
			if (parseInt((<HTMLInputElement>configList.item(i)).value) > 100) {
				console.log('Invalid user iput for "9-axis tolarence"' + (<HTMLInputElement>configList.item(i)).value);
				configList.item(i).classList.add('error');
				continue;
			}
		}
		j++;
		configList.item(i).classList.remove('error');
		config[configList.item(i).id] = (<HTMLInputElement>configList.item(i)).value;
	}

	if(i !== j) {
		writeMessage('warning', "Invalid config detected. please correct the error");
	}

	console.log('Config after save');
	console.log(config);

}

function resetConfig() {
	console.log("reseting the configurations");
	console.log('Config before save');
	console.log(config);

	var configList = document.querySelectorAll('.configuration-user-input');

	config = JSON.parse(JSON.stringify(defaultConfig));

	for (let i = 0; i < configList.length; i++) {
		(<HTMLInputElement>configList.item(i)).value = config[configList.item(i).id];
	}

	console.log('Config after save');
	console.log(config);

}

function cancelConfig() {

}