#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./App.jsx";

// Enter alternate screen buffer (like vim / htop)
process.stdout.write("\x1b[?1049h");
process.stdout.write("\x1b[2J\x1b[H");

const cleanup = () => {
  process.stdout.write("\x1b[?1049l");
};

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("SIGTERM", () => { cleanup(); process.exit(0); });

render(React.createElement(App));
