import vite from "vite";
import fs from "fs/promises";
import path from "path";
import {
  Vr18sConfig,
  resolveMetadataFolderPath,
  loadConfigFile,
} from "./config";
import { createDummyIndexHtml } from "./html";

export async function build(
  options: {
    configFilePath?: string;
  } = {}
) {
  const config = await loadConfigFile(options.configFilePath);

  const distFolder = config.dist;

  const metadataFolder = resolveMetadataFolderPath(config);
  await fs.mkdir(metadataFolder, {
    recursive: true,
  });
  await fs.writeFile(
    path.join(metadataFolder, "vr18s.json"),
    JSON.stringify(config),
    "utf8"
  );

  const tmpFolder = `${__dirname}/tmp`;
  await fs.rm(tmpFolder, {
    recursive: true,
    force: true,
  });
  await fs.mkdir(tmpFolder, {
    recursive: true,
  });
  await Promise.all([
    prepareDummyIndexHtml(config, tmpFolder),
    prepareEntryClientProxy(config, tmpFolder),
  ]);

  Promise.all([
    vite.build({
      build: {
        outDir: `${distFolder}/ssr`,
        ssr: config.ssrEntry,
      },
    }),
    vite.build({
      build: {
        outDir: `${distFolder}/client`,
      },
    }),
    vite.build({
      build: {
        outDir: path.join(path.relative(tmpFolder, "."), metadataFolder),
      },
      root: tmpFolder,
    }),
  ]);
}

export async function prepareDummyIndexHtml(
  config: Vr18sConfig,
  tmpFolder: string
) {
  const dummyIndexHtml = createDummyIndexHtml(
    path.basename(config.clientEntry)
  );

  return fs.writeFile(path.join(tmpFolder, "index.html"), dummyIndexHtml);
}

export async function prepareEntryClientProxy(
  config: Vr18sConfig,
  tmpFolder: string
) {
  const userCwd = process.cwd();

  return fs.writeFile(
    path.join(tmpFolder, path.basename(config.clientEntry)),
    `import "${path.join(
      path.relative(tmpFolder, userCwd),
      config.clientEntry
    )}"`
  );
}
