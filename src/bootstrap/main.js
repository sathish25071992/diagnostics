let workspace = require('../workspace/workspace');

function load() {
	// Initialize the workspace
	let Workspace = new workspace.workspace();

	Workspace.open();
}

load();