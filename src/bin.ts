#!/usr/bin/env node

import { reduceArgs } from "@coder-ka/redargs";
import { build } from "./build";

const parsed = reduceArgs<{
  operation: "help" | "build";
  configFilePath?: string;
}>(
  process.argv.slice(2),
  (parsed, flag) => {
    switch (flag.name) {
      case "-":
        const operation = flag.values[0];
        switch (operation) {
          case "build":
            return {
              ...parsed,
              operation,
            };
          default:
            return {
              ...parsed,
              operation: "help",
            };
        }
      case "-c":
      case "--config-file":
        return {
          ...parsed,
          configFilePath: flag.values[0],
        };
      default:
        return parsed;
    }
  },
  {
    operation: "help",
  }
);

if (parsed.operation === "build") {
  build(parsed);
} else {
  console.log(`usage: vr18s build`);
}
