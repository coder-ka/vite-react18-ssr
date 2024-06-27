import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

export type Vr18sConfig = {
  clientEntry: string;
  ssrEntry: string;
  dist: string;
  configFilePath: string;
  metadataFolderName: string;
};

export const resolveDefaultConfig = (): Vr18sConfig => ({
  clientEntry: "src/entry-client.tsx",
  ssrEntry: "src/entry-ssr.tsx",
  dist: "dist",
  configFilePath: "./vr18s.json",
  metadataFolderName: "__vr18s__",
});

export async function loadConfigFile(path?: string): Promise<Vr18sConfig> {
  const defaultConfig = resolveDefaultConfig();
  const configFilePath = path || defaultConfig.configFilePath;

  if (fsSync.existsSync(configFilePath)) {
    const config: Partial<Vr18sConfig> = JSON.parse(
      await fs.readFile(configFilePath, "utf8")
    );

    return {
      clientEntry: config.clientEntry || defaultConfig.clientEntry,
      ssrEntry: config.ssrEntry || defaultConfig.ssrEntry,
      dist: config.dist || defaultConfig.dist,
      metadataFolderName:
        config.metadataFolderName || defaultConfig.metadataFolderName,
      configFilePath,
    };
  } else {
    return defaultConfig;
  }
}

export function resolveMetadataFolderPath(config: Vr18sConfig) {
  return path.join(config.dist, config.metadataFolderName);
}
