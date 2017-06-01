import { dom, emptyDom, quickDom } from '../dom/dom'
import { statusbar } from '../components/statusbar/statusbar'
import { activitybar, activity } from '../components/activitybar/activitybar'
import { workbench } from '../components/workbench/workbench'
import { Dimension } from './util'
import { diagnostics, startDiagnostics } from '../components/workbench/diagnostics/diagnostics'

import { component } from '../components/component'
import * as noble from 'noble'
import * as Promise from 'bluebird'


const MIN_WORKBENCH_HEIGHT = 70;
const MIN_WORKBENCH_WIDTH = 220;
const STATUS_BAR_HEIGHT = 22;
const ACTIVITY_BAR_WIDTH = 50;

interface componentLayoutInfo {
	activitybar: { width: number; };
	workbench: { minWidth: number; minHeight: number; };
	statusbar: { height: number; };
}

const diagnosticsFrequency = 1000;
const serviceUUID = '6612';
const humidityThres = 5;
const temperatureThres = 5;
const ambientThres	= 5;
var serviceDataValid = false;

const serviceDataOffset = {
	temperature		: {offset: 0, type: 'int16_t'},
	humidity		: {offset: 2, type: 'uint8_t'},
	ambientLight	: {offset: 3, type: 'uint16_t'},
	doorTimeStamp	: {offset: 5, type: 'uint32_t'},
}

var serviceData = {
	temperature		: 0,
	humidity		: 0,
	ambientLight	: 0,
	doorTimeStamp	: 0,
}

function getTypedData(buf, offset, type) {
	var value;
	switch (type) {
		case 'uint16_t':
			value = buf.readUInt16LE(offset);
			break;
		case 'uint32_t':
			value = buf.readUInt32LE(offset);
			break;
		case 'int16_t':
			value = buf.readInt16LE(offset);
			break;
		case 'uint8_t':
			value = buf.readUInt8(offset);
			break;
		case 'float':
			value = buf.readFloatLE(offset);
			break;
		case 'bool':
			value = buf.readUInt8(offset);
			break;
		default:
			break;
	}
	return value;
}

noble.on('stateChange', state => {
  if (state === 'poweredOn') {
	//   console.log('Scanning for devices');
	  noble.startScanning([], true);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', periperal => {
	// console.log('discovered ' + periperal.advertisement.localName);
	if(typeof periperal.advertisement.localName == 'undefined') {
		return;
	}
	else if((periperal.advertisement.localName.indexOf('STT-') == 0) && (periperal.advertisement.serviceData[0].uuid == serviceUUID)) {
		// console.log('device name is ' + periperal.advertisement.localName);
		// console.log(periperal.advertisement.serviceData[0].data);
		for(var prop in serviceDataOffset) {
			serviceData[prop] = getTypedData(periperal.advertisement.serviceData[0].data, serviceDataOffset[prop].offset, serviceDataOffset[prop].type);
			if(prop === 'temperature') {
				serviceData[prop] = serviceData[prop] / 10;
				// console.log('temperature value = ' + serviceData[prop]);
			}
		}
		serviceDataValid = true;
	}
})

function handleDiagnostics(result: any) {
	                        console.log(result.context);

	if(serviceDataValid == false) {
		setTimeout(() => startDiagnostics(result.context).then(handleDiagnostics), diagnosticsFrequency);
		return;
	}
	console.log(result.diagnosticsData);
	// Check condition for THA verification

	var info = 'Temperaure value = ' + (result.diagnosticsData.temperatureValue / 10) + '\n';
	var info = info + 'Humidity value value = ' + result.diagnosticsData.humidityValue;

	result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('idle');
	result.context.diagnostics.temperatureResult.diagnosticsContent.diagnosticsinfo(info);

	if(((result.diagnosticsData.temperatureValue - temperatureThres) > serviceData.temperature) ||  
	((result.diagnosticsData.temperatureValue - temperatureThres) < serviceData.temperature)) {
		result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('failed');
		result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('success');
		result.context.diagnostics.temperatureResult.diagnosticsContent.diagnosticsresult('Failed');
		result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.addClass('failed');
	} else {
		result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('failed');
		result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('success');
		result.context.diagnostics.temperatureResult.diagnosticsContent.diagnosticsresult('Success');
		result.context.diagnostics.temperatureResult.diagnosticsContent.content.contentContainer.addClass('success');
	}

	var info = 'Ambient light value = ' + (result.diagnosticsData.AmbientlightValue);

	result.context.diagnostics.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('idle');
	result.context.diagnostics.ambientLightResult.diagnosticsContent.diagnosticsinfo(info);
	result.context.diagnostics.ambientLightResult.diagnosticsContent.diagnosticsresult('Success');
	result.context.diagnostics.ambientLightResult.diagnosticsContent.content.contentContainer.addClass('success');

	var info = '9-axis value = ' + (result.diagnosticsData.AccXData);

	result.context.diagnostics._9axisResult.diagnosticsContent.content.contentContainer.removeClass('idle');
	result.context.diagnostics._9axisResult.diagnosticsContent.diagnosticsinfo(info);
	result.context.diagnostics._9axisResult.diagnosticsContent.diagnosticsresult('Success');
	result.context.diagnostics._9axisResult.diagnosticsContent.content.contentContainer.addClass('success');
	// if(((result.diagnosticsData.humidityValue) > (serviceData.humidity + humidityThres)) ||  
	// ((result.diagnosticsData.humidityValue) < (serviceData.humidity - humidityThres))) {
	// 	console.error('Humidity sensor is not proper');
	// }

	// if(((result.diagnosticsData.AmbientlightValue) > (serviceData.ambientLight + ambientThres)) ||  
	// ((result.diagnosticsData.AmbientlightValue) < (serviceData.ambientLight - ambientThres))) {
	// 	console.error('Ambient light sensor is not proper');
	// }
	// console.log("Diagnostics is complete!!!");
	// setTimeout(() => startDiagnostics().then(handleDiagnostics), diagnosticsFrequency);
}

// Add check for the timestamp that the service data is latest ???

//startDiagnostics().then(handleDiagnostics);


export class workspace {
	private parent: dom;
	private workspaceContainer: dom;
	private statusbar: component;
	private activitybar: activitybar;
	private workbench: workbench;
	private workspaceSize: Dimension;
	private componentInfo: componentLayoutInfo;
	public diagnostics: diagnostics;

	private statusBarHeight: number;
	private activityBarWidth: number;

	constructor() {
		document.body.style.margin = '0px 0px 0px 0px';
		this.componentInfo = this.getComponentInfo();
	}

	private getComponentInfo(): componentLayoutInfo {
		return {
			activitybar: {
				width: ACTIVITY_BAR_WIDTH
			},
			workbench: {
				minWidth: MIN_WORKBENCH_WIDTH,
				minHeight: MIN_WORKBENCH_HEIGHT
			},
			statusbar: {
				height: STATUS_BAR_HEIGHT
			}
		};
	}

	createElements() {
		// create and layout the DOMs

		this.statusbar = new statusbar(this.workspaceContainer);
		this.activitybar = new activitybar(this.workspaceContainer);
		this.workbench = new workbench(this.workspaceContainer);
	}

	private layout() {
		this.workspaceSize = this.parent.getClientArea();

		this.statusBarHeight = this.componentInfo.statusbar.height;
		this.activityBarWidth = this.componentInfo.activitybar.width;

		this.statusbar.getcontainer().position(this.workspaceSize.height - this.statusBarHeight);
		this.statusbar.getcontainer().getHTMLElement().style.width = this.workspaceSize.width + 'px';
		this.statusbar.getcontainer().getHTMLElement().style.height = this.statusBarHeight + 'px';

		this.activitybar.getcontainer().position(0, undefined, 0, 0);
		this.activitybar.getcontainer().getHTMLElement().style.width = this.activityBarWidth + 'px';
		this.activitybar.getcontainer().getHTMLElement().style.height = (this.workspaceSize.height - this.statusBarHeight) + 'px';

		this.workbench.getcontainer().position(0, 0, 0, this.activityBarWidth);
		this.workbench.getcontainer().getHTMLElement().style.width = (this.workspaceSize.width - this.activityBarWidth) + 'px';
		this.workbench.getcontainer().getHTMLElement().style.height = (this.workspaceSize.height - this.statusBarHeight) + 'px';

		this.statusbar.updateStyle();
		this.activitybar.updateStyle();
		this.workbench.updateStyle();
	}

	private registerListeners() {
		quickDom(window).on('resize', () => this.layout());
	}

	public open() {
		this.workspaceContainer = emptyDom().element('div', 'workspace');
		this.parent = quickDom(document.body);
		this.workspaceContainer.apendTo(this.parent);

		this.createElements();
		this.layout();
		this.registerListeners();

		// this.workbench.addWorkbenchAction('welcome');

		this.diagnostics = new diagnostics();
		this.workbench.addWorkbench(this.diagnostics.container);

		this.activitybar.addActivity('configuration', undefined, this, configWorkbenchHandler,);
		this.activitybar.addActivity('upgrade', undefined, this, upgradeWorkbenchHandler);
		this.activitybar.addActivity('diagnostics', this.diagnostics.container, this, diagnosticsWorkbenchHandler);
	}
}

function diagnosticsWorkbenchHandler(act: activity, context: workspace): void {
	console.log('diagnostics workbench activated');
	startDiagnostics(context).then(handleDiagnostics);
	console.log(act);
}

function configWorkbenchHandler(act: activity, context: workspace): void {

}

function upgradeWorkbenchHandler(act: activity, context: workspace): void {

}