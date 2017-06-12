import { loadstyle } from "../../../load";
import * as path from 'path'
loadstyle(path.join(__dirname, './media/configuration.css'));


import { workbench, workbenchAction } from '../workbench'
import { dom, emptyDom, quickDom } from '../../../dom/dom'
import { activity, activitybar } from '../../activitybar/activitybar'
import { messageHandle, writeMessage } from '../message'

const defaultConfig = require('./configuration.json');

export var config = {};

for (let entry in defaultConfig) {
	config[entry.replace(/\s/g, '_')] = defaultConfig[entry].value;
}

function configCb() {

}

export class configuration extends workbenchAction {

	private configActionElement: dom;
	private action: workbenchAction;
	private activity: activity;
	
	private form: dom;

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
		this.activity = activitybar.addActivity('configuration', this.action, this, configCb, true);

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

		this.form = emptyDom().element('form', 'configuration-form');
		this.form.apendTo(container);

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

	addEntry(name: string, configuration: { value, pattern, message, placeholder }) {
		// Create all the DOM elements

		var entry = emptyDom().element('div', 'configuration-entry');
		entry.apendTo(this.form);
		var labelContainer = emptyDom().element('div', 'configuration-label-container');
		labelContainer.apendTo(entry);

		var label = emptyDom().element('label', 'configuration-label');
		label.apendTo(labelContainer);

		var inputContainer = emptyDom().element('div', '');
		inputContainer.apendTo(entry);

		var input = emptyDom().element('input', 'configuration-input');
		input.apendTo(inputContainer);

		var bar = emptyDom().element('span', 'configuration-bar');
		bar.apendTo(inputContainer);

		var errorMessage = emptyDom().element('div', 'configuration-error');
		errorMessage.apendTo(inputContainer);

		var errorMessageLabel = emptyDom().element('label', 'configuration-error-label');
		errorMessageLabel.apendTo(errorMessage);

		// Configure all the DOM elements created before

		label.getHTMLElement().innerText = name;

		inputContainer.style('position', 'relative');

		console.error(input.style('left'));
		bar.style('left', input.style('left'));

		entry.setID(name.replace(/\s/g, '_'));

		input.attribute('value', configuration.value);
		input.attribute('type', 'text');
		input.attribute('pattern', configuration.pattern);
		input.attribute('placeholder', configuration.placeholder);
		input.setID(name.replace(/\s/g, '_'));
		// input.on('onfocusout', configurationInputFocusOutHandler);
		// input.on('onfocusin', configurationInputFocusInHandler);
		(<HTMLInputElement>input.getHTMLElement()).onfocus = configurationInputFocusInHandler;
		(<HTMLInputElement>input.getHTMLElement()).onblur = configurationInputFocusOutHandler;

		errorMessage.setID("configuration-error");
		errorMessageLabel.getHTMLElement().innerText = configuration.message;
	}

}

export function configurationInputFocusOutHandler(this: HTMLInputElement, e: FocusEvent): any {
	console.log(this);
	var entry = this.parentElement.parentElement;
	console.log('#' + entry.id + ' div' + ' .configuration-error');
	var message = document.querySelectorAll('#' + entry.id + ' div' + ' .configuration-error');
	console.log(message[0]);
	if (!this.checkValidity()) {
		(<HTMLElement>message[0]).style.opacity = '1';
		(<HTMLElement>message[0]).style.zIndex = '1';
		(<HTMLElement>message[0]).style.right = '-180px';
		this.style.borderBottom = '1px solid red';
	}
}

export function configurationInputFocusInHandler(this: HTMLElement, e: FocusEvent): any {
	var entry = this.parentElement.parentElement;
	console.log('#' + entry.id + ' div' + ' .configuration-error');
	var message = document.querySelectorAll('#' + entry.id + ' div' + ' .configuration-error');
	console.log(message[0]);
	(<HTMLElement>message[0]).style.opacity = '0';
	(<HTMLElement>message[0]).style.zIndex = '-1';
	(<HTMLElement>message[0]).style.right = '0px';
	this.style.borderBottom = '1px solid rgba(0,0,0,0.2)';
}

function saveConfig() {
	//get all the config

	var configList = document.querySelectorAll('.configuration-input');

	// Check the configurations

	console.log('Config before save');
	console.log(configList);

	var j = 0;
	var i = 0;
	console.log((<HTMLInputElement>configList.item(i)).checkValidity());
	for (i = 0; i < configList.length; i++) {
		if(!((<HTMLInputElement>configList.item(i)).checkValidity())) {
			continue;
		}
		j++;
		console.log(configList.item(i).id);
		config[configList.item(i).id] = (<HTMLInputElement>configList.item(i)).value;
	}

	if (i !== j) {
		writeMessage('error', "Invalid config detected. please correct the error");
	}

	console.log('Config after save');
	console.log(config);

}

function resetConfig() {
	console.log("reseting the configurations");
	console.log('Config before save');
	console.log(config);

	var configList = document.querySelectorAll('.configuration-input');

	for (let entry in defaultConfig) {
		config[entry] = defaultConfig[entry].value;
	}

	for (let i = 0; i < configList.length; i++) {
		(<HTMLInputElement>configList.item(i)).focus();
		(<HTMLInputElement>configList.item(i)).value = config[configList.item(i).id];
		(<HTMLInputElement>configList.item(i)).blur();		
	}

	console.log('Config after save');
	console.log(config);

}

function cancelConfig() {

}