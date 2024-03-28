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
                "node_modules/@coder-ka/vite-react18-ssr/dist/tmp/index.html",
            },
          },
        },
      };
    },
  };
}
