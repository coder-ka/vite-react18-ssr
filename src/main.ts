import { name } from "../package.json";

export default function (
  options: {
    indexHtmlPath?: string;
  } = {}
) {
  return {
    name: "vite-plugin-vr18s",
    config() {
      return {
        build: {
          rollupOptions: {
            input: {
              app:
                options.indexHtmlPath ||
                `node_modules/${name}/dist/tmp/index.html`,
            },
          },
        },
      };
    },
  };
}
