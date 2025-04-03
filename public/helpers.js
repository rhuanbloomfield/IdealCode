export function padZeroes(str, amount)
{
	return "0".repeat(Math.max(amount-str.length, 0)) + str;
}

export function log(...data)
{
	const date = new Date();

	const time = "[" + padZeroes(String(date.getHours()), 2) + ":" +
	padZeroes(String(date.getMinutes()), 2) + ":" +
	padZeroes(String(date.getSeconds()), 2) + "." +
	padZeroes(String(date.getMilliseconds()), 3) + "]";

	console.log(time, ...data);
}

export function setCookie(name, value)
{
	document.cookie = `${name}=${value};SameSite=Strict`;
}

export function deleteCookie(name)
{
	document.cookie = `${name}=;Expires=Mon, 01 Jan 1970`;
}

export function getCookie(name)
{
	name += "=";
	const cookies = document.cookie.split("; ");
	
	for (let i = 0; i < cookies.length; i++)
	{
		if (cookies[i].substring(0, name.length) === name)
		{
			return cookies[i].substring(name.length, cookies[i].length);
		}
	}
}

export function htmlElementFromString(string)
{
	const div = document.createElement("div");
	div.innerHTML = string;

	return div.childNodes[0];
}