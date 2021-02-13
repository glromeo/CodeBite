import chalk from "chalk";
import {promises as fsp, readFileSync} from "fs";
import path from "path";
import resolve from "resolve";
import log from "tiny-node-logger";
import {WebModulesOptions} from "./index";

export interface PackageMeta {
    name: string;
    version: string;
    dependencies: { [name: string]: string };
    peerDependencies: { [name: string]: string };
    devDependencies: { [name: string]: string };

    [key: string]: any;
}

export interface ImportMap {
    imports: { [packageName: string]: string };
}

export function readJson(filename) {
    return JSON.parse(readFileSync(filename, "utf-8"));
}

export function stripExt(filename: string) {
    const end = filename.lastIndexOf(".");
    return end > 0 ? filename.substring(0, end) : filename;
}

export function readImportMap(rootDir: string, outDir: string): ImportMap {
    try {
        let importMap: ImportMap = JSON.parse(readFileSync(`${outDir}/import-map.json`, "utf-8"));

        for (const [key, pathname] of Object.entries(importMap.imports)) {
            try {
                // let {mtime} = statSync(path.join(rootDir, String(pathname)));
                log.debug("web_module:", chalk.green(key), "->", chalk.gray(pathname));
            } catch (e) {
                delete importMap[key];
            }
        }

        return importMap;
    } catch (e) {
        return {imports: {}};
    }
}

export function writeImportMap(outDir: string, importMap: ImportMap): Promise<void> {
    return fsp.writeFile(`${outDir}/import-map.json`, JSON.stringify(importMap, null, "  "));
}

export function closestManifest(entryModule: string) {
    let dirname = path.dirname(entryModule);
    while (true) try {
        return readJson(`${dirname}/package.json`);
    } catch (e) {
        const parent = path.dirname(dirname);
        if (parent.endsWith("node_modules")) {
            break;
        }
        dirname = parent;
    }
    throw new Error("No package.json found starting from: " + entryModule);
}

function getModuleDirectories(options: WebModulesOptions) {
    const moduleDirectory = options.resolve.moduleDirectory;
    return Array.isArray(moduleDirectory) ? [...moduleDirectory] : moduleDirectory ? [moduleDirectory] : undefined;
}