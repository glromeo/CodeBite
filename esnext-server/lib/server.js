"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = exports.DEFAULT_SERVER_OPTIONS = void 0;
const tiny_node_logger_1 = __importDefault(require("tiny-node-logger"));
const request_handler_1 = require("./request-handler");
const watcher_1 = require("./watcher");
const websockets_1 = require("./websockets");
const hmr_server_1 = require("./hmr-server");
exports.DEFAULT_SERVER_OPTIONS = {
    protocol: "http",
    host: "localhost",
    port: 3000,
    options: {}
};
async function startServer(options, services = {}) {
    const { server: { protocol, host, port, options: serverOptions = {} } = exports.DEFAULT_SERVER_OPTIONS } = options;
    const watcher = services.watcher || watcher_1.createWatcher(options);
    const handler = services.handler || request_handler_1.createRequestHandler(options, watcher);
    let module, server;
    if (options.http2) {
        module = require("http2");
        if (protocol === "http") {
            server = module.createServer(serverOptions, handler);
        }
        else {
            server = module.createSecureServer(serverOptions, handler);
        }
    }
    else {
        if (protocol === "http") {
            module = require("http");
            server = module.createServer(serverOptions, handler);
        }
        else {
            module = require("https");
            server = module.createServer(serverOptions, handler);
        }
    }
    await new Promise(resolve => server.listen(port, host, resolve));
    const address = `${protocol}://${host}:${port}`;
    tiny_node_logger_1.default.info(`server started on ${address}`);
    hmr_server_1.useHotModuleReplacement(options).connect(server);
    websockets_1.createWebSockets(options, server, watcher);
    const sockets = new Set();
    server.on("connection", function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });
    server.on("secureConnection", function (socket) {
        sockets.add(socket);
        socket.on("close", () => sockets.delete(socket));
    });
    let closed;
    async function shutdown() {
        if (closed) {
            tiny_node_logger_1.default.debug("server already closed");
            await closed;
        }
        closed = new Promise(resolve => server.on("close", resolve));
        if (sockets.size > 0) {
            tiny_node_logger_1.default.debug(`closing ${sockets.size} pending socket...`);
            for (const socket of sockets) {
                socket.destroy();
                sockets.delete(socket);
            }
        }
        tiny_node_logger_1.default.debug(`closing chokidar watcher...`);
        await watcher.close();
        server.close();
        await closed;
        tiny_node_logger_1.default.info("server closed");
        return closed;
    }
    return {
        config: options,
        module,
        server,
        watcher,
        handler,
        address,
        shutdown
    };
}
exports.startServer = startServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFNQSx3RUFBbUM7QUFFbkMsdURBQXVEO0FBQ3ZELHVDQUF3QztBQUN4Qyw2Q0FBOEM7QUFDOUMsNkNBQW1FO0FBYXRELFFBQUEsc0JBQXNCLEdBQWtCO0lBQ2pELFFBQVEsRUFBRSxNQUFNO0lBQ2hCLElBQUksRUFBRSxXQUFXO0lBQ2pCLElBQUksRUFBRSxJQUFJO0lBQ1YsT0FBTyxFQUFFLEVBQUU7Q0FDZCxDQUFDO0FBT0ssS0FBSyxVQUFVLFdBQVcsQ0FBQyxPQUFzQixFQUFFLFdBQXFCLEVBQUU7SUFFN0UsTUFBTSxFQUNGLE1BQU0sRUFBRSxFQUNKLFFBQVEsRUFDUixJQUFJLEVBQ0osSUFBSSxFQUNKLE9BQU8sRUFBRSxhQUFhLEdBQUcsRUFBRSxFQUM5QixHQUFHLDhCQUFzQixFQUM3QixHQUFHLE9BQU8sQ0FBQztJQUVaLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLElBQUksdUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMzRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsT0FBTyxJQUFJLHNDQUFvQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUUzRSxJQUFJLE1BQU0sRUFBRSxNQUE4QyxDQUFDO0lBRTNELElBQUksT0FBTyxDQUFDLEtBQUssRUFBRTtRQUNmLE1BQU0sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUIsSUFBSSxRQUFRLEtBQUssTUFBTSxFQUFFO1lBQ3JCLE1BQU0sR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN4RDthQUFNO1lBQ0gsTUFBTSxHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDOUQ7S0FDSjtTQUFNO1FBQ0gsSUFBSSxR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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGU1dhdGNoZXJ9IGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IFJvdXRlciwge0hhbmRsZXIsIEhUVFBWZXJzaW9ufSBmcm9tIFwiZmluZC1teS13YXlcIjtcbmltcG9ydCB7U2VydmVyIGFzIEh0dHBTZXJ2ZXJ9IGZyb20gXCJodHRwXCI7XG5pbXBvcnQge0h0dHAyU2VydmVyfSBmcm9tIFwiaHR0cDJcIjtcbmltcG9ydCB7U2VydmVyIGFzIEh0dHBzU2VydmVyfSBmcm9tIFwiaHR0cHNcIjtcbmltcG9ydCB7U29ja2V0fSBmcm9tIFwibmV0XCI7XG5pbXBvcnQgbG9nIGZyb20gXCJ0aW55LW5vZGUtbG9nZ2VyXCI7XG5pbXBvcnQge0VTTmV4dE9wdGlvbnN9IGZyb20gXCIuL2NvbmZpZ3VyZVwiO1xuaW1wb3J0IHtjcmVhdGVSZXF1ZXN0SGFuZGxlcn0gZnJvbSBcIi4vcmVxdWVzdC1oYW5kbGVyXCI7XG5pbXBvcnQge2NyZWF0ZVdhdGNoZXJ9IGZyb20gXCIuL3dhdGNoZXJcIjtcbmltcG9ydCB7Y3JlYXRlV2ViU29ja2V0c30gZnJvbSBcIi4vd2Vic29ja2V0c1wiO1xuaW1wb3J0IHtFc21IbXJFbmdpbmUsIHVzZUhvdE1vZHVsZVJlcGxhY2VtZW50fSBmcm9tIFwiLi9obXItc2VydmVyXCI7XG5cbmV4cG9ydCB0eXBlIFNlcnZlck9wdGlvbnMgPSB7XG4gICAgcHJvdG9jb2w/OiBcImh0dHBcIiB8IFwiaHR0cHNcIlxuICAgIGhvc3Q/OiBzdHJpbmdcbiAgICBwb3J0PzogbnVtYmVyXG4gICAgb3B0aW9ucz86IHtcbiAgICAgICAga2V5Pzogc3RyaW5nXG4gICAgICAgIGNlcnQ/OiBzdHJpbmdcbiAgICAgICAgYWxsb3dIVFRQMT86IGJvb2xlYW5cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFUlZFUl9PUFRJT05TOiBTZXJ2ZXJPcHRpb25zID0ge1xuICAgIHByb3RvY29sOiBcImh0dHBcIixcbiAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3B0aW9uczoge31cbn07XG5cbmV4cG9ydCB0eXBlIFNlcnZpY2VzID0ge1xuICAgIHdhdGNoZXI/OiBGU1dhdGNoZXJcbiAgICBoYW5kbGVyPzogSGFuZGxlcjxIVFRQVmVyc2lvbi5WMXxIVFRQVmVyc2lvbi5WMj5cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U2VydmVyKG9wdGlvbnM6IEVTTmV4dE9wdGlvbnMsIHNlcnZpY2VzOiBTZXJ2aWNlcyA9IHt9KSB7XG5cbiAgICBjb25zdCB7XG4gICAgICAgIHNlcnZlcjoge1xuICAgICAgICAgICAgcHJvdG9jb2wsXG4gICAgICAgICAgICBob3N0LFxuICAgICAgICAgICAgcG9ydCxcbiAgICAgICAgICAgIG9wdGlvbnM6IHNlcnZlck9wdGlvbnMgPSB7fVxuICAgICAgICB9ID0gREVGQVVMVF9TRVJWRVJfT1BUSU9OU1xuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgY29uc3Qgd2F0Y2hlciA9IHNlcnZpY2VzLndhdGNoZXIgfHwgY3JlYXRlV2F0Y2hlcihvcHRpb25zKTtcbiAgICBjb25zdCBoYW5kbGVyID0gc2VydmljZXMuaGFuZGxlciB8fCBjcmVhdGVSZXF1ZXN0SGFuZGxlcihvcHRpb25zLCB3YXRjaGVyKTtcblxuICAgIGxldCBtb2R1bGUsIHNlcnZlcjogSHR0cFNlcnZlciB8IEh0dHBzU2VydmVyIHwgSHR0cDJTZXJ2ZXI7XG5cbiAgICBpZiAob3B0aW9ucy5odHRwMikge1xuICAgICAgICBtb2R1bGUgPSByZXF1aXJlKFwiaHR0cDJcIik7XG4gICAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpIHtcbiAgICAgICAgICAgIHNlcnZlciA9IG1vZHVsZS5jcmVhdGVTZXJ2ZXIoc2VydmVyT3B0aW9ucywgaGFuZGxlcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBtb2R1bGUuY3JlYXRlU2VjdXJlU2VydmVyKHNlcnZlck9wdGlvbnMsIGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIikge1xuICAgICAgICAgICAgbW9kdWxlID0gcmVxdWlyZShcImh0dHBcIik7XG4gICAgICAgICAgICBzZXJ2ZXIgPSBtb2R1bGUuY3JlYXRlU2VydmVyKHNlcnZlck9wdGlvbnMsIGhhbmRsZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlID0gcmVxdWlyZShcImh0dHBzXCIpO1xuICAgICAgICAgICAgc2VydmVyID0gbW9kdWxlLmNyZWF0ZVNlcnZlcihzZXJ2ZXJPcHRpb25zLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gc2VydmVyLmxpc3Rlbihwb3J0LCBob3N0LCByZXNvbHZlKSk7XG5cbiAgICBjb25zdCBhZGRyZXNzID0gYCR7cHJvdG9jb2x9Oi8vJHtob3N0fToke3BvcnR9YDtcbiAgICBsb2cuaW5mbyhgc2VydmVyIHN0YXJ0ZWQgb24gJHthZGRyZXNzfWApO1xuXG4gICAgdXNlSG90TW9kdWxlUmVwbGFjZW1lbnQob3B0aW9ucykuY29ubmVjdChzZXJ2ZXIpO1xuXG4gICAgY3JlYXRlV2ViU29ja2V0cyhvcHRpb25zLCBzZXJ2ZXIsIHdhdGNoZXIpO1xuXG4gICAgY29uc3Qgc29ja2V0cyA9IG5ldyBTZXQ8U29ja2V0PigpO1xuXG4gICAgc2VydmVyLm9uKFwiY29ubmVjdGlvblwiLCBmdW5jdGlvbiAoc29ja2V0KSB7XG4gICAgICAgIHNvY2tldHMuYWRkKHNvY2tldCk7XG4gICAgICAgIHNvY2tldC5vbihcImNsb3NlXCIsICgpID0+IHNvY2tldHMuZGVsZXRlKHNvY2tldCkpO1xuICAgIH0pO1xuICAgIHNlcnZlci5vbihcInNlY3VyZUNvbm5lY3Rpb25cIiwgZnVuY3Rpb24gKHNvY2tldCkge1xuICAgICAgICBzb2NrZXRzLmFkZChzb2NrZXQpO1xuICAgICAgICBzb2NrZXQub24oXCJjbG9zZVwiLCAoKSA9PiBzb2NrZXRzLmRlbGV0ZShzb2NrZXQpKTtcbiAgICB9KTtcblxuICAgIGxldCBjbG9zZWQ7XG5cbiAgICBhc3luYyBmdW5jdGlvbiBzaHV0ZG93bih0aGlzOiBhbnkpIHtcbiAgICAgICAgaWYgKGNsb3NlZCkge1xuICAgICAgICAgICAgbG9nLmRlYnVnKFwic2VydmVyIGFscmVhZHkgY2xvc2VkXCIpO1xuICAgICAgICAgICAgYXdhaXQgY2xvc2VkO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xvc2VkID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXJ2ZXIub24oXCJjbG9zZVwiLCByZXNvbHZlKSk7XG5cbiAgICAgICAgaWYgKHNvY2tldHMuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhgY2xvc2luZyAke3NvY2tldHMuc2l6ZX0gcGVuZGluZyBzb2NrZXQuLi5gKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc29ja2V0IG9mIHNvY2tldHMpIHtcbiAgICAgICAgICAgICAgICBzb2NrZXQuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHNvY2tldHMuZGVsZXRlKHNvY2tldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2cuZGVidWcoYGNsb3NpbmcgY2hva2lkYXIgd2F0Y2hlci4uLmApO1xuICAgICAgICBhd2FpdCB3YXRjaGVyLmNsb3NlKCk7XG5cbiAgICAgICAgc2VydmVyLmNsb3NlKCk7XG4gICAgICAgIGF3YWl0IGNsb3NlZDtcbiAgICAgICAgbG9nLmluZm8oXCJzZXJ2ZXIgY2xvc2VkXCIpO1xuXG4gICAgICAgIHJldHVybiBjbG9zZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29uZmlnOiBvcHRpb25zLFxuICAgICAgICBtb2R1bGUsXG4gICAgICAgIHNlcnZlcixcbiAgICAgICAgd2F0Y2hlcixcbiAgICAgICAgaGFuZGxlcixcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgc2h1dGRvd25cbiAgICB9O1xufVxuIl19