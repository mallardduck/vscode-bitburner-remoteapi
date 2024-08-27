import { WebSocket, MessageEvent, RawData } from "ws";

interface  HeartbeatWebSocket extends WebSocket {
    pingTimeout: NodeJS.Timeout;
}

const socket = new WebSocket('ws://localhost:12525');

const heartbeat = function(ws: HeartbeatWebSocket) {
    if (ws === undefined)
        return;

    console.log("ws client HB", ws)
    clearTimeout(ws.pingTimeout);

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    ws.pingTimeout = setTimeout(() => {
        ws.close();
    }, 10000 + 1000);
}

const close = function(ws: HeartbeatWebSocket) {
    clearTimeout(ws.pingTimeout);
};

socket.on('error', (err) => {
    console.log("errors fam...")
    console.error(err)
});

socket.on('ping', heartbeat);
socket.on('close', close);

socket.onmessage = (event) => {
    console.log('received: ', event.data);
    let eventData: { method: string } = JSON.parse(event.data.toString());

    let result: any = null;
    if (eventData.method === "getFileNames") {
        result = [
            "/tool/find-server.js",
        ];
    }

    return {
        result
    }
};
