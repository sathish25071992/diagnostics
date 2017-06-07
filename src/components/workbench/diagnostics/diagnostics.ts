import { loadstyle } from "../../../load";
import * as path from 'path';
import * as jlink from '../../../util/jlink';
// import * as event from 'events';
import * as Promise from 'bluebird';
import { workbenchAction, workbench } from '../workbench'
import { activity, activitybar } from '../../activitybar/activitybar'
import * as noble from 'noble'
import { messageHandle, writeMessage } from '../message'


loadstyle(path.join(__dirname, './media/diagnostics.css'));

import { dom, emptyDom, quickDom } from '../../../dom/dom'

const MIN_WORKBENCH_HEIGHT = 70;
const MIN_WORKBENCH_WIDTH = 220;
const STATUS_BAR_HEIGHT = 22;
const ACTIVITY_BAR_WIDTH = 50;

interface componentLayoutInfo {
    activitybar: { width: number; };
    workbench: { minWidth: number; minHeight: number; };
    statusbar: { height: number; };
}

const diagnosticsTimeout = 20000;
var diagnosticsTimeoutTimer;

const jlinkConnectionTimeout = 10000;
var jlinkConnectionTimeoutTimer;

const diagnosticsFrequency = 1000;
const serviceUUID = '6612';

const refDeviceTimeout = 10000;

var refDeviceTimeoutTimer;

const refDeviceMacID = 'ec:ef:14:ea:9a:13';

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

const humidityThres = 5;
const temperatureThres = 2;
const ambientThres = 10;
var serviceDataValid = false;

var serviceData = {
    temperature: 0,
    humidity: 0,
    ambientLight: 0,
    doorTimeStamp: 0,
}

var diagnosticsTimer: NodeJS.Timer;
var diagnosticsMemLocation = "2000E3DB"; 						// May subject to change. create a config json file if possible
var sizeofDiagnosticsData = '40'; 								// May subject to change. create a config json file if possible

var Enum = {													// May subject to change. create a config json file if possible
    AmbientlightValue: 39,
    ramDiagnosticTest: 41,
    spiFlashDiagnosticTest: 42,
    diagnosticsCompleteFlag: 43,
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
    AccXData: { offset: 0, type: 'float' },
    AccYData: { offset: 4, type: 'float' },
    AccZData: { offset: 8, type: 'float' },
    GyroXData: { offset: 12, type: 'float' },
    GyroYData: { offset: 16, type: 'float' },
    GyroZData: { offset: 20, type: 'float' },
    MagXData: { offset: 24, type: 'float' },
    MagYData: { offset: 28, type: 'float' },
    MagZData: { offset: 32, type: 'float' },
    temperatureValue: { offset: 36, type: 'uint16_t' },
    humidityValue: { offset: 38, type: 'uint8_t' },
    AmbientlightValue: { offset: 39, type: 'uint16_t' },
    ramDiagnosticTest: { offset: 41, type: 'bool' },
    spiFlashDiagnosticTest: { offset: 42, type: 'bool' },
    diagnosticsCompleteFlag: { offset: 43, type: 'bool' },
};

var diagnosticsData = {
    AccXData: 0,
    AccYData: 0,
    AccZData: 0,
    GyroXData: 0,
    GyroYData: 0,
    GyroZData: 0,
    MagXData: 0,
    MagYData: 0,
    MagZData: 0,
    temperatureValue: 0,
    humidityValue: 0,
    AmbientlightValue: 0,
    ramDiagnosticTest: 0,
    spiFlashDiagnosticTest: 0,
    diagnosticsCompleteFlag: 0,
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
            // console.log('discovered ' + periperal.address);
            if (typeof periperal.advertisement.localName == 'undefined') {
                return;
            }
            // else if ((periperal.advertisement.localName.indexOf('STT-') == 0) && (periperal.advertisement.serviceData[0].uuid == serviceUUID)) {
            else if (periperal.address !== refDeviceMacID) {
                return;
            }
            console.log(periperal.address);
            // console.log('device name is ' + periperal.advertisement.localName);
            // console.log(periperal.advertisement.serviceData[0].data);
            for (var prop in serviceDataOffset) {
                serviceData[prop] = getTypedData(periperal.advertisement.serviceData[0].data, serviceDataOffset[prop].offset, serviceDataOffset[prop].type);
                if (prop === 'temperature') {
                    serviceData[prop] = serviceData[prop] / 10;
                    // console.log('temperature value = ' + serviceData[prop]);
                }
            }
            serviceDataValid = true;
        });
}
diagnosticsname(name: string) {
    this.content.testName = name;
    if (!this.content.nameContainer.getHTMLElement().hasChildNodes()) {
        console.log('creating child');
        var a = emptyDom().element('a', '');
    } else {
        var a = quickDom(this.content.nameContainer.getHTMLElement().firstElementChild);
    }
    a.apendTo(this.content.nameContainer);
    a.getHTMLElement().innerHTML = this.content.testName;
}

diagnosticsinfo(info: string) {
    this.content.info = info;
    if (!this.content.infoContainer.getHTMLElement().hasChildNodes()) {
        console.log('creating child');
        var a = emptyDom().element('a', '');
    } else {
        var a = quickDom(this.content.infoContainer.getHTMLElement().firstElementChild);
    }
    a.apendTo(this.content.infoContainer);
    a.getHTMLElement().innerHTML = this.content.info;
}
diagnosticsresult(result: string) {
    this.content.Result = result;
    if (!this.content.resultContainer.getHTMLElement().hasChildNodes()) {
        console.log('creating child');
        var a = emptyDom().element('a', '');
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

function diagnosticsCb() {
    console.log('working properly');

}

export class diagnostics extends workbenchAction {
    public temperatureResult: diagnosticsResultContainer;
    public ambientLightResult: diagnosticsResultContainer;
    public _9axisResult: diagnosticsResultContainer;

    diagnosticsActionElement: dom;
    startDiagnosticsContainer: dom;

    private action: workbenchAction;
    private activity: activity;
    private jlinkStatus: dom;
    private bleStatus: dom;

    private _diagnosticsTrigger: boolean;

    set diagnosticsTrigger(val: boolean) {
        this._diagnosticsTrigger = val;

        console.log('setting diagnostics trigger');

        if (this._diagnosticsTrigger) {
            this.startDiagnosticsContainer.removeClass('diagnostics-not-started');
            this.startDiagnosticsContainer.addClass('diagnostics-started');

            this.startDiagnosticsContainer.getHTMLElement().firstElementChild.innerHTML = 'Stop Diagnostics';
            this.diagnosticsActionElement.removeClass('idle');
            this.diagnosticsActionElement.addClass('progress');
        } else {
            this.startDiagnosticsContainer.removeClass('diagnostics-started');
            this.startDiagnosticsContainer.addClass('diagnostics-not-started');
            this.startDiagnosticsContainer.getHTMLElement().firstElementChild.innerHTML = 'Start Diagnostics'
            this.diagnosticsActionElement.removeClass('progress');

        }
    }

    get diagnosticsTrigger() {
        return this._diagnosticsTrigger;
    }

    constructor(activitybar: activitybar, workbench: workbench) {
        super('Diagnostics', emptyDom().element('div', 'diagnostics-action'));
        console.log('Contructing flash UI');
        console.log(this.actionElement);

        this.diagnosticsActionElement = emptyDom().element('div', 'diagnostics-action-container');
        this.diagnosticsActionElement.apendTo(this.actionElement);
        console.log('adding class');
        this.diagnosticsActionElement.addClass('idle');

        this.startDiagnosticsContainer = emptyDom().element('div', 'start-diagnostics');
        this.startDiagnosticsContainer.apendTo(this.actionElement);


        emptyDom().element('a', '').apendTo(this.startDiagnosticsContainer);

        this.diagnosticsTrigger = false;

        this.startDiagnosticsContainer.on('click', (e: Event) => {

            console.log("Entered start diagnostics" + this.diagnosticsTrigger);
            this.diagnosticsTrigger = this.diagnosticsTrigger ? false : true;
            if (this.diagnosticsTrigger) {
                startDiagnostics().then((data) => {
                    this.renderData(data);
                    this.diagnosticsTrigger = false;
                })
            } else {
                stopDiagnostics();
            }
        })

        // create a workbechAction
        this.action = workbench.addWorkbench(this);

        // Create a workbench action and append to action container


        // Create a activity
        this.activity = activitybar.addActivity('diagnostics', this.action, this, diagnosticsCb);

        this.temperatureResult = this.addDiagnosticsResult('TH sensor');
        this.ambientLightResult = this.addDiagnosticsResult('Ambient sensor')
        this._9axisResult = this.addDiagnosticsResult('9-axis sensor');
 
        // add the status info in statusbar
        this.statusInfoLayout();
    }

    statusInfoLayout() {
        this.jlinkStatus = registerStatusInfo('jlink');
        this.bleStatus = registerStatusInfo('ble');

        var jlinkinfo = emptyDom().element('div', 'jlink-info');
        jlinkinfo.apendTo(this.jlinkStatus);

        setJLinkStatus(status: string);

    }

    addDiagnosticsResult(diagnosticsname: string): diagnosticsResultContainer {
        var result = new diagnosticsResultContainer(this.diagnosticsActionElement, 'diagnostics-item');
        result.diagnosticsContent.diagnosticsname(diagnosticsname);
        result.diagnosticsContent.diagnosticsinfo('none');
        return result;
    }

    renderData(result) {

        if (serviceDataValid == false) {
            // setTimeout(() => startDiagnostics(result.context).then(handleDiagnostics), diagnosticsFrequency);
            writeMessage('error', 'Reference device is not present...')
            return;
        }
        console.log(result.diagnosticsData);
        // Check condition for THA verification
        result.diagnosticsData.temperatureValue = result.diagnosticsData.temperatureValue / 10;

        var info = 'Temperaure value = ' + (result.diagnosticsData.temperatureValue) + '\r\n';
        info = info + 'Humidity value value = ' + result.diagnosticsData.humidityValue + '\r\n';

        info = info + 'reference device Temperaure value = ' + (serviceData.temperature) + '\r\n';
        info = info + 'reference device Humidity value value = ' + serviceData.humidity;

        this.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('idle');
        this.temperatureResult.diagnosticsContent.diagnosticsinfo(info);

        if (((result.diagnosticsData.temperatureValue - temperatureThres) >= serviceData.temperature) ||
            ((result.diagnosticsData.temperatureValue + temperatureThres) <= serviceData.temperature)) {
            this.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this.temperatureResult.diagnosticsContent.diagnosticsresult('Failed');
            this.temperatureResult.diagnosticsContent.content.contentContainer.addClass('failed');
        } else {
            this.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this.temperatureResult.diagnosticsContent.diagnosticsresult('Success');
            this.temperatureResult.diagnosticsContent.content.contentContainer.addClass('success');
        }

        var info = 'Ambient light value = ' + (result.diagnosticsData.AmbientlightValue) + '\r\n';
        info = info + 'reference device data = ' + serviceData.ambientLight;

        this.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('idle');
        this.ambientLightResult.diagnosticsContent.diagnosticsinfo(info);

        if (((result.diagnosticsData.AmbientlightValue - ambientThres) >= (serviceData.ambientLight)) ||
            ((result.diagnosticsData.AmbientlightValue + ambientThres) <= (serviceData.ambientLight))) {
            this.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this.ambientLightResult.diagnosticsContent.diagnosticsresult('Failed');
            this.ambientLightResult.diagnosticsContent.content.contentContainer.addClass('failed');
        } else {
            this.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this.ambientLightResult.diagnosticsContent.diagnosticsresult('Success');
            this.ambientLightResult.diagnosticsContent.content.contentContainer.addClass('success');

        }

        var info = '9-axis value = ' + (result.diagnosticsData.AccXData.toFixed(3));

        this._9axisResult.diagnosticsContent.content.contentContainer.removeClass('idle');
        this._9axisResult.diagnosticsContent.diagnosticsinfo(info);

        if (((result.diagnosticsData.AmbientlightValue - ambientThres) > (serviceData.ambientLight)) ||
            ((result.diagnosticsData.AmbientlightValue + ambientThres) < (serviceData.ambientLight))) {

            this._9axisResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this._9axisResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this._9axisResult.diagnosticsContent.diagnosticsresult('Failed');
            this._9axisResult.diagnosticsContent.content.contentContainer.addClass('failed');
        } else {
            this._9axisResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this._9axisResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this._9axisResult.diagnosticsContent.diagnosticsresult('Success');
            this._9axisResult.diagnosticsContent.content.contentContainer.addClass('success');
        }

        console.log("Diagnostics is complete!!!");
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

function parserDiagnosticsData(diagnosticsBuffer) {
    // Validate the argument ???

    for (var prop in diagnosticsOffset) {
        diagnosticsData[prop] = getTypedData(diagnosticsBuffer, diagnosticsOffset[prop].offset, diagnosticsOffset[prop].type);
    }

}

export function startDiagnostics(userData?: any) {

    // Check weather Reference device is present

    // Establish JLink connection
    jlink.configureJlink("/opt/SEGGER/JLink/JLinkExe", "-device NRF52 -if SWD -speed 4000");
    var context = userData;
    jlinkConnectionTimeoutTimer = setTimeout(() => {
        stopDiagnostics();
        writeMessage('error', 'JLink debugger connection timeout occured');
    }, jlinkConnectionTimeout);
    return new Promise((r, e) => {
        jlink.startJLinkServer().then(result => {
            clearTimeout(jlinkConnectionTimeoutTimer);
            process.stdout.write("Waiting for diagnostics to complete");

            diagnosticsTimeoutTimer = setTimeout(() => {
                stopDiagnostics();
                writeMessage('error', 'Diagnostics completion timeout occured');
            }, diagnosticsTimeout);

            diagnosticsTimer = setInterval(() => {
                jlink.jlinkMemRead(diagnosticsMemLocation, sizeofDiagnosticsData).then(result => {
                    console.log(result);
                    if (result[diagnosticsOffset.diagnosticsCompleteFlag.offset] == 1) {
                        process.stdout.write('\n');
                        clearInterval(diagnosticsTimer);
                        clearTimeout(diagnosticsTimeoutTimer);
                        var buf = Buffer.from(result);
                        // diagnosticsData.AmbientlightValue = buf.readUInt16BE(diagnosticsData._AmbientlightValue.offset);
                        console.log(diagnosticsData.AmbientlightValue);
                        parserDiagnosticsData(buf);

                        r({ diagnosticsData, context });
                    }
                    else {
                        process.stdout.write('.');
                    }
                });
            }, 1000);
        });
    });
}

function stopDiagnostics() {
    clearTimeout(diagnosticsTimeoutTimer);
    clearTimeout(jlinkConnectionTimeoutTimer);
    clearInterval(diagnosticsTimer);
}
