import { loadstyle } from "../../../load";
import * as path from 'path';
import * as jlink from './jlink';
import * as EventEmitter from 'events';
import * as Promise from 'bluebird'


loadstyle(path.join(__dirname, './media/diagnostics.css'));

import { dom, emptyDom, quickDom } from '../../../dom/dom'

export interface content {
    testName: string;
    info: string;
    Result: string;
    status: string;
    contentContainer: dom;
    nameContainer: dom;
    infoContainer: dom;
    resultContainer: dom;

}


var diagnosticsMemLocation = "2000E3DB"; 						// May subject to change. create a config json file if possible
var sizeofDiagnosticsData = '40'; 								// May subject to change. create a config json file if possible

var Enum = {													// May subject to change. create a config json file if possible
	AmbientlightValue		: 39,
	ramDiagnosticTest		: 41,
	spiFlashDiagnosticTest	: 42,
	diagnosticsCompleteFlag	: 43,
}

// var diagnosticsData = {
// 	_AccXaxisSelftest 			: {offset: 0, value: 0},
// 	_AmbientlightValue			: {offset: 39,value: 0}, set AmbientlightValue(v) {this._AmbientlightValue.value = v},  get AmbientlightValue() {return this._AmbientlightValue.value},
// 	_ramDiagnosticTest			: {offset: 41,value: 0},
// 	_spiFlashDiagnosticTest		: {offset: 42,value: 0},
// 	_diagnosticsCompleteFlag	: {offset: 43,value: 0},
// }


// create a var generator logic to generate this (through json) if possible ???
 const diagnosticsOffset = {
	AccXData			 	: {offset: 0,  type: 'float'},
	AccYData				: {offset: 4,  type: 'float'},
	AccZData				: {offset: 8,  type: 'float'},
	GyroXData				: {offset: 12, type: 'float'},
	GyroYData				: {offset: 16, type: 'float'},
	GyroZData				: {offset: 20, type: 'float'},
	MagXData				: {offset: 24, type: 'float'},
	MagYData				: {offset: 28, type: 'float'},
	MagZData				: {offset: 32, type: 'float'},
	temperatureValue		: {offset: 36, type: 'uint16_t'},
	humidityValue			: {offset: 38, type: 'uint8_t'},
	AmbientlightValue		: {offset: 39, type: 'uint16_t'},
	ramDiagnosticTest		: {offset: 41, type: 'bool'},
	spiFlashDiagnosticTest	: {offset: 42, type: 'bool'},
	diagnosticsCompleteFlag	: {offset: 43, type: 'bool'},
};

 var diagnosticsData = {
	AccXData				: 0,
	AccYData				: 0,
	AccZData				: 0,
	GyroXData				: 0,
	GyroYData				: 0,
	GyroZData				: 0,
	MagXData				: 0,
	MagYData				: 0,
	MagZData				: 0,
	temperatureValue		: 0,
	humidityValue			: 0,
	AmbientlightValue		: 0,
	ramDiagnosticTest		: 0,
	spiFlashDiagnosticTest	: 0,
	diagnosticsCompleteFlag	: 0,
};


export class diagnosticsContent {
    content: content;
    parent: dom;
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
        this.parent = parent;
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
    diagnosticsresult(result:string) {
        this.content.Result = result;
        if(!this.content.resultContainer.getHTMLElement().hasChildNodes()) {
            console.log('creating child');
        var a = emptyDom().element('a', 'diagnostics-result');
        } else {
            var a = quickDom(this.content.resultContainer.getHTMLElement().firstElementChild);
        }
        a.apendTo(this.content.resultContainer);
        a.getHTMLElement().innerHTML = this.content.Result;
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

export class diagnosticsResultContainer {
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

    public temperatureResult: diagnosticsResultContainer;
    public ambientLightResult: diagnosticsResultContainer;
    public _9axisResult: diagnosticsResultContainer;

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

        this.temperatureResult.diagnosticsContent.diagnosticsinfo('TH sensor result:' +' 24.5')
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

function getTypedData(buf, offset, type) {
	var value;
	switch (type) {
		case 'uint16_t':
			value = buf.readUInt16LE(offset);
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

function parserDiagnosticsData(diagnosticsBuffer) {
	// Validate the argument

	for(var prop in diagnosticsOffset) {
		diagnosticsData[prop] = getTypedData(diagnosticsBuffer, diagnosticsOffset[prop].offset, diagnosticsOffset[prop].type);
	}

}

export function startDiagnostics(userData: any) {
	//establish JLink connection
	jlink.configureJlink("/opt/SEGGER/JLink/JLinkExe", "-device NRF52 -if SWD -speed 4000");
    var context = userData;
	return new Promise((r, e) => {
		jlink.startJLinkServer().then(result => {
			// process.stdout.write("Waiting for diagnostics to complete");
			var diagnosticsTimer = setInterval(() => {
				jlink.jlinkMemRead(diagnosticsMemLocation, sizeofDiagnosticsData).then(result => {
					console.log(result);
					if(result[diagnosticsOffset.diagnosticsCompleteFlag.offset] == 1) {
						// process.stdout.write('\n');
						clearInterval(diagnosticsTimer);
						var buf = Buffer.from(result);
						// diagnosticsData.AmbientlightValue = buf.readUInt16BE(diagnosticsData._AmbientlightValue.offset);
						console.log(diagnosticsData.AmbientlightValue);
						parserDiagnosticsData(buf);
                        console.log(context);
						r({diagnosticsData, context});
					}
					else {
						// process.stdout.write('.');
					}
				});
			}, 1000);
		});
	});
}
