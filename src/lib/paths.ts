import * as vscode from 'vscode';
import { getWatchedFileStats } from '../bb-filesync/file-watcher';
import { baseWatchPaths } from './config';

export function primaryWorkspaceRoot(): string {
    if (vscode.workspace.workspaceFolders === undefined)
        throw Error("Cannot get base workspace dir...")

    return vscode.workspace.workspaceFolders[0].uri.fsPath;
}

export function realPcToGamePcPath(fullPath: vscode.Uri): string {
    const workspaceDirs = baseWatchPaths();
    for (const dirIndex in workspaceDirs) {
        const currentDir: string = workspaceDirs[dirIndex];
        if (fullPath.fsPath.includes(currentDir))
            return fullPath.fsPath.slice(currentDir.length).replaceAll('\\', '/');
    }

    throw Error("Cannot find workspace directory root.")
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
