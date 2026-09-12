import { URL } from 'node:url';

async function nodeUrlToBase64(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const contentType = response.headers.get('content-type');
  return `data:${contentType};base64,${buffer.toString('base64')}\n\n\n`;
}

let links = [
    "arrow-button.svg",
    "arrow-button-black.svg",
    "arrow-outline-black.svg",
    "arrow-outline.svg",
    "down-arrow-black.svg",
    "down-arrow-grey.svg",
    "down-arrow.svg",
    "extensions-black.svg",
    "extensions.svg",
    "flag.svg",
    "flag-red.svg",
    "repeat-black.svg",
    "repeat.svg",
    "rotate-left-black.svg",
    "rotate-right-black.svg",
    "rotate-left.svg",
    "rotate-right.svg",
    "stop.svg",
];

links.forEach(async (url) => {
    const myURL = new URL(`https://e016.github.io/split-mod/src/${url}`);
    let val = await nodeUrlToBase64(myURL)
    console.log(val)
})