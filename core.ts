import {serve} from "./modules.ts";
import {parseURL, getFile, init, isWsReq, log, ConversionStrings, extensionToType} from "./helpers.ts";
import {socketHandler} from "./sockets.ts";

function requestHandler(req: Request): Response
{
	let url = parseURL(req);
	if (url === "/") {url = "/index.html";}
	else if (url === "/ws" && isWsReq(req))
	{
		const ws = socketHandler(req);
		return ws.response;
	}

	log("New Request:", url);

	const file = getFile("./public" + url);
	if (file === null) {return new Response("404: Page not Found.", init(404, "text/plain"));}

	const mime = extensionToType(url.match(/(?<=\.).+$/)![0] as ConversionStrings);

	return new Response(file, init(200, mime + "; charset=utf-8"));

	/* case "/ws":
	{
		if (!isWsReq(req)) {break;}
		const ws = socketHandler(req);
		return ws.response;
	} */
}

const port = 57474;
serve(requestHandler, {port: port});
console.log("Listening to http://localhost:" + String(port) + "/");