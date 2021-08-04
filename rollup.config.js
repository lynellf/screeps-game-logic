"use strict";

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import screeps from 'rollup-plugin-screeps';
require('dotenv').config();

const cfg = require("./screeps.json");
const dest = process.env.DEST;

/**
 * Apply secret from .env file
 * */
function appendToken() {
  cfg.main.token = process.env.TOKEN;
  cfg.pserver.token = process.env.TOKEN;
  cfg.puser.token = process.env.TOKEN;
  cfg.season.token = process.env.TOKEN;
}

appendToken();

if (!dest) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if (cfg[dest] == null) {
  throw new Error("Invalid upload destination");
}

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: true,
    exports: 'auto'
  },

  plugins: [
    clear({ targets: ["dist"] }),
    resolve({ rootDir: "src" }),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    screeps({ config: cfg, dryRun: cfg == null })
  ]
}