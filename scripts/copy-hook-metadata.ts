#!/usr/bin/env tsx
/**
 * Copy HOOK.md files and compile handler.ts → handler.js
 * from src/hooks/bundled to dist/hooks/bundled
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const srcBundled = path.join(projectRoot, "src", "hooks", "bundled");
const distBundled = path.join(projectRoot, "dist", "hooks", "bundled");

function compileHandler(srcHandler: string, distHandler: string, hookName: string): void {
  const source = fs.readFileSync(srcHandler, "utf-8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      declaration: false,
    },
    fileName: srcHandler,
  });
  fs.writeFileSync(distHandler, result.outputText);
  console.log(`[copy-hook-metadata] Compiled ${hookName}/handler.js`);
}

function copyHookMetadata() {
  if (!fs.existsSync(srcBundled)) {
    console.warn("[copy-hook-metadata] Source directory not found:", srcBundled);
    return;
  }

  if (!fs.existsSync(distBundled)) {
    fs.mkdirSync(distBundled, { recursive: true });
  }

  const entries = fs.readdirSync(srcBundled, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const hookName = entry.name;
    const srcHookDir = path.join(srcBundled, hookName);
    const distHookDir = path.join(distBundled, hookName);
    const srcHookMd = path.join(srcHookDir, "HOOK.md");
    const distHookMd = path.join(distHookDir, "HOOK.md");

    if (!fs.existsSync(srcHookMd)) {
      console.warn(`[copy-hook-metadata] No HOOK.md found for ${hookName}`);
      continue;
    }

    if (!fs.existsSync(distHookDir)) {
      fs.mkdirSync(distHookDir, { recursive: true });
    }

    fs.copyFileSync(srcHookMd, distHookMd);
    console.log(`[copy-hook-metadata] Copied ${hookName}/HOOK.md`);

    // Compile handler.ts → handler.js
    const srcHandler = path.join(srcHookDir, "handler.ts");
    if (fs.existsSync(srcHandler)) {
      try {
        compileHandler(srcHandler, path.join(distHookDir, "handler.js"), hookName);
      } catch (err) {
        console.error(`[copy-hook-metadata] Failed to compile ${hookName}/handler.ts:`, err);
      }
    }
  }

  console.log("[copy-hook-metadata] Done");
}

copyHookMetadata();
