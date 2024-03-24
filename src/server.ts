import { Writable } from "stream";
import type { SSR } from "./ssr";
import { resolveMetadataFolderPath, loadConfigFile } from "./config";
import { createStreamForTagInsertion } from "./util/createStreamForTagInsertion";
import { extractHeadInjection } from "./util/html";
import { createDummyIndexHtml } from "./html";
import { ViteDevServer } from "vite";
import path from "path";
import fs from "fs/promises";

export async function ssrPipeDev(
  url: string,
  viteDevServer: any,
  options: {
    configFilePath?: string;
  } = {}
) {
  // なぜかViteDevServerを引数にするとタイプエラーになるため
  viteDevServer = viteDevServer as ViteDevServer;

  const config = await loadConfigFile(options.configFilePath);

  const { ssr } = (await viteDevServer.ssrLoadModule(config.ssrEntry)) as {
    ssr: SSR;
  };

  const { pipe: pipeSSR } = await ssr.render(
    url,
    {
      isProduction: false,
    },
    {
      configFilePath: config.configFilePath,
    }
  );

  const indexHTML = createDummyIndexHtml(config.clientEntry);
  const viteTransformed = await viteDevServer.transformIndexHtml(
    url,
    indexHTML
  );
  const headInjection = extractHeadInjection(viteTransformed);

  return (stream: Writable) =>
    pipeSSR(
      createStreamForTagInsertion("html", headInjection, {
        position: "afterTag",
      })
    ).pipe(stream);
}

export async function createSsrPipeProd(
  ssrLoadModule: (ssrPath: string) => Promise<{ ssr: SSR }>,
  options: {
    configFilePath?: string;
  } = {}
) {
  const config = await loadConfigFile(options.configFilePath);
  const indexHTMLPath = path.join(
    resolveMetadataFolderPath(config),
    "index.html"
  );
  const indexHTML = await fs.readFile(indexHTMLPath, "utf-8");
  const headInjection = extractHeadInjection(indexHTML);

  return async ({ url }: { url: string }) => {
    const { ssr } = await ssrLoadModule(
      path.resolve(config.dist, "ssr", "entry-ssr.js")
    );

    const { pipe: pipeSSR } = await ssr.render(url, {
      isProduction: true,
    });

    return (stream: Writable) =>
      pipeSSR(createStreamForTagInsertion("head", headInjection)).pipe(stream);
  };
}
