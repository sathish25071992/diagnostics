import * as jlink from '@connectedyard/node-jlink'
import * as path from 'path'
import * as Promise from 'bluebird'
import * as fs from 'fs'

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
		})
	});
	return promise;
}

export function startJLinkServer(): Promise {
	console.log("JLink server is running");
	process.stdout.write("Wating for connection");

	return new Promise((r, e) => {
		JLinkConnectionTimer = setInterval(() => {
			jlink.executeCommands(firmware).then(result => {
				process.stdout.write("\n");
				console.log("JLink is available");
				clearInterval(JLinkConnectionTimer);
				r(result);
			})
			.catch(e => {
				process.stdout.write(".");
			})
		}, 1000);
	});
}