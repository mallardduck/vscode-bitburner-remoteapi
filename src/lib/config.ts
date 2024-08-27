import * as vscode from 'vscode';
import { showToast, ToastType, } from "./ui";
import { SanitizedUserConfig } from './types';
import { primaryWorkspaceRoot } from './paths';
import { resolve } from 'path';
import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { isError } from './err';

function baseExtensionConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(`ext-bitburner-remoteapi`);
}

/**
 * Update a configuration value for the extension.
 * The updated configuration values are persisted.
 *
 * A value can be changed in
 *
 * *Note:* To remove a configuration value use `undefined`, like so: `config.update('somekey', undefined)`
 *
 * @param section Configuration name, supports _dotted_ names.
 * @param value The new value.
 */
export function updateExtensionConfig(section: string, value: any): Thenable<void> {
    // TODO: consider if we need to allow passing scope? YAGNI
    return baseExtensionConfig()
        .update(section, value, vscode.ConfigurationTarget.Workspace);
}

/**
 * @type {SanitizedUserConfig} sanitizedUserConfig
 */
export let globalSanitizedUserConfig: SanitizedUserConfig;

export function sanitizeUserConfig(): boolean {
    const workspaceConfig: vscode.WorkspaceConfiguration = baseExtensionConfig();
    const syncAutoStartInspect = workspaceConfig.inspect<boolean>('fileWatcher.enable');

    if (syncAutoStartInspect === undefined)
        throw Error('Cannot get `fileWatcher.enable` config');

    // Only accepts values from workspace or folder level configs
    const syncAutoStartVal: boolean = (syncAutoStartInspect.workspaceValue || syncAutoStartInspect.workspaceFolderValue || syncAutoStartInspect.defaultValue) ?? false;

    if (syncAutoStartInspect.globalValue) {
        showToast(
            `Warning: You have enabled the Bitburner file watcher in your global (user) settings, the extension will ignore this. \n It will default to workspace or folder settings instead.`,
            ToastType.Warning,
        );
    }

    globalSanitizedUserConfig = SanitizedUserConfig.make(
        workspaceConfig.get<string>('syncRoot') ?? "./dist/",
        workspaceConfig
            .get<string>(`client.authToken`)
            ?.replace(/^bearer/i, ``)
            .trim() ?? '',
        workspaceConfig.get<boolean>('showPushSuccessNotification') ?? false,
        workspaceConfig.get<boolean>('fileWatcher.enable') ?? false,
        workspaceConfig.get<boolean>('fileWatcher.showEnabledNotification') ?? true,
        workspaceConfig.get<Array<string>>('fileWatcher.allowedFiletypes') ?? [],
        workspaceConfig.get<boolean>('fileWatcher.allowDeletingFiles') ?? false,
        workspaceConfig.get<number>('fileWatcher.port') ?? 12525,
        workspaceConfig.get<Array<string>>('fileWatcher.exclude') ?? [],
        workspaceConfig.get<boolean>('fileWatcher.verbose') ?? true,
        workspaceConfig.get<boolean>('fileWatcher.definitionFile.enabled') ?? false,
        workspaceConfig.get<string>('fileWatcher.definitionFile.location') ?? "./NetScriptDefinitions.d.ts",
        workspaceConfig.get<boolean>('fileWatcher.pushAllOnConnection') ?? false,
    );

    return syncAutoStartVal;
}

export function getSanitizedUserConfig(): SanitizedUserConfig {
    return globalSanitizedUserConfig;
}

export function baseWatchPath() {
    let basePath = primaryWorkspaceRoot();
    let scriptBase: string = globalSanitizedUserConfig.syncRoot;
    if (scriptBase.indexOf('.') === 0 && scriptBase.indexOf('/') === 1)
        scriptBase = scriptBase.slice(1);

    let resolvedPath = resolve(basePath + scriptBase);
    if (!existsSync(resolvedPath)) {
        try {
            mkdirSync(resolvedPath, { recursive: true });
        } catch (err) {
            if (isError(err) && err.code !== "EEXIST") {
                console.log(`Failed to create watch folder '${resolvedPath}' (${err.code})`);
                throw err;
            }
        }
    }

    return resolve(basePath + scriptBase);
}

export function baseWatchPaths() {
    let scriptBase: string = globalSanitizedUserConfig.syncRoot;
    if (scriptBase.indexOf('.') === 0 && scriptBase.indexOf('/') === 1)
        scriptBase = scriptBase.slice(1);

    return vscode.workspace.workspaceFolders
        ?.map((value) => {
            let resPath = resolve(value.uri.fsPath + scriptBase);
            return realpathSync(resPath);
        }).filter((path) => existsSync(path)) ?? [];
}
