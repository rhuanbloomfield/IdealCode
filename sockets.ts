// deno-lint-ignore-file no-explicit-any
import {log} from "./helpers.ts";
import {chalk} from "./modules.ts";

interface WsMessage
{
	type: "CONNECTED" | "GET_online_users" | "POST_user_joined" | "POST_user_left" | "POST_is_typing" | "POST_not_typing" | "POST_send_message",
	id: string,
	content?: Record<string, any>,
	response?: any
}

// sends a WsMessage to everyone connected
function broadcastMessage(ws_message: WsMessage): void
{
	console.log();
	log(`Broadcasting ${chalk.cyan(ws_message.type)} to ${chalk.green(String(Sockets.size))} Sockets:`);
	log(ws_message);

	Sockets.forEach((socket) =>
	{
		socket.send(JSON.stringify(ws_message));
	})
}

// globals
const Sockets = new Map<string, WebSocket>();
const OnlineUsers: Record<string, string> = {};

export function socketHandler(req: Request): Deno.WebSocketUpgrade
{
	// the upgraded WebSocket connection to return
	const ws = Deno.upgradeWebSocket(req);
	const socket = ws.socket;
	let ID: string;

	// when the connection is established
	socket.addEventListener("open", function()
	{
		// set an ID for the user
		ID = crypto.randomUUID();
		Sockets.set(ID, socket);

		// respond to the user that the connection has been established with the server
		socket.send(JSON.stringify({type: "CONNECTED", id: ID}));

		// logs
		console.log();
		log(`${chalk.brightGreen("Established")} WebSocket Connection with ${chalk.cyan(ID)}.`);
		log(`Total Connections: ${chalk.green(String(Sockets.size))}.`);
	})

	socket.addEventListener("close", function()
	{
		// remove the user from sockets list
		Sockets.delete(ID);

		log("ID:", ID);
		const object: WsMessage = {type: "POST_user_left", id: ID, content: {name: OnlineUsers[ID]}};
		broadcastMessage(object);

		// remove the user from the Online Users list
		// this is done after the WsMessage creation so the user name isn"t lost forever
		delete OnlineUsers[ID];

		// logs
		console.log();
		log(`${chalk.brightRed("Closed")} WebSocket Connection with ${chalk.cyan(ID)}.`);
		log(`Total Connections: ${chalk.green(String(Sockets.size))}.`);
	})

	socket.addEventListener("message", function(event)
	{
		const ws_message: WsMessage = JSON.parse(event.data);

		console.log();
		log(`Received ${chalk.cyan(ws_message.type)}:`);
		log(ws_message);

		switch (ws_message.type)
		{
			// received when an user requests all online users
			case "GET_online_users":
			{
				const response: WsMessage = {type: "GET_online_users", id: ID, response: OnlineUsers};
				socket.send(JSON.stringify(response));

				console.log();
				log(`Sent ${chalk.cyan(response.type)}:`);
				log(response);

				break;
			}

			// received when an user sends their name
			case "POST_user_joined":
			{
				OnlineUsers[ws_message.id] = ws_message.content!.name as string;
				broadcastMessage(ws_message);
				break;
			}

			// everything else
			default:
			{
				broadcastMessage(ws_message);
				break;
			}
		}
	})

	return ws;
}