import * as fs from 'fs'
export function loadstyle(filename: string) {

	var fileref=document.createElement("link")
	console.log(fs.existsSync(filename));
	fileref.setAttribute("rel", "stylesheet")
	fileref.setAttribute("type", "text/css")
	fileref.setAttribute("href", filename)

	if (typeof fileref!="undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref)
}