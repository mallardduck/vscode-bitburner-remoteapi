import * as vscode from 'vscode';
import { resolve } from 'path';
import { existsSync, mkdirSync, realpathSync } from 'node:fs';

import { isError } from './err';
import { getSanitizedUserConfig, } from './config';
import { getWatchedFileStats } from '../bb-filesync/file-watcher';

export function primaryWorkspaceRoot(): string {
    if (vscode.workspace.workspaceFolders === undefined)
        throw Error("Cannot get base workspace dir...")

    return vscode.workspace.workspaceFolders[0].uri.fsPath;
}

export function baseWatchPath() {
    let basePath = primaryWorkspaceRoot();
    let scriptBase: string = getSanitizedUserConfig().syncRoot;
    if (scriptBase.indexOf('.') === 0 && scriptBase.indexOf('/') === 1)
        scriptBase = scriptBase.slice(1);

    let resolvedPath = resolve(basePath + scriptBase);
    if (!existsSync(resolvedPath)) {
        try {
            mkdirSync(resolvedPath, { recursive: true });
        } catch (err) {
            if (isError(err) && err.code !== "EEXIST") {
                console.error(`Failed to create watch folder '${resolvedPath}' (${err.code})`);
                throw err;
            }
        }
    }

    return resolve(basePath + scriptBase);
}

export function baseWatchPaths() {
    let scriptBase: string = getSanitizedUserConfig().syncRoot;
    if (scriptBase.indexOf('.') === 0 && scriptBase.indexOf('/') === 1)
        scriptBase = scriptBase.slice(1);

    return vscode.workspace.workspaceFolders
        ?.map((value) => {
            let resPath = resolve(value.uri.fsPath + scriptBase);
            return realpathSync(resPath);
        }).filter((path) => existsSync(path)) ?? [];
}



/**
 * Get the URI of the currently opened file
 * @returns The file path of the currently open file
 */
export function getCurrentOpenDocURI() {
    return vscode.window.activeTextEditor?.document.uri;
}

export function isValidGameFile(filePath: string): boolean {
    const baseWatchedPaths = baseWatchPaths();
    for(const pathIdx in baseWatchedPaths) {
        const basePathValue = baseWatchedPaths[pathIdx];
        if (filePath.startsWith(basePathValue))
            return true;
    }

    return false;
}

export function realPcToGamePcPath(fullPath: vscode.Uri): string {
    const baseWorkspaceDir = baseWatchPath();
    const workspaceDirs = baseWatchPaths();
    for (const dirIndex in workspaceDirs) {
        const currentDir: string = workspaceDirs[dirIndex];
        if (fullPath.fsPath.includes(currentDir))
            return fullPath.fsPath.slice(currentDir.length).replaceAll('\\', '/');
    }

    if (!fullPath.fsPath.includes(baseWorkspaceDir))
        throw Error("Cannot find workspace directory root for file `" + fullPath.fsPath + "`.")

    return fullPath.fsPath.slice(baseWorkspaceDir.length).replaceAll('\\', '/');
}

export function gamePcToRealPcPath(gamePath: string): string {
    const possibleMatches = new Set<string>();
    getWatchedFileStats().forEach((value, key) => {
        if (key.endsWith(gamePath))
            possibleMatches.add(key);
    });

    let longestMatch: string = '';
    possibleMatches.forEach((value: string) => {
        if (value.length > longestMatch.length) longestMatch = value;
    });
    if (longestMatch === '') throw Error("Couldn't find longest match...")

    return longestMatch;
}
