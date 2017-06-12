let workspace = require('../workspace/workspace');
let jlink = require('../util/jlink');
let loader = require('../util/loader')

function load() {
	// Initialize the workspace
	let Workspace = new workspace.workspace();
	loader.loaderInitialize();
	loader.startLoader();
	loader.stopLoader();
	jlink.configureJlink("/opt/SEGGER/JLink/JLinkExe", "-device NRF52 -if SWD -speed 4000");
	Workspace.open();
}

load();