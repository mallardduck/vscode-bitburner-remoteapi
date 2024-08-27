// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { showToast, } from "./lib/ui";
import { sanitizeUserConfig, updateExtensionConfig, } from "./lib/config";
import { startSyncServer, stopSyncServer, refreshSyncConfig } from './bb-filesync/sync-server';
import { tryFetchDefinitionFile } from './bb-filesync/socket-server';

// Track if sync auto start is set in the workspace
let syncAutoStart: boolean = false;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    syncAutoStart = sanitizeUserConfig();

    if (syncAutoStart) {
        console.log('Autostart...', syncAutoStart)
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
        vscode.commands.registerCommand("ext.bitburner-remoteapi.addAuthToken", () => {
            vscode.window
                .showInputBox({
                    ignoreFocusOut: true,
                    password: true,
                    placeHolder: `Bitburner Auth Token`,
                    title: `Bitburner Auth Token:`,
                    prompt: `Please enter the Bitburner Auth Token, for more information, see 'README #authentication'.`,
                })
                .then((authToken) => {
                    updateExtensionConfig(`authToken`, authToken)
                        .then(() => {
                            showToast(`Bitburner Auth Token Added!`);
                        });
                });
        }),
    );

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

    context.subscriptions.push(...disposableCommands, configChangeListener);
}

// This method is called when your extension is deactivated
export async function deactivate() {
    console.log("Deactivating BitburnerExt and stopping sync server...")
    stopSyncServer();
}
