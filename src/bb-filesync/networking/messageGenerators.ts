import { readFileSync } from "fs";
import type { FileEvent, Message } from "../interfaces.js";

let messageCounter = 0;

export function fileChangeEventToMsg(fileEvent: FileEvent): Message {
    return {
        jsonrpc: "2.0",
        method: "pushFile",
        params: {
            server: "home",
            filename: fileEvent.gamePath,
            content: readFileSync(fileEvent.realPath).toString(),
        },
        id: messageCounter++,
    };
}

export function fileRemovalEventToMsg(fileEvent: FileEvent): Message {
    return {
        jsonrpc: "2.0",
        method: "deleteFile",
        params: {
            server: "home",
            filename: addLeadingSlash(fileEvent.gamePath),
        },
        id: messageCounter++,
    };
}

export function requestDefinitionFile(): Message {
    return {
        jsonrpc: "2.0",
        method: "getDefinitionFile",
        id: messageCounter++,
    };
}

export function requestFilenames(): Message {
    return {
        jsonrpc: "2.0",
        method: "getFileNames",
        params: {
            server: "home",
        },
        id: messageCounter++,
    };
}


function addLeadingSlash(path: string): string {
    const firstSlashIndex = path.indexOf("/");
    if (firstSlashIndex !== 0) return `/${path}`;
    else return path;
}
