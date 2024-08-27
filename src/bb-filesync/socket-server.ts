import { RawData, WebSocketServer } from 'ws';

import { Signal, default as signalInstance } from '../signals-ts';
import { setupSocket } from './networking/webSocketServerBuilder';
import { messageHandler } from './networking/messageHandler';
import {
    requestDefinitionFile,
    fileChangeEventToMsg,
    fileRemovalEventToMsg,
    requestFilenames,
} from './networking/messageGenerators';
import { EventType } from './eventTypes';
import { FileEvent } from './interfaces';
import { createFileEventFromPath, getWatchedFilesList, } from './file-watcher';
import { getSanitizedUserConfig } from '../lib/config';
import { showToast } from '../lib/ui';

export let globalWebSocketServer: WebSocketServer;

export function tryFetchDefinitionFile() {
    signalInstance.emit(EventType.MessageSend, requestDefinitionFile());
}

export function startWebSocketServer() {
    const filesyncConfig = getSanitizedUserConfig().toFilesyncConfig();
    globalWebSocketServer = setupSocket(signalInstance);

    // Add a handler for when a connection to a game is made.
    signalInstance.on(EventType.ConnectionMade, () => {
        console.log("Connection made!");

        if (filesyncConfig.definitionFileSync)
            tryFetchDefinitionFile();
        if (filesyncConfig.pushAllOnConnection) {
            // TODO: this should actually be the exclusion here not filte types...
            // Our filewatcher is already only watching the specific file types we told it.
            for (const path of getWatchedFilesList().entries())
                signalInstance.emit(EventType.MessageSend, fileChangeEventToMsg(createFileEventFromPath(path[0])));
        } else {
            // Upload missing files to the game.
            signalInstance.emit(EventType.MessageSend, requestFilenames());
        }
    });

    // Add a handler for received messages.
    signalInstance.on(EventType.MessageReceived, (msg: RawData) => messageHandler(signalInstance, msg));

    // Add a handler for changed files.
    signalInstance.on(EventType.FileChanged, (fileEvent: FileEvent) => {
        // We only continue past this if: it's an error, called with forceShow, or push notifications are on...
        if (filesyncConfig.showPushSuccessNotification)
            showToast('File just pushed..')
        if (filesyncConfig.verboseLog)
            console.log('socket changed', fileEvent);

        signalInstance.emit(EventType.MessageSend, fileChangeEventToMsg(fileEvent));
    });

    // Add a handler for removed files, if allowed.
    if (filesyncConfig.allowDeletingFiles) {
        signalInstance.on(EventType.FileDeleted, function(fileEvent: FileEvent) {
            console.log('socket delete', fileEvent);
            signalInstance.emit(EventType.MessageSend, fileRemovalEventToMsg(fileEvent))
        });
    }

    return true;
}

export function stopWebSocketServer() {
    globalWebSocketServer.close();
}
