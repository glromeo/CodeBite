/**
 * This module is meant to be used when running workbench locally, for testing purposes.
 * Third party projects use workbench by specifying the module as argument to the esnext-server:
 *
 * esnext-server --module @codebite/workbench
 */

module.exports = {
    mount: {
        "/workbench": "./",
        "/@codebite": "../",
        "/node_modules": "../node_modules"
    },
    babel: {
        plugins: [
            ["babel-plugin-istanbul", {"exclude": ["**/*.test.js", "**/*.test.mjs"]}],
            ["@babel/plugin-proposal-decorators", {decoratorsBeforeExport: true}],
            ["@babel/plugin-proposal-class-properties"]
        ]
    },
    debug: true,
    push: true,
    cache: true,
    clean: false,
    web_modules: {
        standalone: ["mocha", "chai"],
        terser: false
    },

    middleware: [
        require("./lib/endpoint/snapshots-middleware.js")
    ],

    specs: [
        "components/**/*.spec.js",
        "test/*.spec.mjs"
    ],

    plugins: [
        require("./esnext-server.plugin.js")
    ]
};
