/// <reference types="node" />
import WebSocket from "ws";
import type http from "http";
import { Http2Server } from "http2";
interface Dependency {
    dependents: Set<string>;
    dependencies: Set<string>;
    isHmrEnabled: boolean;
    isHmrAccepted: boolean;
    needsReplacement: boolean;
}
export declare class EsmHmrEngine {
    clients: Set<WebSocket>;
    dependencyTree: Map<string, Dependency>;
    constructor(options?: {
        server?: http.Server | Http2Server;
    });
    registerListener(client: WebSocket): void;
    createEntry(sourceUrl: string): Dependency;
    getEntry(sourceUrl: string, createIfNotFound?: boolean): Dependency | null;
    setEntry(sourceUrl: string, imports: string[], isHmrEnabled?: boolean): void;
    removeRelationship(sourceUrl: string, importUrl: string): void;
    addRelationship(sourceUrl: string, importUrl: string): void;
    markEntryForReplacement(entry: Dependency, state: boolean): void;
    broadcastMessage(data: object): void;
    connectClient(client: WebSocket): void;
    disconnectClient(client: WebSocket): void;
    disconnectAllClients(): void;
}
export {};