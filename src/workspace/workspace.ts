import { dom, emptyDom, quickDom } from '../dom/dom'
import { statusbar } from '../components/statusbar/statusbar'
import { activitybar, activity } from '../components/activitybar/activitybar'
import { workbench } from '../components/workbench/workbench'
import { Dimension } from './util'
import { diagnostics } from '../components/workbench/diagnostics/diagnostics'

import { component } from '../components/component'

const MIN_WORKBENCH_HEIGHT = 70;
const MIN_WORKBENCH_WIDTH = 220;
const STATUS_BAR_HEIGHT = 22;
const ACTIVITY_BAR_WIDTH = 50;

interface componentLayoutInfo {
	activitybar: { width: number; };
	workbench: { minWidth: number; minHeight: number; };
	statusbar: { height: number; };
}

export class workspace {
	private parent: dom;
	private workspaceContainer: dom;
	private statusbar: component;
	private activitybar: activitybar;
	private workbench: workbench;
	private workspaceSize: Dimension;
	private componentInfo: componentLayoutInfo;
	private diagnostics: diagnostics;

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

		this.activitybar.addActivity('configuration', undefined, configWorkbenchHandler);
		this.activitybar.addActivity('upgrade', undefined, upgradeWorkbenchHandler);
		this.activitybar.addActivity('diagnostics', this.diagnostics.container, diagnosticsWorkbenchHandler);
	}
}

function diagnosticsWorkbenchHandler(act: activity): void {
	console.log('diagnostics workbench activated');
	console.log(act);
}

function configWorkbenchHandler(act: activity): void {

}

function upgradeWorkbenchHandler(act: activity): void {

}