import { loadstyle } from "../../../load";
import * as path from 'path';
loadstyle(path.join(__dirname, './media/diagnostics.css'));

import { dom, emptyDom, quickDom } from '../../../dom/dom'

interface content {
    testName: string;
    info: string;
    Result: string;
    status: string;
    contentContainer: dom;
    nameContainer: dom;
    infoContainer: dom;
    resultContainer: dom;

}

class diagnosticsContent {
    content: content;
    constructor(parent: dom, contentName: string) {
        this.content = {
            status: 'idle',
            info: '',
            testName: contentName,
            Result: 'idle',
            contentContainer: emptyDom().element('div', 'diagnostics-content'),
            nameContainer: emptyDom().element('div', 'diagnostics-name'),
            infoContainer: emptyDom().element('div', 'diagnostics-info'),
            resultContainer: emptyDom().element('div', 'diagnostics-result')
        };
        this.content.contentContainer.apendTo(parent);
        this.content.nameContainer.apendTo(this.content.contentContainer);
        this.content.infoContainer.apendTo(this.content.contentContainer);
        this.content.resultContainer.apendTo(this.content.contentContainer);

        // create 3 div for name, info, status

        this.content.contentContainer.addClass('idle');
        // this.content.contentContainer.getHTMLElement().innerHTML = contentName;
    }
    diagnosticsname(name:string) {
        this.content.testName = name;
        if(!this.content.nameContainer.getHTMLElement().hasChildNodes()) {
            console.log('creating child');
        var a = emptyDom().element('a', 'diagnostics-name');
        } else {
            var a = quickDom(this.content.nameContainer.getHTMLElement().firstElementChild);
        }
        a.apendTo(this.content.nameContainer);
        a.getHTMLElement().innerHTML = this.content.testName;
    }

    diagnosticsinfo(info:string) {
        this.content.info = info;
        if(!this.content.infoContainer.getHTMLElement().hasChildNodes()) {
            console.log('creating child');
        var a = emptyDom().element('a', 'diagnostics-info');
        } else {
            var a = quickDom(this.content.infoContainer.getHTMLElement().firstElementChild);
        }
        a.apendTo(this.content.infoContainer);
        a.getHTMLElement().innerHTML = this.content.info;
    }    
}

// interface temperatureSensorResult {

// }

// interface ambientLightSensor {

// }

// var diagnosticsResult = {
//     temperatureSensor: {container:undefined, status, result: undefined},
//     ambientLightSensor: {container:undefined, status, result}
// }

// interface table {
//     [index: string]: string;
//     [index: string]: string;
// }

class diagnosticsResultContainer {
    numberOfResult: number = 0;
    private parent: dom;
    private container: dom;
    public diagnosticsContent: diagnosticsContent;

    constructor(parent: dom, name: string) {
        console.log(parent);
        this.parent = parent;
        this.container = emptyDom().element('div', name);
        this.container.apendTo(this.parent);
        this.diagnosticsContent = new diagnosticsContent(this.container, name);
    }
}

export class diagnostics {
    public container: dom;
    private table: dom;

    private temperatureResult: diagnosticsResultContainer;
    private ambientLightResult: diagnosticsResultContainer;
    private _9axisResult: diagnosticsResultContainer;

    constructor() {
        this.container = emptyDom().element('div', 'workbench-diagnostics');

        // var [columns, rows] = this.createTableElements(2, 3, this.table);
        // console.log(columns);

        // remove name from this constructor since diagnosticsResultContainer is deticated to generate this. so internally
        // he can add this name.???
        this.temperatureResult = new diagnosticsResultContainer(this.container, 'diagnostics-item');
        this.ambientLightResult = new diagnosticsResultContainer(this.container, 'diagnostics-item');
        this._9axisResult = new diagnosticsResultContainer(this.container, 'diagnostics-item');

        this.temperatureResult.diagnosticsContent.diagnosticsname('TH sensor')
        this.ambientLightResult.diagnosticsContent.diagnosticsname('Ambient sensor')
        this._9axisResult.diagnosticsContent.diagnosticsname('9-axis sensor')

        this.temperatureResult.diagnosticsContent.diagnosticsinfo('TH sensor result:' +'24.5')
        this.ambientLightResult.diagnosticsContent.diagnosticsinfo('Ambient sensor')
        this._9axisResult.diagnosticsContent.diagnosticsinfo('9-axis sensor')

    }

    public start() {
        // check for jlink and ble connectivity and proceed to diagnostics


    }

    diagnosticsComplete() {

    }

    private createTableElements(numberofRows: number, numberofColumn: number, parent: dom): [dom[][], dom[]] {
        var columns: dom[][] = new Array();
        var rows: dom[] = new Array();

        for (let i = 0; i < numberofRows; i++) {
            var row = emptyDom().element('tr', 'workbench-row');
            row.apendTo(parent);
            rows[i] = row;
            columns[i] = new Array();

            for (let j = 0; j < numberofColumn; j++) {
                var column = emptyDom().element('td', 'workbench-column');
                column.apendTo(row);
                columns[i][j] = column;
            }
        }
        console.log(columns);
        return [columns, rows];
    }
}