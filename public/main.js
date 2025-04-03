import {log, getCookie, setCookie, htmlElementFromString} from "./helpers.js";

let b_connected = false;
let b_sent_name = false;
let name = "";
let ID = null;

const ws_url = "ws://" + location.href.substring(7).split("/")[0] + "/ws"
const ws = new WebSocket(ws_url);

const $userlist = document.querySelector("ul.userlist");
const $chat = document.querySelector("div.chat");

function addUserInUserlist(id, name)
{
	const li_text = "<li id=id-" + id + ">" + name + "</li>";
	$userlist.insertAdjacentHTML("beforeend", li_text);
}

function removeUserFromUserlist(id)
{
	const $li = document.querySelector("li#id-" + id);
	if ($li !== null) {$li.remove();}
}

function addMessageInChat(author, content, code = "")
{
	const $ul = htmlElementFromString("<ul class=\"msg\"></ul>");

	const $li_author = htmlElementFromString("<li class=\"msg_author\"></li>");
	$li_author.innerText = author;
	$ul.appendChild($li_author);

	if (content !== "")
	{
		const $li_content = htmlElementFromString("<li class=\"msg_content\"></li>");
		$li_content.innerText = content;
		$ul.appendChild($li_content);
	}

	if (code !== "")
	{
		const $li_code = htmlElementFromString("<li class=\"msg_code\"></li>");
		const $iframe = htmlElementFromString("<iframe class=\"msg_frame\"></iframe>");

		const blob = new Blob([code], {type: "text/html"});
		const url = URL.createObjectURL(blob);

		$iframe.src = url;
		$li_code.appendChild($iframe);
		$ul.appendChild($li_code);
	}

	$chat.appendChild($ul);
}

function wsSend(msg)
{
	log("Sent a WebSocket Message:", msg);
	ws.send(JSON.stringify(msg));
}

function wsOnMessage(event)
{
	const msg = JSON.parse(event.data);
	log("Received a WebSocket Message:", msg);

	switch (msg.type)
	{
		case "CONNECTED":
		{
			b_connected = true;
			ID = msg.id;

			if (b_sent_name)
			{
				wsSend({type: "POST_user_joined", id: ID, content: {name: name}});
				$name_form.remove();
				$msg_form.style.display = "flex";
			}

			wsSend({type: "GET_online_users"});
			break;
		}

		case "GET_online_users":
		{
			const entries = Object.entries(msg.response);
			if (entries.length === 0) {break;}

			for (const entry of entries)
			{
				addUserInUserlist(entry[0], entry[1]);
			}

			break;
		}

		case "POST_user_joined":
		{
			addUserInUserlist(msg.id, msg.content.name);
			break;
		}

		case "POST_user_left":
		{
			removeUserFromUserlist(msg.id);
			break;
		}

		case "POST_send_message":
		{
			addMessageInChat(msg.content.name, msg.content.message);
			break;
		}
		
		case "POST_send_code":
		{
			addMessageInChat(msg.content.name, msg.content.message, msg.content.code);
			break;
		}
	}
}
ws.addEventListener("message", wsOnMessage);



const $name_form = document.querySelector("form.name_form");
const $msg_form = document.querySelector("form.msg_form");
const $msg_input = document.querySelector("textarea.msg_input");
const $btn_codearea = document.querySelector("button.btn_codearea");
const $main_right = document.querySelector("div.main_right");
const $code_form = document.querySelector("form.code_form");
const $code_input = document.querySelector("textarea.code_input");

// form submits

function nameFormOnSubmit(event)
{
	event.preventDefault();
	b_sent_name = true;
	name = $name_form.name.value;

	if (!b_connected) {return;}

	wsSend({type: "POST_user_joined", id: ID, content: {name: name}});
	$name_form.remove();
	$msg_form.style.display = "flex";
	$msg_input.focus();

	setCookie("lastname", name);
}
$name_form.addEventListener("submit", nameFormOnSubmit);

function msgFormOnSubmit(event)
{
	event.preventDefault();

	const msg = $msg_form.msg.value.trim();
	if (msg === "") {return;}

	$msg_form.msg.value = "";

	wsSend({type: "POST_send_message", id: ID, content: {name: name, message: msg}});
}
$msg_form.addEventListener("submit", msgFormOnSubmit);

function codeFormOnSubmit(event)
{
	event.preventDefault();

	const msg = $msg_form.msg.value.trim();
	if (msg !== "") {$msg_form.msg.value = "";}

	const code = $code_form.code.value.trim();
	if (code === "") {return;}

	$code_form.code.value = "";
	$main_right.style.display = "none";

	wsSend({type: "POST_send_code", id: ID, content: {name: name, message: msg, code: code}});
}
$code_form.addEventListener("submit", codeFormOnSubmit);

// input keydowns

function msgInputOnKeydown(event)
{
	if (event.key.toLowerCase() !== "enter") {return;}
	if (event.ctrlKey || event.shiftKey) {return;}

	msgFormOnSubmit(event);
}
$msg_input.addEventListener("keydown", msgInputOnKeydown);

// vscode, isso não é um constructor
function codeInputOnKeydown(event)
{
	if (event.key.toLowerCase() === "tab")
	{
		event.preventDefault();

		const start = this.selectionStart;
		const end = this.selectionEnd;

		this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

		this.selectionStart = start + 1;
		this.selectionEnd = start + 1;
	}
}
$code_input.addEventListener("keydown", codeInputOnKeydown);

// other

function btnCodeareaOnClick(event)
{
	event.preventDefault();

	if ($main_right.style.display === "none") {$main_right.style.display = "flex";}
	else if ($main_right.style.display === "flex") {$main_right.style.display = "none";}

	// só pro caso de alguém mexer
	else {$main_right.style.display = "flex";}
}
$btn_codearea.addEventListener("click", btnCodeareaOnClick);



const last_name = getCookie("lastname") ?? "";
$name_form.name.value = last_name;