import { dom, emptyDom, quickDom, domContentLoaded } from '../dom/dom'
import { statusbar } from '../components/statusbar/statusbar'
import { activitybar, activity } from '../components/activitybar/activitybar'
import { workbench } from '../components/workbench/workbench'
import { Dimension } from './util'
import { diagnostics, startDiagnostics } from '../components/workbench/diagnostics/diagnostics'
import { flash } from '../components/workbench/flash/flash'
import { configuration } from '../components/workbench/configuration/configuration'

import { component } from '../components/component'
//import * as noble from 'noble'
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
const ambientThres = 5;
var serviceDataValid = false;

const serviceDataOffset = {
	temperature: { offset: 0, type: 'int16_t' },
	humidity: { offset: 2, type: 'uint8_t' },
	ambientLight: { offset: 3, type: 'uint16_t' },
	doorTimeStamp: { offset: 5, type: 'uint32_t' },
}

var serviceData = {
	temperature: 0,
	humidity: 0,
	ambientLight: 0,
	doorTimeStamp: 0,
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

export class workspace {
	private parent: dom;
	private workspaceContainer: dom;
	private statusbar: component;
	private activitybar: activitybar;
	private workbench: workbench;
	private workspaceSize: Dimension;
	private componentInfo: componentLayoutInfo;
	public diagnostics: diagnostics;
	public flash: flash;
	public configuration: configuration;

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
		domContentLoaded().then(() => {
			this.workspaceContainer = emptyDom().element('div', 'workspace');
			this.parent = quickDom(document.body);
			this.workspaceContainer.apendTo(this.parent);

			this.createElements();

			this.layout();
			this.registerListeners();
			
			this.configuration = new configuration(this.activitybar, this.workbench);
			this.flash = new flash(this.activitybar, this.workbench);
			this.diagnostics = new diagnostics(this.activitybar, this.workbench);


		})
	}
}

function configWorkbenchHandler(act: activity, context: workspace): void {

}

function upgradeWorkbenchHandler(act: activity, context: workspace): void {

}