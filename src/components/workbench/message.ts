import { dom, emptyDom , quickDom} from '../../dom/dom'

export function activateMessageBox(val: boolean) {
	var message = document.getElementsByClassName('message-box');
	var iframe = document.getElementsByTagName('iframe');
	if (message.length > 1) {
		console.warn('more than one message container detected');
	}
	if (val === true) {
		message.item(0).classList.add('show');
		message.item(0).classList.remove('hide');
		iframe.item(0).classList.add('show');
		iframe.item(0).classList.remove('hide');

	} else {
		message.item(0).classList.add('hide');
		message.item(0).classList.remove('show');
		iframe.item(0).classList.add('hide');
		iframe.item(0).classList.remove('show');		
	}
}

export class messageHandle {
	messageBox: dom;

	constructor(parent: dom) {
		if (typeof parent !== 'undefined') {
			var messageBox = emptyDom().element('div', 'message-box');
			messageBox.apendTo(parent);
			this.messageBox = messageBox;

			var iframe = emptyDom().element('iframe', '');
			iframe.apendTo(quickDom(document.body));

			activateMessageBox(false);

			emptyDom().element('div', 'message-box-sevearity').apendTo(messageBox);
			var message = emptyDom().element('div', 'message-box-message');
			message.apendTo(messageBox);

			emptyDom().element('div', 'message').apendTo(message);
			var button = emptyDom().element('div', 'button')
			button.apendTo(message);
			button.on('click', (e: Event) => {
				activateMessageBox(false);
			})
		}
	}
}

export function writeMessage(sevearity: string, msg: string) {
	var messageBox = document.getElementsByClassName('message-box-sevearity');
	if (messageBox.length > 1) {
		console.warn('more than one message box is detected');
	}
	if (sevearity === 'warning') {
		messageBox.item(0).classList.add('warn');
	} else if (sevearity === 'error') {
		messageBox.item(0).classList.add('error');
	} else if (sevearity === 'info') {
		messageBox.item(0).classList.add('warn');
	}

	var message = document.querySelectorAll('.message-box-message .message');
	if (message.length > 1) {
		console.warn('more than one message container detected');
	}
	console.log(message.length);
	if (message.length > 0) {
		message.item(0).innerHTML = msg;
	}
	var messageBox = document.getElementsByClassName('message-box');
	if (messageBox.length > 1) {
		console.warn('more than one message box is detected');
	}
	activateMessageBox(true);

}