import * as vscode from 'vscode';

import { default as signalInstance, Signal } from '../signals-ts';
import { initFileWatcher, disableFileWatcher, isFileWatcherRunning, } from './file-watcher';
import { globalWebSocketServer, startWebSocketServer, stopWebSocketServer } from './socket-server';
import { globalSanitizedUserConfig, sanitizeUserConfig } from '../lib/config';
import { showToast, ToastType } from "../lib/ui";
import { globalWebsocketServerIsAlive } from './networking/webSocketServerBuilder';

let syncServerRunning: boolean = false;

export function startSyncServer() {
    if (syncServerRunning) {
        // TOOD: sort out if this needs to actually handle something
        console.log('Sorry, BitBurner sync server alread running...')
        return;
    }

    // Placeholder for WebSocket server stop logic.
    console.log('Starting Bitburner Sync server...');
    initFileWatcher();
    startWebSocketServer();
    syncServerRunning = true;
    if (globalSanitizedUserConfig.showFileWatcherEnabledNotification) {
        let rootSyncDir = globalSanitizedUserConfig.syncRoot;
        let extensions = globalSanitizedUserConfig.filewatchConfig.allowedFiletypes.join(', ');
        let vscodePaths = vscode.workspace.workspaceFolders
            ?.map((ws) => `${ws.uri.fsPath}/${rootSyncDir}/**`)
            .join(', ');
        showToast(
            'File Watcher Enabled.\n' + `For \`${extensions}\` files within the ${vscodePaths} path(s).`.replace(/[\\|/]+/g, `/`),
            ToastType.Information,
        );
    }
}

export function stopSyncServer() {
    // Placeholder for WebSocket server stop logic.
    console.log('Stopping Bitburner Sync server...');
    // Stop server if running...
    if (syncServerRunning || globalWebSocketServer !== undefined || globalWebsocketServerIsAlive || isFileWatcherRunning()) {
        showToast('File Watcher Disabled');
        // Stop socket server first...
        stopWebSocketServer();
        // Then stop file watcher...
        if (isFileWatcherRunning())
            disableFileWatcher();

        signalInstance.clear();
        syncServerRunning = false;
    }
}

export function refreshSyncConfig() {
    // Placeholder for WebSocket server stop logic.
    console.log('Refreshing Config...');
    // Reload configs..
    sanitizeUserConfig();
    // Stop server if running...
    if (syncServerRunning) {
        console.log('...and then Restarting Bitburner Sync server...')
        stopSyncServer();
        // restart server if was running...
        startSyncServer();
    }
}
