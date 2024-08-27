import * as vscode from 'vscode';
import { mkdir, existsSync, statSync, Stats, realpath, realpathSync, } from "node:fs";
import * as fg from "fast-glob";

import { baseWatchPath, baseWatchPaths, getSanitizedUserConfig } from "../lib/config";
import { isError } from "../lib/err";
import { default as signalInstance, } from '../signals-ts';
import { EventType } from './eventTypes';
import { FileEvent } from './interfaces';
import { realPcToGamePcPath, } from '../lib/paths';

let watchedFileList: Set<string> = new Set<string>;
let watchedFileStats: Map<string, Stats> = new Map<string, Stats>;
export let globalFileWatcher: vscode.FileSystemWatcher | null = null;

export function initFileWatcher(): void {
    let allowedFiletypes: Array<string> = getSanitizedUserConfig().filewatchConfig.allowedFiletypes;

    // We want the side-effect of this function ...
    baseWatchPath();
    let folderPaths = baseWatchPaths().join(`|`);
    let validExtensionString = allowedFiletypes.join(`,`);
    const fullWatcherPathGlob = `${folderPaths}/**/*{${validExtensionString}}`
        .replace(/[\\|/]+/g, `/`);
    // TODO: get the list of watched files here...
    watchedFileList = new Set(fg.globSync(fullWatcherPathGlob).map(watchedPath => realpathSync(watchedPath)));
    watchedFileStats = fileSetToMapStats(watchedFileList);

    // Create the new FS watcher...
    globalFileWatcher = vscode.workspace.createFileSystemWatcher(fullWatcherPathGlob);
    // Now build the callbacks that the file watcher responds to...
    globalFileWatcher.onDidCreate(function(eventUri) {
        console.log("File Created: " + eventUri);
        const eventFsPath = eventUri.fsPath;
        console.log(realpathSync(eventFsPath));
        if (!watchedFileList.has(eventFsPath)) {
            watchedFileList.add(eventFsPath);
            watchedFileStats.set(eventFsPath, statSync(eventFsPath));
        }

        const response: FileEvent = {
            realPath: eventUri.fsPath,
            gamePath: realPcToGamePcPath(eventUri),
        };
        signalInstance.emit(EventType.FileChanged, response);
    });
    globalFileWatcher.onDidDelete(function(eventUri) {
        const eventFsPath = eventUri.fsPath;
        if (watchedFileList.has(eventFsPath)) {
            watchedFileStats.delete(eventFsPath);
            watchedFileList.delete(eventFsPath);
        }

        const response: FileEvent = {
            realPath: eventUri.fsPath,
            gamePath: realPcToGamePcPath(eventUri),
        };
        signalInstance.emit(EventType.FileDeleted, response);
    });
    globalFileWatcher.onDidChange(function(eventUri) {
        const eventFsPath = eventUri.fsPath;
        let ogStat: Stats | null = null;
        if (watchedFileList.has(eventFsPath) && watchedFileStats.has(eventFsPath)) ogStat = watchedFileStats.get(eventFsPath) ?? null;
        if (!watchedFileList.has(eventFsPath) || !areStatsEqual(statSync(eventFsPath), ogStat)) {
            watchedFileList.add(eventFsPath);
            watchedFileStats.set(eventFsPath, statSync(eventFsPath));
            const response: FileEvent = {
                realPath: eventUri.fsPath,
                gamePath: realPcToGamePcPath(eventUri),
            };
            signalInstance.emit(EventType.FileChanged, response);
        }
    });
}

function areStatsEqual(statA: Stats, statB: Stats|null): boolean {
    return statA instanceof  Stats &&
            statB instanceof  Stats &&
            statA.size === statB.size &&
            statA.mtimeMs === statB.mtimeMs &&
            statA.ctimeMs === statB.ctimeMs &&
            statA.mode === statB.mode &&
            statA.ino === statB.ino;
}

export function createFileEventFromPath(fullPath: string): FileEvent {
    return {
        realPath: fullPath,
        gamePath: realPcToGamePcPath(vscode.Uri.parse(fullPath)),
    }
}

function fileSetToMapStats(inputSet: Set<string>) {
    // Create a new Map
    const fileStatsMap = new Map();
    inputSet.forEach(filePath => {
        try {
            // Get the stats object for the current file
            const stats = statSync(filePath);

            // Set the file path as the key and the stats as the value in the map
            fileStatsMap.set(filePath, stats);
        } catch (err) {
            if (isError(err))
                console.error(`Error reading stats for ${filePath}:`, err.message);

        }
    });

    return fileStatsMap;
}

export function disableFileWatcher() {
    if (globalFileWatcher !== null) {
        globalFileWatcher.dispose();
        globalFileWatcher = null;
        watchedFileList = new Set<string>;
        watchedFileStats = new Map<string, Stats>;
    }
}

export function isFileWatcherRunning(): boolean {
    return globalFileWatcher !== null;
}

export function getWatchedFilesList() {
    return watchedFileList;
}

export function getWatchedFileStats() {
    return watchedFileStats;
}
