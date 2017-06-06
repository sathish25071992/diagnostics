let workspace = require('../workspace/workspace');
let jlink = require('../util/jlink');

function load() {
	// Initialize the workspace
	let Workspace = new workspace.workspace();
	jlink.configureJlink("/opt/SEGGER/JLink/JLinkExe", "-device NRF52 -if SWD -speed 4000");
	Workspace.open();
}

load();