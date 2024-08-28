import { WebSocketServer, } from "ws";

import { EventType } from "../eventTypes.js";
import { Message } from "../interfaces.js";
import { messageTracker } from "./messageTracker.js";
import { Signal } from "../../signals-ts/index.js";
import { globalSanitizedUserConfig } from "../../lib/config.js";

export let globalWebsocketServerIsAlive: boolean = false;

export function setupSocket(signaller: Signal) {
    let port = globalSanitizedUserConfig.filewatchConfig.port ?? 12525;
    // TODO actually get config port...
    const wss = new WebSocketServer({ port });

    wss.on("connection", function connection(ws) {
        function sendMessage(msg: Message) {
            messageTracker.push(msg);
            ws.send(JSON.stringify(msg));
        }

        ws.on("message", (msg) => {
            signaller.emit(EventType.MessageReceived, msg);
        });

        signaller.on(EventType.MessageSend, (msg: Message) => {
            sendMessage(msg);
        });


        function errorHandle(err: Error) {
            console.error(err)
        }
        ws.on('error', errorHandle);
        ws.on('wsClientError', errorHandle);

        signaller.trigger(EventType.ConnectionMade);
    });


    wss.on('close', function close() {
        globalWebsocketServerIsAlive = false;
    });

    globalWebsocketServerIsAlive = true;
    return wss;
}
