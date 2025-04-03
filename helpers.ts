// deno-lint-ignore-file no-explicit-any
import {STATUS_TEXT, chalk} from "./modules.ts";

export function parseURL(req: Request): string
{
	const cut_url = req.url.substring(7);
	const main = cut_url.split("/")[0];
	const url = cut_url.substring(main.length);
	return url;
}

export function getFile(path: string): ReadableStream | null 
{
	/* const arr = path.split("/");
	const name = arr.splice(arr.length - 1, 1)[0];
	const dir_path = arr.join("/");
	
	const files: string[] = [];
	for (const file of Deno.readDirSync(dir_path))
	{
		files.push(file.name);
	}

	if (!files.includes(name)) {return null;} */

	try {Deno.statSync(path);}
	catch {return null;}

	const file = Deno.openSync(Deno.realPathSync(path), {read: true});

	return new ReadableStream
	({
		start(controller)
		{
			const buffer_size = 4096;

			let amount_read: number | null;
			do
			{
				const buffer = new Uint8Array(buffer_size);
				amount_read = file.readSync(buffer);
				if (amount_read === null) {break;}

				controller.enqueue(buffer.subarray(0, amount_read));
			}
			while (amount_read === buffer_size)

			controller.close();
		}
	})
}

// `init` object: https://developer.mozilla.org/en-US/docs/Web/API/Response/Response
export function init(code: number, content_type?: string): ResponseInit
{
	const object: ResponseInit = {status: code, statusText: STATUS_TEXT.get(code)};
	if (content_type !== undefined)
	{
		object.headers = {"content-type": content_type};
	}

	return object;
}

export function isWsReq(req: {headers: Headers}): boolean
{
	const upgrade = req.headers.get("upgrade");
	if (!upgrade || upgrade.toLowerCase() !== "websocket")
	{
		return false;
	}
	const secKey = req.headers.get("sec-websocket-key");
	return (req.headers.has("sec-websocket-key") && typeof secKey === "string" && secKey.length > 0);
}

export function padZeroes(str: string, amount: number): string
{
	return "0".repeat(Math.max(amount-str.length, 0)) + str;
}

export function log(...data: any): void
{
	const date = new Date();

	const time = "[" + chalk.green(
	padZeroes(String(date.getHours()), 2) + ":" +
	padZeroes(String(date.getMinutes()), 2) + ":" +
	padZeroes(String(date.getSeconds()), 2) + "." +
	padZeroes(String(date.getMilliseconds()), 3)) + "]";

	console.log(time, ...data);
}

enum Conversion
{
	"html" = "text/html",
	"css" = "text/css",
	"js" = "text/javascript",
	"png" = "image/png",
	"ico" = "image/png",
	"ogg" = "audio/ogg"
}

// TS magic
export type ConversionStrings = keyof typeof Conversion;

export function extensionToType(ext: ConversionStrings): string
{
	return Conversion[ext];
}