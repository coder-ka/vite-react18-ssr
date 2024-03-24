import { parse as parseHTML } from "node-html-parser";

export function extractHeadInjection(html: string) {
  const indexHTMLRoot = parseHTML(html);
  const headEl = indexHTMLRoot.querySelector("head");
  const headInjection = headEl ? headEl.innerHTML : "";

  return headInjection;
}
