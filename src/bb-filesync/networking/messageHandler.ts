import { Stats, writeFileSync, writeSync, } from "fs";
import { RawData, } from "ws";
import { resolve } from "node:path";

import { messageTracker } from "./messageTracker.js";
import { Message } from "../interfaces.js";
import { Signal } from "../../signals-ts/index.js";
import { getWatchedFileStats } from "../file-watcher.js";
import { getSanitizedUserConfig } from "../../lib/config.js";
import { primaryWorkspaceRoot } from "../../lib/paths.js";

function deserialize(data: RawData): Message {
    const msg = JSON.parse(data.toString());
    if (typeof msg.jsonrpc !== "string" || msg.jsonrpc !== "2.0" || typeof msg.id !== "number")
        throw Error("Malformed data received.");

    const id: number = msg.id;
    const request = messageTracker.get(id);
    if (typeof request?.method !== "string")
        throw Error("Malformed JSON received.");
    else if (msg.error)
        throw Error(msg.error);
    else if (msg.result === null)
        throw Error("Malformed JSON received.");

    return { jsonrpc: "2.0", method: request.method, result: msg.result, id };
}

export function isStringArray(s: Array<unknown>): s is string[] {
    return s.every((s) => typeof s === "string");
}

export function messageHandler(signaller: Signal, data: RawData) {
    let incoming;

    try {
        incoming = deserialize(data);
    } catch (err) {
        if (err instanceof Error) return console.log(err.message);
        else throw err;
    }

    switch (incoming.method) {
        case "getDefinitionFile":
            if (typeof incoming.result !== "string") return console.log("Malformed data received.");

            let definitionFilePath = getSanitizedUserConfig().filewatchConfig.definitionLocation;
            if (definitionFilePath.indexOf('.') === 0 && definitionFilePath.indexOf('/') === 1)
                definitionFilePath = definitionFilePath.slice(1);

            const resolvedPath = resolve(primaryWorkspaceRoot() + definitionFilePath)
            console.log(
                "getDefinitionFile",
                resolvedPath
            )

            try {
                writeFileSync(resolvedPath, incoming.result)
            } catch (err) {
                if (err) return console.log(err);
            }

            break;
        case "getFileNames": {
            console.log("getFileNames")
            if (!Array.isArray(incoming.result) || !isStringArray(incoming.result))
                return console.log("Malformed data received.");

            const gameFiles = incoming.result.map((file: string) => removeLeadingSlash(file));
            console.log(
                gameFiles
            );

            getWatchedFileStats().forEach((stats: Stats, fileName: string, map) => {
                if (!stats.isDirectory() && !gameFiles.includes(fileName))
                    // signaller.emit(EventType.MessageSend, fileChangeEventToMsg({ gamePath: fileName }));
                    console.log("butts");
            });
        }
    }
}

function removeLeadingSlash(path: string) {
    const reg = /^\//;
    return path.replace(reg, "");
}
