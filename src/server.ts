import type {
  PipeableStream,
  RenderToPipeableStreamOptions,
} from "react-dom/server";
import express from "express";
import path from "path";
import fs from "fs/promises";
import { extractHeadInjection } from "./util/html";
import { createStreamForTagInsertion } from "./util/createStreamForTagInsertion";
import { createDummyIndexHtml } from "./html";
// import getPort from "get-port";

export type ServerSideRenderFn = (
  url: string,
  options?: RenderToPipeableStreamOptions
) => Promise<PipeableStream>;
export async function ssr(
  app: express.Express,
  {
    isProduction,
    serverPort,
  }: {
    isProduction: boolean;
    serverPort: number;
  }
) {
  if (isProduction) {
    const clientDir = "dist/client";

    app.use(
      express.static(clientDir, {
        index: false,
        setHeaders(res, filePath) {
          if (path.basename(filePath) === "index.html") {
            res.setHeader("Cache-Control", "no-cache");
          } else {
            // cache-busting for 1 year if not index.html
            res.setHeader(
              "Cache-Control",
              "public, max-age=31536000, immutable"
            );
          }
        },
      })
    );

    const indexHTMLPath = path.join(
      clientDir,
      "node_modules/@coder-ka/vite-react18-ssr/dist/tmp",
      "index.html"
    );
    const indexHTML = await fs.readFile(indexHTMLPath, "utf-8");
    const headInjection = extractHeadInjection(indexHTML);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await import(
          path.resolve("dist/ssr/entry-ssr.js")
        )) as {
          render: ServerSideRenderFn;
        };

        const { pipe: pipeSSR } = await render(url);

        pipeSSR(createStreamForTagInsertion("head", headInjection)).pipe(
          res
            .status(200)
            .set({ "Content-Type": "text/html", "Cache-Control": "no-cache" })
        );
      } catch (e) {
        next(e);
      }
    });
  } else {
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: serverPort,
      },
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const { render } = (await vite.ssrLoadModule(
          "./src/entry-ssr.tsx"
        )) as { render: ServerSideRenderFn };

        const { pipe: pipeSSR } = await render(url, {
          bootstrapModules: ["/src/entry-client.tsx"],
        });

        const indexHTML = createDummyIndexHtml("/src/entry-client.tsx");
        const viteTransformed = await vite.transformIndexHtml(url, indexHTML);
        const headInjection = extractHeadInjection(viteTransformed);

        pipeSSR(
          createStreamForTagInsertion("html", headInjection, {
            position: "afterTag",
          })
        ).pipe(res.status(200).setHeader("content-type", "text/html"));
      } catch (e) {
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  return app;
}
