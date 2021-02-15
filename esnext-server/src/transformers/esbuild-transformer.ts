import {init, parse} from "es-module-lexer";
import {startService} from "esbuild";
import {useWebModules} from "esnext-web-modules";
import memoized from "nano-memoize";
import path from "path";
import {ESNextOptions} from "../configure";
import {JAVASCRIPT_CONTENT_TYPE} from "../util/mime-types";
import {TransformerOutput} from "./index";

export const useEsBuildTransformer = memoized((options: ESNextOptions, sourceMaps: "inline" | "auto" = "auto") => {

    const {resolveImport} = useWebModules(options);

    let esbuild;
    let setup = async () => {
        await init;
        return esbuild = await startService();
    };

    async function esbuildTransformer(filename:string, content:string): Promise<TransformerOutput> {

        let {code, map} = await (esbuild || await setup()).transform(content, {
            sourcefile: filename,
            define: {"process.env.NODE_ENV": `"development"`},
            sourcemap: "inline",
            loader: "tsx"
        }).catch(reason => {
            console.error(reason);
        });

        if (!code) {
            throw new Error(`esbuild transformer failed to transform: ${filename}`);
        }

        let basedir = path.dirname(filename);
        let links = new Set<string>();
        let [imports] = parse(code);
        let l = 0, rewritten: string = "";
        for (const {s, e, se} of imports) {
            if (se === 0) {
                continue;
            }
            let url = code.substring(s, e);
            let resolved = await resolveImport(url, basedir);
            if (resolved) {
                rewritten += code.substring(l, s);
                rewritten += resolved;
                links.add(resolved);
            } else {
                rewritten += code.substring(l, e);
                links.add(url);
            }
            l = e;
        }
        code = rewritten + code.substring(l);

        return {
            content: code,
            headers: {
                "content-type": JAVASCRIPT_CONTENT_TYPE,
                "content-length": Buffer.byteLength(code),
                "x-transformer": "esbuild-transformer"
            },
            map,
            links: links
        };
    }

    return {
        esbuildTransformer
    };
});
