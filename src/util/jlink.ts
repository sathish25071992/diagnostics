import * as jlink from '@connectedyard/node-jlink'
import * as path from 'path'
import * as Promise from 'bluebird'
import * as fs from 'fs'

import * as events from 'events'

var spawn = require('child_process').spawn;

var event;
var percentage: string;

var JLinkConnectionTimer;
var firmware = ["h", "f"];
var regex = new RegExp("(\\s\\S{8} = )(.*)", "g");

export function configureJlink(jlinkLocation, options) {
	// Validate the path
	var Promise;
	if (fs.existsSync(jlinkLocation)) {
		// console.log("Given path is present");
		jlink.setJlinkEXECommand(jlinkLocation);

		Promise = jlink.isJLinkEXEInstalled();
	}
	else {
		// Promise = Promise.reject(new Error("Given path is not present"));
	}
	// console.log("JLink configuration complete");
	jlink.setJLinkEXEOptions(options.split(" "));
	return Promise;
}


export function jlinkMemRead(memory, size) {
	var readMyMemCommands = ["h", "mem8 " + memory + ", " + size];
	var promise = new Promise((r, e) => {
		console.log('reading memory');
		jlink.executeCommands(readMyMemCommands).then(results => {
			var memArr = results.stdout.match(regex);
			memArr = memArr.join('').replace(/\S{8} = |\r\n|\r|\n/g, '').trim().split(' ');
			memArr.forEach(function (element, index) {
				memArr[index] = parseInt(element, 16);
			});
			console.log('reading memory complete');
			r(memArr);
		}).catch((err) => e(new Error('JLink debugger failed. Check your debugger connection')));
	});
	return promise;
}

export function startJLinkServer() {
	console.log("JLink server is running");
	process.stdout.write("Wating for connection");

	return new Promise((r, e) => {
			jlink.executeCommands(firmware).then(result => {
				process.stdout.write("\n");
				console.log("JLink is available");
				clearInterval(JLinkConnectionTimer);
				r(result);
			}).catch(err => {
				process.stdout.write(".");
				console.log(err);
				e(new Error('JLink command failed. Check your debugger connection'));
			})
	});
}

export function checkJLinkConnection() {
	console.log("JLink server is running");
	process.stdout.write("Wating for connection");

	return new Promise((r, e) => {
		jlink.executeCommands(firmware).then(result => {
			process.stdout.write("\n");
			console.log("JLink is available");
			clearInterval(JLinkConnectionTimer);
			r(result);
		}).catch(err => {
			process.stdout.write(".");
			console.log(err);
			e(err);
		})
	});
}

export function flashProgram(path: string, percentageListner: (percentage: number) => void) {
	var flashCommand = ["r", "h", "erase", "loadfile " + path, "r", "g"];

	if (typeof path === 'undefined') {
		return;
	}

	event = new events();
	event.on('percentage', percentageListner);
	console.log(path);
	console.log(flashCommand);
	var promise = new Promise((r, e) => {
		console.log('Flashing the binary');
		executeCommands(flashCommand).then(results => {
			console.log(results);
		});

	});
	return promise;
}

export function executeCommands(commandArray) {
	if (commandArray === void 0) commandArray = [];

	var timeoutSeconds = 20;

	if (commandArray.indexOf('exitonerror') === -1) {
		commandArray.splice(0, 1, 'exitonerror');
	}

	if (commandArray.indexOf('exit') === -1) {
		commandArray.push('exit');
	}

	var commandString = commandArray.join("\n");

	return new Promise(function (resolve, reject) {
		var terminal = spawn("/opt/SEGGER/JLink/JLinkExe", "-device NRF52 -if SWD -speed 4000".split(' '));

		var result = {
			stdout: "",
			stderr: "",
			code: 0,
			error: new Error()
		};

		var percentageFlag = false;

		terminal.stdout.on('data', function (data) {
			var output = data.toString('utf8');
			result.stdout += output;
			if (output.trim().match(/Programming flash/g) !== null) {
				percentageFlag = true;
			}
			if (percentageFlag == true) {
				if ((percentage = output.trim().match(/(\d\d\d)%/g)) !== null) {
					percentage = percentage[0].replace('%', '');
					event.emit('percentage', parseInt(percentage));
				}
			}

			if (output.indexOf("FAILED") !== -1) {
				clearTimeout(timeout);
				reject(new Error("executeJlinkCommands: command failed: " + output.trim()));
			}

		});

		terminal.stderr.on('data', function (data) {
			var output = data.toString('utf8').trim();
			result.stderr += output;
			console.error('executeJlinkCommands: ' + output.trim());
		});

		terminal.on('exit', function (code) {
			result.code = code;
			//console.log('child process exited with code ' + code);
			clearTimeout(timeout);
			if (code === 0) resolve(result);
			else reject(result);
		});

		terminal.stdin.write(commandString);
		terminal.stdin.end();

		var timeout = setTimeout(function () {
			result.error = new Error("executeJlinkCommands: timeout");
			reject(result);
		}, timeoutSeconds * 1000);
	});
};