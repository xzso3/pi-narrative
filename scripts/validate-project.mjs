#!/usr/bin/env node
import path from "node:path";
import { validateProjectForEngine } from "../src/engine-integration.js";

const projectRoot = path.resolve(process.argv[2] ?? process.cwd());
const result = validateProjectForEngine(projectRoot, { consumerId: "ci" });
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;
