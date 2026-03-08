import type { ElectrobunRPCSchema } from "electrobun";
import type { BootstrapState } from "./bootstrap";

export type ShellRPCSchema = ElectrobunRPCSchema & {
  bun: {
    requests: {
      getBootstrapState: {
        params: undefined;
        response: BootstrapState;
      };
      refreshBootstrapState: {
        params: undefined;
        response: BootstrapState;
      };
    };
    messages: {};
  };
  webview: {
    requests: {};
    messages: {};
  };
};
