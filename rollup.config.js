"use strict";

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import screeps from 'rollup-plugin-screeps';
require('dotenv').config();

const cfg = require("./screeps.json");

/**
 * Apply secret from .env file
 * */
function appendToken() {
  const token = process.env.TOKEN;
  if(cfg) {
    cfg.token = token;
  }
}

appendToken();

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
    screeps({ config: cfg })
  ]
}