"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceProvider = exports.NO_QUERY = exports.NO_LINKS = void 0;
const chalk_1 = __importDefault(require("chalk"));
const etag_1 = __importDefault(require("etag"));
const fs_1 = require("fs");
const nano_memoize_1 = __importDefault(require("nano-memoize"));
const path_1 = __importDefault(require("path"));
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const transformers_1 = require("../transformers");
const mime_types_1 = require("../util/mime-types");
const multi_map_1 = require("../util/multi-map");
const zlib_1 = require("../util/zlib");
const watcher_1 = require("../watcher");
const messaging_1 = require("../messaging");
const router_1 = require("./router");
exports.NO_LINKS = Object.freeze([]);
exports.NO_QUERY = Object.freeze({});
exports.useResourceProvider = nano_memoize_1.default(function (options) {
    const cache = new Map();
    const watched = new multi_map_1.MultiMap();
    const dependants = new multi_map_1.MultiMap();
    const ws = messaging_1.useMessaging(options);
    const watcher = watcher_1.useWatcher(options);
    function watch(filename, url) {
        const relative = path_1.default.relative(options.rootDir, filename);
        if (!watched.has(relative)) {
            watcher.add(relative);
        }
        watched.add(relative, url);
    }
    function unwatch(filename, url = null) {
        if (url !== null) {
            let urls = watched.get(filename);
            if (urls) {
                urls.delete(url);
                if (!urls.size) {
                    watcher.unwatch(filename);
                }
            }
        }
        else {
            watched.delete(filename);
            watcher.unwatch(filename);
        }
    }
    watcher.on("change", function (filename) {
        const urls = watched.get(filename);
        if (urls) {
            for (const url of urls) {
                const resource = cache.get(url);
                if (resource) {
                    tiny_node_logger_1.default.debug("change:", filename, "->", url);
                    cache.set(url, Promise.resolve(resource).then(reload).then(pipeline).then(resource => {
                        cache.set(url, resource);
                        return resource;
                    }));
                }
                else {
                    tiny_node_logger_1.default.warn("no cache entry for:", url);
                    unwatch(filename, url);
                }
                ws.broadcast("hmr:update", { url });
            }
        }
        else {
            tiny_node_logger_1.default.warn("no urls for filename:", filename);
            unwatch(filename);
        }
    });
    watcher.on("unlink", function (event, filename) {
        const urls = watched.get(filename);
        if (urls)
            for (const url of urls) {
                tiny_node_logger_1.default.debug("unlink:", filename, "->", url);
                let resource = cache.get(url);
                if (resource && !(resource instanceof Promise)) {
                    unwatch(resource.filename);
                    if (resource.watch) {
                        for (const filename of resource.watch)
                            unwatch(filename, url);
                    }
                    cache.delete(url);
                }
            }
        unwatch(filename);
    });
    const { route } = router_1.useRouter(options);
    const { shouldTransform, transformContent } = transformers_1.useTransformers(options);
    const { applyCompression } = zlib_1.useZlib(options);
    /**
     *          _            _ _
     *         (_)          | (_)
     *    _ __  _ _ __   ___| |_ _ __   ___
     *   | '_ \| | '_ \ / _ \ | | '_ \ / _ \
     *   | |_) | | |_) |  __/ | | | | |  __/
     *   | .__/|_| .__/ \___|_|_|_| |_|\___|
     *   | |     | |
     *   |_|     |_|
     *
     * @param resource
     */
    async function pipeline(resource) {
        if (shouldTransform(resource)) {
            const sourceMap = await transformContent(resource);
            if (sourceMap) {
                storeSourceMap(resource.filename, resource.pathname, resource.query, sourceMap);
            }
        }
        await etagHeader(resource);
        if (options.encoding) {
            await compressContent(resource);
        }
        return resource;
    }
    function storeSourceMap(filename, pathname, query, map) {
        const content = applyCompression(JSON.stringify(map), "deflate");
        const sourceMapUrl = pathname + ".map";
        const sourceMapFilename = filename + ".map";
        cache.set(sourceMapUrl, {
            filename: sourceMapFilename,
            pathname: sourceMapUrl,
            query: query,
            content: content,
            headers: {
                "content-type": mime_types_1.JSON_CONTENT_TYPE,
                "content-length": content.length,
                "content-encoding": "deflate",
                "last-modified": new Date().toUTCString(),
                "cache-control": "no-cache"
            },
            links: exports.NO_LINKS
        });
    }
    async function reload(resource) {
        const stats = await fs_1.promises.stat(resource.filename);
        resource.content = await fs_1.promises.readFile(resource.filename);
        resource.headers["content-type"] = mime_types_1.contentType(resource.filename);
        resource.headers["content-length"] = stats.size;
        resource.headers["last-modified"] = stats.mtime.toUTCString();
        return resource;
    }
    async function etagHeader({ headers, pathname }) {
        headers["etag"] = etag_1.default(`${pathname} ${headers["content-length"]} ${headers["last-modified"]}`, options.etag);
    }
    async function compressContent(resource) {
        try {
            resource.content = applyCompression(resource.content);
            resource.headers = {
                ...(resource.headers),
                "content-length": resource.content.length,
                "content-encoding": options.encoding
            };
        }
        catch (err) {
            tiny_node_logger_1.default.error(`failed to deflate resource: ${resource.filename}`, err);
        }
    }
    return {
        async provideResource(url) {
            let resource = cache.get(url);
            if (resource) {
                tiny_node_logger_1.default.debug("retrieved from cache:", chalk_1.default.magenta(url));
            }
            else {
                resource = route(url).then(pipeline).then(resource => {
                    if (options.cache) {
                        cache.set(url, resource);
                        watch(resource.filename, url);
                        if (resource.watch) {
                            for (const filename of resource.watch)
                                watch(filename, url);
                        }
                    }
                    return resource;
                }).finally(function () {
                    if (!options.cache) {
                        cache.delete(url);
                    }
                });
                cache.set(url, resource);
            }
            return resource;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2UtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL3Jlc291cmNlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsMkJBQWtDO0FBRWxDLGdFQUFvQztBQUNwQyxnREFBd0I7QUFDeEIsd0VBQW1DO0FBRW5DLGtEQUEyRDtBQUMzRCxtREFBa0U7QUFDbEUsaURBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyx3Q0FBc0M7QUFDdEMsNENBQTBDO0FBQzFDLHFDQUFtQztBQWdCdEIsUUFBQSxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixRQUFBLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRTdCLFFBQUEsbUJBQW1CLEdBQUcsc0JBQVEsQ0FBQyxVQUFVLE9BQXNCO0lBRXhFLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUF3QyxDQUFDO0lBQzlELE1BQU0sT0FBTyxHQUFHLElBQUksb0JBQVEsRUFBa0IsQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFRLEVBQWtCLENBQUM7SUFFbEQsTUFBTSxFQUFFLEdBQUcsd0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNLE9BQU8sR0FBRyxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXBDLFNBQVMsS0FBSyxDQUFDLFFBQWdCLEVBQUUsR0FBVztRQUN4QyxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6QjtRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRCxTQUFTLE9BQU8sQ0FBQyxRQUFnQixFQUFFLE1BQXFCLElBQUk7UUFDeEQsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ2QsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxJQUFJLElBQUksRUFBRTtnQkFDTixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNqQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtvQkFDWixPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUM3QjthQUNKO1NBQ0o7YUFBTTtZQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUM3QjtJQUNMLENBQUM7SUFFRCxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFVLFFBQWdCO1FBQzNDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkMsSUFBSSxJQUFJLEVBQUU7WUFDTixLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRTtnQkFDcEIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxRQUFRLEVBQUU7b0JBQ1YsMEJBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBQzFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2pGLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUN6QixPQUFPLFFBQVEsQ0FBQztvQkFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDUDtxQkFBTTtvQkFDSCwwQkFBRyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDckMsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDMUI7Z0JBQ0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsRUFBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDO2FBQ3JDO1NBQ0o7YUFBTTtZQUNILDBCQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNyQjtJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxLQUFLLEVBQUUsUUFBUTtRQUMxQyxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLElBQUksSUFBSTtZQUFFLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO2dCQUM5QiwwQkFBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxRQUFRLElBQUksQ0FBQyxDQUFDLFFBQVEsWUFBWSxPQUFPLENBQUMsRUFBRTtvQkFDNUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDM0IsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFO3dCQUNoQixLQUFLLE1BQU0sUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLOzRCQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7cUJBQ2pFO29CQUNELEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ3JCO2FBQ0o7UUFDRCxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLEVBQUMsS0FBSyxFQUFDLEdBQUcsa0JBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNuQyxNQUFNLEVBQUMsZUFBZSxFQUFFLGdCQUFnQixFQUFDLEdBQUcsOEJBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyRSxNQUFNLEVBQUMsZ0JBQWdCLEVBQUMsR0FBRyxjQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFNUM7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxLQUFLLFVBQVUsUUFBUSxDQUFDLFFBQWtCO1FBQ3RDLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNCLE1BQU0sU0FBUyxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxTQUFTLEVBQUU7Z0JBQ1gsY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ25GO1NBQ0o7UUFDRCxNQUFNLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7WUFDbEIsTUFBTSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbkM7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNwQixDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLEtBQVksRUFBRSxHQUFzQjtRQUU1RixNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sWUFBWSxHQUFHLFFBQVEsR0FBRyxNQUFNLENBQUM7UUFDdkMsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBRTVDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO1lBQ3BCLFFBQVEsRUFBRSxpQkFBaUI7WUFDM0IsUUFBUSxFQUFFLFlBQVk7WUFDdEIsS0FBSyxFQUFFLEtBQUs7WUFDWixPQUFPLEVBQUUsT0FBTztZQUNoQixPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLDhCQUFpQjtnQkFDakMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLE1BQU07Z0JBQ2hDLGtCQUFrQixFQUFFLFNBQVM7Z0JBQzdCLGVBQWUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtnQkFDekMsZUFBZSxFQUFFLFVBQVU7YUFDOUI7WUFDRCxLQUFLLEVBQUUsZ0JBQVE7U0FDbEIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELEtBQUssVUFBVSxNQUFNLENBQUMsUUFBa0I7UUFDcEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxhQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxRQUFRLENBQUMsT0FBTyxHQUFHLE1BQU0sYUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyx3QkFBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRSxRQUFRLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUNoRCxRQUFRLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDOUQsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUVELEtBQUssVUFBVSxVQUFVLENBQUMsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFXO1FBQ25ELE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxjQUFJLENBQUMsR0FBRyxRQUFRLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pILENBQUM7SUFFRCxLQUFLLFVBQVUsZUFBZSxDQUFDLFFBQWtCO1FBQzdDLElBQUk7WUFDQSxRQUFRLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0RCxRQUFRLENBQUMsT0FBTyxHQUFHO2dCQUNmLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDO2dCQUNyQixnQkFBZ0IsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU07Z0JBQ3pDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxRQUFRO2FBQ3ZDLENBQUM7U0FDTDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1YsMEJBQUcsQ0FBQyxLQUFLLENBQUMsK0JBQStCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN0RTtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFXO1lBQzdCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxRQUFRLEVBQUU7Z0JBQ1YsMEJBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsZUFBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzFEO2lCQUFNO2dCQUNILFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRTtvQkFDakQsSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFO3dCQUNmLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUN6QixLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFOzRCQUNoQixLQUFLLE1BQU0sUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLO2dDQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7eUJBQy9EO3FCQUNKO29CQUNELE9BQU8sUUFBUSxDQUFDO2dCQUNwQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUU7d0JBQ2hCLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7cUJBQ3JCO2dCQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUVILEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzVCO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDcEIsQ0FBQztLQUNKLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IGV0YWcgZnJvbSBcImV0YWdcIjtcclxuaW1wb3J0IHtwcm9taXNlcyBhcyBmc30gZnJvbSBcImZzXCI7XHJcbmltcG9ydCB7T3V0Z29pbmdIdHRwSGVhZGVyc30gZnJvbSBcImh0dHBcIjtcclxuaW1wb3J0IG1lbW9pemVkIGZyb20gXCJuYW5vLW1lbW9pemVcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IGxvZyBmcm9tIFwidGlueS1ub2RlLWxvZ2dlclwiO1xyXG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuLi9jb25maWd1cmVcIjtcclxuaW1wb3J0IHtTb3VyY2VNYXAsIHVzZVRyYW5zZm9ybWVyc30gZnJvbSBcIi4uL3RyYW5zZm9ybWVyc1wiO1xyXG5pbXBvcnQge2NvbnRlbnRUeXBlLCBKU09OX0NPTlRFTlRfVFlQRX0gZnJvbSBcIi4uL3V0aWwvbWltZS10eXBlc1wiO1xyXG5pbXBvcnQge011bHRpTWFwfSBmcm9tIFwiLi4vdXRpbC9tdWx0aS1tYXBcIjtcclxuaW1wb3J0IHt1c2VabGlifSBmcm9tIFwiLi4vdXRpbC96bGliXCI7XHJcbmltcG9ydCB7dXNlV2F0Y2hlcn0gZnJvbSBcIi4uL3dhdGNoZXJcIjtcclxuaW1wb3J0IHt1c2VNZXNzYWdpbmd9IGZyb20gXCIuLi9tZXNzYWdpbmdcIjtcclxuaW1wb3J0IHt1c2VSb3V0ZXJ9IGZyb20gXCIuL3JvdXRlclwiO1xyXG5cclxuXHJcbmV4cG9ydCB0eXBlIFF1ZXJ5ID0geyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH07XHJcblxyXG5leHBvcnQgdHlwZSBSZXNvdXJjZSA9IHtcclxuICAgIHBhdGhuYW1lOiBzdHJpbmdcclxuICAgIHF1ZXJ5OiBRdWVyeVxyXG4gICAgZmlsZW5hbWU6IHN0cmluZ1xyXG4gICAgY29udGVudDogc3RyaW5nIHwgQnVmZmVyXHJcbiAgICBoZWFkZXJzOiBPdXRnb2luZ0h0dHBIZWFkZXJzXHJcbiAgICBsaW5rczogcmVhZG9ubHkgc3RyaW5nW11cclxuICAgIHdhdGNoPzogcmVhZG9ubHkgc3RyaW5nW11cclxuICAgIG9uY2hhbmdlPzogKCkgPT4gdm9pZFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgTk9fTElOS1MgPSBPYmplY3QuZnJlZXplKFtdKTtcclxuZXhwb3J0IGNvbnN0IE5PX1FVRVJZID0gT2JqZWN0LmZyZWV6ZSh7fSk7XHJcblxyXG5leHBvcnQgY29uc3QgdXNlUmVzb3VyY2VQcm92aWRlciA9IG1lbW9pemVkKGZ1bmN0aW9uIChvcHRpb25zOiBFU05leHRPcHRpb25zKSB7XHJcblxyXG4gICAgY29uc3QgY2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUmVzb3VyY2UgfCBQcm9taXNlPFJlc291cmNlPj4oKTtcclxuICAgIGNvbnN0IHdhdGNoZWQgPSBuZXcgTXVsdGlNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XHJcbiAgICBjb25zdCBkZXBlbmRhbnRzID0gbmV3IE11bHRpTWFwPHN0cmluZywgc3RyaW5nPigpO1xyXG5cclxuICAgIGNvbnN0IHdzID0gdXNlTWVzc2FnaW5nKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qgd2F0Y2hlciA9IHVzZVdhdGNoZXIob3B0aW9ucyk7XHJcblxyXG4gICAgZnVuY3Rpb24gd2F0Y2goZmlsZW5hbWU6IHN0cmluZywgdXJsOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCByZWxhdGl2ZSA9IHBhdGgucmVsYXRpdmUob3B0aW9ucy5yb290RGlyLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgaWYgKCF3YXRjaGVkLmhhcyhyZWxhdGl2ZSkpIHtcclxuICAgICAgICAgICAgd2F0Y2hlci5hZGQocmVsYXRpdmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3YXRjaGVkLmFkZChyZWxhdGl2ZSwgdXJsKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1bndhdGNoKGZpbGVuYW1lOiBzdHJpbmcsIHVybDogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcclxuICAgICAgICBpZiAodXJsICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCB1cmxzID0gd2F0Y2hlZC5nZXQoZmlsZW5hbWUpO1xyXG4gICAgICAgICAgICBpZiAodXJscykge1xyXG4gICAgICAgICAgICAgICAgdXJscy5kZWxldGUodXJsKTtcclxuICAgICAgICAgICAgICAgIGlmICghdXJscy5zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2F0Y2hlci51bndhdGNoKGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdhdGNoZWQuZGVsZXRlKGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgd2F0Y2hlci51bndhdGNoKGZpbGVuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgd2F0Y2hlci5vbihcImNoYW5nZVwiLCBmdW5jdGlvbiAoZmlsZW5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IHVybHMgPSB3YXRjaGVkLmdldChmaWxlbmFtZSk7XHJcbiAgICAgICAgaWYgKHVybHMpIHtcclxuICAgICAgICAgICAgZm9yIChjb25zdCB1cmwgb2YgdXJscykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb3VyY2UgPSBjYWNoZS5nZXQodXJsKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxvZy5kZWJ1ZyhcImNoYW5nZTpcIiwgZmlsZW5hbWUsIFwiLT5cIiwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCBQcm9taXNlLnJlc29sdmUocmVzb3VyY2UpLnRoZW4ocmVsb2FkKS50aGVuKHBpcGVsaW5lKS50aGVuKHJlc291cmNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuc2V0KHVybCwgcmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb3VyY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2cud2FybihcIm5vIGNhY2hlIGVudHJ5IGZvcjpcIiwgdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICB1bndhdGNoKGZpbGVuYW1lLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgd3MuYnJvYWRjYXN0KFwiaG1yOnVwZGF0ZVwiLCB7dXJsfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2cud2FybihcIm5vIHVybHMgZm9yIGZpbGVuYW1lOlwiLCBmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHVud2F0Y2goZmlsZW5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHdhdGNoZXIub24oXCJ1bmxpbmtcIiwgZnVuY3Rpb24gKGV2ZW50LCBmaWxlbmFtZSkge1xyXG4gICAgICAgIGNvbnN0IHVybHMgPSB3YXRjaGVkLmdldChmaWxlbmFtZSk7XHJcbiAgICAgICAgaWYgKHVybHMpIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcclxuICAgICAgICAgICAgbG9nLmRlYnVnKFwidW5saW5rOlwiLCBmaWxlbmFtZSwgXCItPlwiLCB1cmwpO1xyXG4gICAgICAgICAgICBsZXQgcmVzb3VyY2UgPSBjYWNoZS5nZXQodXJsKTtcclxuICAgICAgICAgICAgaWYgKHJlc291cmNlICYmICEocmVzb3VyY2UgaW5zdGFuY2VvZiBQcm9taXNlKSkge1xyXG4gICAgICAgICAgICAgICAgdW53YXRjaChyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2Uud2F0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGVuYW1lIG9mIHJlc291cmNlLndhdGNoKSB1bndhdGNoKGZpbGVuYW1lLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2FjaGUuZGVsZXRlKHVybCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdW53YXRjaChmaWxlbmFtZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB7cm91dGV9ID0gdXNlUm91dGVyKG9wdGlvbnMpO1xyXG4gICAgY29uc3Qge3Nob3VsZFRyYW5zZm9ybSwgdHJhbnNmb3JtQ29udGVudH0gPSB1c2VUcmFuc2Zvcm1lcnMob3B0aW9ucyk7XHJcbiAgICBjb25zdCB7YXBwbHlDb21wcmVzc2lvbn0gPSB1c2VabGliKG9wdGlvbnMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogICAgICAgICAgXyAgICAgICAgICAgIF8gX1xyXG4gICAgICogICAgICAgICAoXykgICAgICAgICAgfCAoXylcclxuICAgICAqICAgIF8gX18gIF8gXyBfXyAgIF9fX3wgfF8gXyBfXyAgIF9fX1xyXG4gICAgICogICB8ICdfIFxcfCB8ICdfIFxcIC8gXyBcXCB8IHwgJ18gXFwgLyBfIFxcXHJcbiAgICAgKiAgIHwgfF8pIHwgfCB8XykgfCAgX18vIHwgfCB8IHwgfCAgX18vXHJcbiAgICAgKiAgIHwgLl9fL3xffCAuX18vIFxcX19ffF98X3xffCB8X3xcXF9fX3xcclxuICAgICAqICAgfCB8ICAgICB8IHxcclxuICAgICAqICAgfF98ICAgICB8X3xcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gcmVzb3VyY2VcclxuICAgICAqL1xyXG4gICAgYXN5bmMgZnVuY3Rpb24gcGlwZWxpbmUocmVzb3VyY2U6IFJlc291cmNlKSB7XHJcbiAgICAgICAgaWYgKHNob3VsZFRyYW5zZm9ybShyZXNvdXJjZSkpIHtcclxuICAgICAgICAgICAgY29uc3Qgc291cmNlTWFwID0gYXdhaXQgdHJhbnNmb3JtQ29udGVudChyZXNvdXJjZSk7XHJcbiAgICAgICAgICAgIGlmIChzb3VyY2VNYXApIHtcclxuICAgICAgICAgICAgICAgIHN0b3JlU291cmNlTWFwKHJlc291cmNlLmZpbGVuYW1lLCByZXNvdXJjZS5wYXRobmFtZSwgcmVzb3VyY2UucXVlcnksIHNvdXJjZU1hcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQgZXRhZ0hlYWRlcihyZXNvdXJjZSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcpIHtcclxuICAgICAgICAgICAgYXdhaXQgY29tcHJlc3NDb250ZW50KHJlc291cmNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc291cmNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHN0b3JlU291cmNlTWFwKGZpbGVuYW1lOiBzdHJpbmcsIHBhdGhuYW1lOiBzdHJpbmcsIHF1ZXJ5OiBRdWVyeSwgbWFwPzogU291cmNlTWFwIHwgbnVsbCkge1xyXG5cclxuICAgICAgICBjb25zdCBjb250ZW50ID0gYXBwbHlDb21wcmVzc2lvbihKU09OLnN0cmluZ2lmeShtYXApLCBcImRlZmxhdGVcIik7XHJcbiAgICAgICAgY29uc3Qgc291cmNlTWFwVXJsID0gcGF0aG5hbWUgKyBcIi5tYXBcIjtcclxuICAgICAgICBjb25zdCBzb3VyY2VNYXBGaWxlbmFtZSA9IGZpbGVuYW1lICsgXCIubWFwXCI7XHJcblxyXG4gICAgICAgIGNhY2hlLnNldChzb3VyY2VNYXBVcmwsIHtcclxuICAgICAgICAgICAgZmlsZW5hbWU6IHNvdXJjZU1hcEZpbGVuYW1lLFxyXG4gICAgICAgICAgICBwYXRobmFtZTogc291cmNlTWFwVXJsLFxyXG4gICAgICAgICAgICBxdWVyeTogcXVlcnksXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IEpTT05fQ09OVEVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LWxlbmd0aFwiOiBjb250ZW50Lmxlbmd0aCwgLy8gQnVmZmVyLmJ5dGVMZW5ndGgoY29udGVudCksXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtZW5jb2RpbmdcIjogXCJkZWZsYXRlXCIsXHJcbiAgICAgICAgICAgICAgICBcImxhc3QtbW9kaWZpZWRcIjogbmV3IERhdGUoKS50b1VUQ1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgXCJjYWNoZS1jb250cm9sXCI6IFwibm8tY2FjaGVcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBsaW5rczogTk9fTElOS1NcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiByZWxvYWQocmVzb3VyY2U6IFJlc291cmNlKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xyXG4gICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMuc3RhdChyZXNvdXJjZS5maWxlbmFtZSk7XHJcbiAgICAgICAgcmVzb3VyY2UuY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKHJlc291cmNlLmZpbGVuYW1lKTtcclxuICAgICAgICByZXNvdXJjZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID0gY29udGVudFR5cGUocmVzb3VyY2UuZmlsZW5hbWUpO1xyXG4gICAgICAgIHJlc291cmNlLmhlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXSA9IHN0YXRzLnNpemU7XHJcbiAgICAgICAgcmVzb3VyY2UuaGVhZGVyc1tcImxhc3QtbW9kaWZpZWRcIl0gPSBzdGF0cy5tdGltZS50b1VUQ1N0cmluZygpO1xyXG4gICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBldGFnSGVhZGVyKHtoZWFkZXJzLCBwYXRobmFtZX06IFJlc291cmNlKSB7XHJcbiAgICAgICAgaGVhZGVyc1tcImV0YWdcIl0gPSBldGFnKGAke3BhdGhuYW1lfSAke2hlYWRlcnNbXCJjb250ZW50LWxlbmd0aFwiXX0gJHtoZWFkZXJzW1wibGFzdC1tb2RpZmllZFwiXX1gLCBvcHRpb25zLmV0YWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGZ1bmN0aW9uIGNvbXByZXNzQ29udGVudChyZXNvdXJjZTogUmVzb3VyY2UpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXNvdXJjZS5jb250ZW50ID0gYXBwbHlDb21wcmVzc2lvbihyZXNvdXJjZS5jb250ZW50KTtcclxuICAgICAgICAgICAgcmVzb3VyY2UuaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgIC4uLihyZXNvdXJjZS5oZWFkZXJzKSxcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC1sZW5ndGhcIjogcmVzb3VyY2UuY29udGVudC5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtZW5jb2RpbmdcIjogb3B0aW9ucy5lbmNvZGluZ1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBsb2cuZXJyb3IoYGZhaWxlZCB0byBkZWZsYXRlIHJlc291cmNlOiAke3Jlc291cmNlLmZpbGVuYW1lfWAsIGVycik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYXN5bmMgcHJvdmlkZVJlc291cmNlKHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXNvdXJjZT4ge1xyXG4gICAgICAgICAgICBsZXQgcmVzb3VyY2UgPSBjYWNoZS5nZXQodXJsKTtcclxuICAgICAgICAgICAgaWYgKHJlc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICBsb2cuZGVidWcoXCJyZXRyaWV2ZWQgZnJvbSBjYWNoZTpcIiwgY2hhbGsubWFnZW50YSh1cmwpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlID0gcm91dGUodXJsKS50aGVuKHBpcGVsaW5lKS50aGVuKHJlc291cmNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5jYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCByZXNvdXJjZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhdGNoKHJlc291cmNlLmZpbGVuYW1lLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2Uud2F0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZW5hbWUgb2YgcmVzb3VyY2Uud2F0Y2gpIHdhdGNoKGZpbGVuYW1lLCB1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvdXJjZTtcclxuICAgICAgICAgICAgICAgIH0pLmZpbmFsbHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5jYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5kZWxldGUodXJsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjYWNoZS5zZXQodXJsLCByZXNvdXJjZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc291cmNlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pO1xyXG5cclxuIl19