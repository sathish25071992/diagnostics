import { loadstyle } from "../../../load";
import * as path from 'path';
import * as jlink from '../../../util/jlink';
// import * as event from 'events';
import * as Promise from 'bluebird';
import { workbenchAction, workbench } from '../workbench'
import { activity, activitybar } from '../../activitybar/activitybar'
import { statusInfo, registerStatusInfo } from '../../statusbar/statusbar'
import { messageHandle, writeMessage } from '../message'
import { config } from '../configuration/configuration'
import * as usbDetect from 'usb-detection';

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

// var refDevicetimeoutTimer: NodeJS.Timer;

// const refDevicetimeout = 5000;

const jlinkConnectionCheckPeriod = 10000;
var jlinkConnectionCheckPeriodTimer;

const refDeviceConnectionCheckPeriod = 20000;
var refDeviceConnectionCheckPeriodTimer;

const diagnosticsTimeout = 20000;
var diagnosticsTimeoutTimer;

const jlinkConnectionTimeout = 10000;
var jlinkConnectionTimeoutTimer;

const diagnosticsFrequency = 1000;
const serviceUUID = '6612';

const refDeviceTimeout = 10000;
var refDeviceTimeoutTimer;


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

var jlinkConnectionFlag = false;

var serviceData = {
    temperature: 0,
    humidity: 0,
    ambientLight: 0,
    doorTimeStamp: 0,
}

var diagnosticsTimer: NodeJS.Timer;
var diagnosticsMemLocation = "2000E3DB"; 						// May subject to change. create a config json file if possible
var sizeofDiagnosticsData = '40'; 								// May subject to change. create a config json file if possible

var _diagnosticsTrigger = false;

function diagnosticsTrigger(val?: boolean): boolean {

    if (typeof val !== 'undefined') {
        _diagnosticsTrigger = val;
    } else {
        return _diagnosticsTrigger;
    }

    var element = document.getElementsByClassName('start-diagnostics');
    var elementContainer = document.getElementsByClassName('diagnostics-action-container');

    console.log('diagnostics trigger flag is ', _diagnosticsTrigger);

    console.log(element.item(0));
    console.log(element);


    if ((element.length == 0) || (elementContainer.length == 0)) {
        console.error('diagnostics is not installed properly');
        return val;
    }

    if (_diagnosticsTrigger) {
        console.log('setting diagnostics trigger');

        quickDom(element.item(0)).removeClass('diagnostics-not-started');
        quickDom(element.item(0)).addClass('diagnostics-started');

        quickDom(element.item(0)).getHTMLElement().firstElementChild.innerHTML = 'Stop Diagnostics';
        quickDom(elementContainer.item(0)).removeClass('idle');
        quickDom(elementContainer.item(0)).addClass('progress');
    } else {
        quickDom(element.item(0)).removeClass('diagnostics-started');
        quickDom(element.item(0)).addClass('diagnostics-not-started');
        quickDom(element.item(0)).getHTMLElement().firstElementChild.innerHTML = 'Start Diagnostics'
        quickDom(elementContainer.item(0)).removeClass('progress');

    }

    console.log('diagnostics is triggered');
    return val;
}

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

function bluetoothStart() {
    const noble = require('noble');
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
        console.log('searching for the mac ID', config["Reference device Mac ID"]);
        if (typeof periperal.advertisement.localName == 'undefined') {
            return;
        }
        // else if ((periperal.advertisement.localName.indexOf('STT-') == 0) && (periperal.advertisement.serviceData[0].uuid == serviceUUID)) {
        else if (periperal.address !== config["Reference device Mac ID"]) {
            return;
        }
        console.log(periperal.address);

        if (typeof refDeviceConnectionCheckPeriodTimer !== 'undefined') {
            clearTimeout(refDeviceConnectionCheckPeriodTimer);
        }
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
        setbleStatusMsg('info', 'Reference device Connected');

        refDeviceConnectionCheckPeriodTimer = setTimeout(() => {
            serviceDataValid = false;
            setbleStatusMsg('error', 'Reference device Disconnected');
        }, refDeviceConnectionCheckPeriod);
    });
}

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

function checkJLink() {
    jlink.checkJLinkConnection().then(result => {
        console.log('JLink connection is present');
        jlinkConnectionFlag = true;
        setJLinkStatusMsg('info', 'Debugger is connected');
    }).catch((e) => {
        console.warn('jlink connection is not there');
        jlinkConnectionFlag = false;
        setJLinkStatusMsg('error', 'Debugger is not connected');
    })
}


export class diagnostics extends workbenchAction {
    public temperatureResult: diagnosticsResultContainer;
    public ambientLightResult: diagnosticsResultContainer;
    public _9axisResult: diagnosticsResultContainer;
    public humidityResult: diagnosticsResultContainer;

    diagnosticsActionElement: dom;
    startDiagnosticsContainer: dom;

    private action: workbenchAction;
    private activity: activity;
    private jlinkStatus: statusInfo;
    private bleStatus: statusInfo;


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

        this.startDiagnosticsContainer.addClass('diagnostics-not-started');
        emptyDom().element('a', '').apendTo(this.startDiagnosticsContainer);

        if (this.startDiagnosticsContainer.getHTMLElement().firstElementChild !== null) {
            this.startDiagnosticsContainer.getHTMLElement().firstElementChild.innerHTML = 'Start Diagnostics';
        }


        // this.diagnosticsTrigger = false;

        diagnosticsTrigger(false);

        this.startDiagnosticsContainer.on('click', (e: Event) => {

            console.log("Entered start diagnostics " + diagnosticsTrigger());
            diagnosticsTrigger(diagnosticsTrigger() ? false : true);
            if (diagnosticsTrigger()) {
                console.log('Starting the diagnostics');
                startDiagnostics().then((data) => {
                    console.log('diagnostics complete');
                    this.renderData(data);
                    diagnosticsTrigger(false);
                }).catch(e => {
                    diagnosticsTrigger(false);
                    console.error('diagnostics failed');
                    writeMessage('error', (<Error>e).message);
                });
            } else {
                stopDiagnostics();
                diagnosticsTrigger(false);
            }
        })

        // create a workbechAction
        this.action = workbench.addWorkbench(this);

        // Create a workbench action and append to action container


        // Create a activity
        this.activity = activitybar.addActivity('diagnostics', this.action, this, diagnosticsCb);

        this.temperatureResult = this.addDiagnosticsResult('Temperature sensor');
        this.ambientLightResult = this.addDiagnosticsResult('Ambient sensor')
        this._9axisResult = this.addDiagnosticsResult('9-axis sensor');
        this.humidityResult = this.addDiagnosticsResult('Humidity sensor');

        // add the status info in statusbar
        this.statusInfoLayout();

        setbleStatusMsg('error', 'Reference Device Disconnected');
        setJLinkStatusMsg('error', 'Debugger is not connected');
        checkJLink();
        jlinkConnectionCheckPeriodTimer = setInterval(checkJLink, jlinkConnectionCheckPeriod);

        bluetoothStart();
        // refDeviceConnectionCheckPeriodTimer = setInterval(checkrefDeviceConnection(), refDeviceConnectionCheckPeriod);

        // Check wether JLink is connected or not
        var usbDetect = require('usb-detection');

        usbDetect.on('add', checkJLink);

        usbDetect.on('remove', checkJLink);

    }

    statusInfoLayout() {
        var temp = registerStatusInfo('jlink');
        if (temp !== null) {
            this.jlinkStatus = temp;
        }
        temp = registerStatusInfo('ble');
        if (temp !== null) {
            this.bleStatus = temp;
        }

        var jlinkinfo = emptyDom().element('div', 'jlink-info-message');
        jlinkinfo.apendTo(this.jlinkStatus.element);

        jlinkinfo = emptyDom().element('div', 'jlink-info-status');
        jlinkinfo.apendTo(this.jlinkStatus.element);

        var bleinfo = emptyDom().element('div', 'ble-info-message');
        bleinfo.apendTo(this.bleStatus.element);

        bleinfo = emptyDom().element('div', 'ble-info-status');
        bleinfo.apendTo(this.bleStatus.element);


    }

    addDiagnosticsResult(diagnosticsname: string): diagnosticsResultContainer {
        var result = new diagnosticsResultContainer(this.diagnosticsActionElement, 'diagnostics-item');
        result.diagnosticsContent.diagnosticsname(diagnosticsname);
        result.diagnosticsContent.diagnosticsinfo('none');
        return result;
    }

    renderTemperature(result) {
        result.diagnosticsData.temperatureValue = result.diagnosticsData.temperatureValue / 10;

        var info = 'Temperaure value = ' + (result.diagnosticsData.temperatureValue) + '\r\n';

        info = info + 'reference device Temperaure value = ' + (serviceData.temperature) + '\r\n';

        this.temperatureResult.diagnosticsContent.content.contentContainer.removeClass('idle');
        this.temperatureResult.diagnosticsContent.diagnosticsinfo(info);

        if (((result.diagnosticsData.temperatureValue - config["Temperature tolerance"]) >= serviceData.temperature) ||
            ((result.diagnosticsData.temperatureValue + config["Temperature tolerance"]) <= serviceData.temperature)) {
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
    }

    renderHumidity(result) {

        var info = 'Humidity value value = ' + result.diagnosticsData.humidityValue + '\r\n';
        info = info + 'reference device Humidity value value = ' + serviceData.humidity;

        this.humidityResult.diagnosticsContent.content.contentContainer.removeClass('idle');
        this.humidityResult.diagnosticsContent.diagnosticsinfo(info);

        if (((result.diagnosticsData.humidityValue - config["Humidity tolerence"]) >= serviceData.humidity) ||
            ((result.diagnosticsData.humidityValue + config["Humidity tolerence"]) <= serviceData.humidity)) {
            this.humidityResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this.humidityResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this.humidityResult.diagnosticsContent.diagnosticsresult('Failed');
            this.humidityResult.diagnosticsContent.content.contentContainer.addClass('failed');
        } else {
            this.humidityResult.diagnosticsContent.content.contentContainer.removeClass('failed');
            this.humidityResult.diagnosticsContent.content.contentContainer.removeClass('success');
            this.humidityResult.diagnosticsContent.diagnosticsresult('Success');
            this.humidityResult.diagnosticsContent.content.contentContainer.addClass('success');
        }

    }

    renderAmbientLight(result) {

        var info = 'Ambient light value = ' + (result.diagnosticsData.AmbientlightValue) + '\r\n';
        info = info + 'reference device data = ' + serviceData.ambientLight;

        this.ambientLightResult.diagnosticsContent.content.contentContainer.removeClass('idle');
        this.ambientLightResult.diagnosticsContent.diagnosticsinfo(info);

        if (((result.diagnosticsData.AmbientlightValue - config["AmbientLignt tolerence"]) >= (serviceData.ambientLight)) ||
            ((result.diagnosticsData.AmbientlightValue + config["AmbientLignt tolerence"]) <= (serviceData.ambientLight))) {
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

    }

    render9Axis(result) {

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

    }

    renderData(result) {

        if (serviceDataValid == false) {
            writeMessage('error', 'Reference device is not present...')
            return;
        }
        console.log(result.diagnosticsData);
        // Check condition for THA verification

        this.renderTemperature(result);
        this.renderHumidity(result);
        this.renderAmbientLight(result);
        this.render9Axis(result);

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

// function checkjlinkConnection() {


// }

function parserDiagnosticsData(diagnosticsBuffer) {
    // Validate the argument ???

    for (var prop in diagnosticsOffset) {
        diagnosticsData[prop] = getTypedData(diagnosticsBuffer, diagnosticsOffset[prop].offset, diagnosticsOffset[prop].type);
    }

}

function setJLinkStatusMsg(sevearity: string, msg: string) {
    var jlinkInfo = document.querySelectorAll('div .jlink-info-message');
    var circle = document.querySelectorAll('.jlink-info-status');
    if (!jlinkInfo) {
        console.error('jlink info is not registered');
        return;
    }
    (<HTMLElement>jlinkInfo.item(0)).innerText = msg;

    if (sevearity == 'error') {
        (<HTMLElement>jlinkInfo.item(0)).style.color = 'yellow';
        if (circle) {
            (<HTMLElement>circle.item(0)).classList.remove('success');
            (<HTMLElement>circle.item(0)).classList.add('error');
            // (<HTMLElement>circle.item(0)).style.color = 'red';
        }
    } else if (sevearity == 'info') {
        (<HTMLElement>jlinkInfo.item(0)).style.color = '#FFFFFF';
        if (circle) {
            (<HTMLElement>circle.item(0)).classList.remove('error');
            // (<HTMLElement>circle.item(0)).style.color = 'green';
            (<HTMLElement>circle.item(0)).classList.add('success');
        }
    }
}

function setbleStatusMsg(sevearity: string, msg: string) {
    var bleInfo = document.querySelectorAll('div .ble-info-message');
    var circle = document.querySelectorAll('.ble-info-status');
    if (!bleInfo) {
        console.error('ble info is not registered');
        return;
    }
    (<HTMLElement>bleInfo.item(0)).innerText = msg;

    if (sevearity == 'error') {
        (<HTMLElement>bleInfo.item(0)).style.color = 'yellow';
        if (circle) {
            // (<HTMLElement>circle.item(0)).style.color = 'red';
            (<HTMLElement>circle.item(0)).classList.add('error');
            (<HTMLElement>circle.item(0)).classList.remove('success');
        }
    } else if (sevearity == 'info') {
        (<HTMLElement>bleInfo.item(0)).style.color = '#FFFFFF';
        if (circle) {
            // (<HTMLElement>circle.item(0)).style.color = 'green';
            (<HTMLElement>circle.item(0)).classList.remove('error');
            (<HTMLElement>circle.item(0)).classList.add('success');
        }
    }
}

function setJLinkStatus(status: string) {
    var jlinkInfo = document.querySelectorAll('div .jlink-info-status');
    if (!jlinkInfo) {
        console.error('jlink info is not registered');
        return;
    }

}

export function startDiagnostics(userData?: any): Promise {

    // Check weather Reference device is present

    clearInterval(jlinkConnectionCheckPeriodTimer);

    if (jlinkConnectionFlag == false) {
        writeMessage('error', 'JLink debugger is not connected...');
        jlinkConnectionCheckPeriodTimer = setInterval(checkJLink, jlinkConnectionCheckPeriod);
        return new Promise((r, e) => {
            e(new Error('JLink debugger is not connected...'));
        })
    }

    if (serviceDataValid == false) {
        writeMessage('error', 'Reference device is not present...');
        jlinkConnectionCheckPeriodTimer = setInterval(checkJLink, jlinkConnectionCheckPeriod);

        return new Promise((r, e) => {
            e(new Error('Reference device is not present...'));
        })
    }

    // Establish JLink connection
    // jlink.configureJlink("/opt/SEGGER/JLink/JLinkExe", "-device NRF52 -if SWD -speed 4000");
    var context = userData;

    return new Promise((r, e) => {

        jlinkConnectionTimeoutTimer = setTimeout(() => {
            e(new Error('JLink debugger connection timeout occured'));
        }, jlinkConnectionTimeout);

        jlink.startJLinkServer().then(result => {
            clearTimeout(jlinkConnectionTimeoutTimer);
            process.stdout.write("Waiting for diagnostics to complete");

            diagnosticsTimeoutTimer = setTimeout(() => {
                // stopDiagnostics();
                // diagnosticsTrigger(false);
                clearInterval(diagnosticsTimer);
                e('Diagnostics completion timeout occured');
                // writeMessage('error', 'Diagnostics completion timeout occured');
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
                }).catch((err) => {
                    // writeMessage('error', message);
                    clearInterval(diagnosticsTimer);
                    clearInterval(diagnosticsTimeoutTimer);
                    e(err);
                });
            }, 1000);
        });
    });
}

function stopDiagnostics() {
    clearTimeout(diagnosticsTimeoutTimer);
    clearTimeout(jlinkConnectionTimeoutTimer);
    clearInterval(diagnosticsTimer);
    jlinkConnectionCheckPeriodTimer = setInterval(checkJLink, jlinkConnectionCheckPeriod);
}
