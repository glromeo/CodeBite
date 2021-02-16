import {CSS_CONTENT_TYPE, HTML_CONTENT_TYPE, JAVASCRIPT_CONTENT_TYPE} from "../util/mime-types";

export type SourceMap = {
    version: number;
    sources: string[];
    names: string[];
    sourceRoot?: string;
    sourcesContent?: string[];
    mappings: string;
    file: string;
}

export type TransformerOutput = {
    content: string
    headers: {
        "content-type": typeof JAVASCRIPT_CONTENT_TYPE | typeof HTML_CONTENT_TYPE | typeof CSS_CONTENT_TYPE,
        "content-length": number,
        "x-transformer": "babel-transformer" | "sass-transformer" | "html-transformer" | "esbuild-transformer"
    },
    map?: SourceMap | null;
    links?: Iterable<string>
    watch?: Iterable<string>
}
