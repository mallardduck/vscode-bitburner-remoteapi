// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { default as signalInstance, } from './signals-ts';
import { showToast, ToastType, } from "./lib/ui";
import { sanitizeUserConfig, } from "./lib/config";
import { startSyncServer, stopSyncServer, refreshSyncConfig, isSyncServerRunning } from './bb-filesync/sync-server';
import { getCurrentOpenDocURI, isValidGameFile } from './lib/paths';
import { tryFetchDefinitionFile } from './bb-filesync/socket-server';
import { createFileEventFromPath, getWatchedFilesList } from './bb-filesync/file-watcher';
import { EventType } from './bb-filesync/eventTypes';
import { fileChangeEventToMsg, fileRemovalEventToMsg } from './bb-filesync/networking/messageGenerators';

// Track if sync auto start is set in the workspace
let syncAutoStart: boolean = false;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    syncAutoStart = sanitizeUserConfig();

    if (syncAutoStart) {
        startSyncServer();
    }

    const configChangeListener = vscode.workspace.onDidChangeConfiguration(() => {
        refreshSyncConfig();
    });

    /**
	 * @type Array<vscode.Disposable>
	 */
    const disposableCommands: Array<vscode.Disposable> = [];
    disposableCommands.push(
        vscode.commands.registerCommand("ext.bitburner-remoteapi.fileWatcher.start", () => {
            startSyncServer();
        }),
    );

    disposableCommands.push(
        vscode.commands.registerCommand("ext.bitburner-remoteapi.fileWatcher.stop", () => {
            stopSyncServer();
        }),
    );

    disposableCommands.push(
        vscode.commands.registerCommand("ext.bitburner-remoteapi.fileWatcher.fetchDefinition", () => {
            // TODO: consider adding checks for connection state?
            showToast('Fetching NetScriptDefinitions file...')
            tryFetchDefinitionFile();
        }),
    );

    disposableCommands.push(
        vscode.commands.registerCommand("ext.bitburner-remoteapi.fileWatcher.pushFile", () => {
            if (!isSyncServerRunning()) {
                showToast('Cannot push file before starting server and connecting.', ToastType.Warning)
                return
            }

            const currentOpenFileURI = getCurrentOpenDocURI();
            if (currentOpenFileURI === undefined || !isValidGameFile(currentOpenFileURI.fsPath)) {
                showToast(
                    "Cannot push the open file.",
                    ToastType.Error
                );
                return;
            }

            showToast('Pushing Open File To The Game');
            signalInstance.emit(EventType.MessageSend, fileChangeEventToMsg(createFileEventFromPath(currentOpenFileURI.fsPath)))
        }),
    );

    disposableCommands.push(
        vscode.commands.registerCommand("ext.bitburner-remoteapi.fileWatcher.pushAllFiles", () => {
            if (!isSyncServerRunning()) {
                showToast('Cannot push files before starting server and connecting.', ToastType.Warning)
                return
            }

            showToast('Pushing All Watched Files To The Game');

            const watchedArray = Array.from(getWatchedFilesList());
            for(let fsIdx in watchedArray) {
                const fsPath = watchedArray[fsIdx];
                signalInstance.emit(EventType.MessageSend, fileChangeEventToMsg(createFileEventFromPath(fsPath)))
            // callPushAllFileEvent(getWatchedFilesList().entries());
            }
        }),
    );

    disposableCommands.push(
        vscode.commands.registerCommand("ext.bitburner-remoteapi.fileWatcher.deleteFile", () => {
            if (!isSyncServerRunning()) {
                showToast('Cannot delete files before starting server and connecting.', ToastType.Warning)
                return
            }


            const currentOpenFileURI = getCurrentOpenDocURI();
            if (currentOpenFileURI === undefined || !isValidGameFile(currentOpenFileURI.fsPath)) {
                showToast(
                    "Cannot delete the open file.",
                    ToastType.Error
                );
                return;
            }

            signalInstance.emit(EventType.MessageSend, fileRemovalEventToMsg(createFileEventFromPath(currentOpenFileURI)))
        }),
    );

    context.subscriptions.push(...disposableCommands, configChangeListener);
}

// This method is called when your extension is deactivated
export async function deactivate() {
    stopSyncServer();
}
