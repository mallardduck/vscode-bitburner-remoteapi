import * as vscode from 'vscode';
import { showToast, ToastType, } from "./ui";
import { SanitizedUserConfig } from './types';

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
        workspaceConfig.get<boolean>('showPushSuccessNotification') ?? false,
        workspaceConfig.get<boolean>('showSyncEnabledNotification') ?? true,
        workspaceConfig.get<boolean>('fileWatcher.enable') ?? false,
        workspaceConfig.get<Array<string>>('fileWatcher.allowedFiletypes') ?? [],
        workspaceConfig.get<boolean>('fileWatcher.allowDeletingFiles') ?? false,
        workspaceConfig.get<number>('fileWatcher.port') ?? 12525,
        workspaceConfig.get<Array<string>>('fileWatcher.exclude') ?? [],
        workspaceConfig.get<boolean>('fileWatcher.verbose') ?? true,
        workspaceConfig.get<boolean>('fileWatcher.definitionFile.enabled') ?? false,
        workspaceConfig.get<string>('fileWatcher.definitionFile.location') ?? "./NetscriptDefinitions.d.ts",
        workspaceConfig.get<boolean>('fileWatcher.pushAllOnConnection') ?? false,
    );

    return syncAutoStartVal;
}

export function getSanitizedUserConfig(): SanitizedUserConfig {
    return globalSanitizedUserConfig;
}
