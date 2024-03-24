import { PipeableStream, renderToPipeableStream } from "react-dom/server";
import { JSX } from "react";
import { loadConfigFile } from "./config";

export function ssrModule(
  resolveComponent: (arg: { url: string }) => JSX.Element
) {
  return {
    async render(
      url: string,
      params: {
        isProduction: boolean;
      },
      options: {
        configFilePath?: string;
      } = {}
    ): Promise<PipeableStream> {
      const config = await loadConfigFile(options.configFilePath);
      return new Promise((resolve, reject) => {
        const pipeableStream = renderToPipeableStream(
          resolveComponent({ url }),
          {
            onShellError(error) {
              reject(error);
            },
            onShellReady() {
              resolve(pipeableStream);
            },
            bootstrapModules: params.isProduction ? [] : [config.clientEntry],
          }
        );
      });
    },
  };
}

export type SSR = ReturnType<typeof ssrModule>;
