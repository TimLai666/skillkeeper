import { BrowserView, BrowserWindow } from "electrobun";
import type { ShellRPCSchema } from "../shared/bootstrap-rpc";
import { bootstrapApplication } from "./bootstrap/runtime";

let bootstrapState = bootstrapApplication();

const rpc = BrowserView.defineRPC<ShellRPCSchema>({
  handlers: {
    requests: {
      getBootstrapState: () => bootstrapState,
      refreshBootstrapState: () => {
        bootstrapState = bootstrapApplication();
        return bootstrapState;
      }
    },
    messages: {}
  }
});

new BrowserWindow({
  title: "SkillKeeper",
  frame: {
    x: 0,
    y: 0,
    width: 1180,
    height: 780
  },
  url: "views://main/index.html",
  titleBarStyle: "default",
  rpc
});
