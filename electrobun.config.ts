import type { ElectrobunConfig } from "electrobun";

const config: ElectrobunConfig = {
  app: {
    name: "SkillKeeper",
    identifier: "dev.skillkeeper.app",
    version: "0.1.0",
    description: "Desktop GUI for managing AI agent skills."
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
      sourcemap: "external"
    },
    views: {
      main: {
        entrypoint: "src/views/main.tsx",
        sourcemap: "external"
      }
    },
    copy: {
      "src/views/index.html": "app/views/main/index.html",
      "src/views/styles.css": "app/views/main/styles.css"
    }
  },
  runtime: {
    exitOnLastWindowClosed: true
  },
  release: {
    baseUrl: "",
    generatePatch: false
  }
};

export default config;
