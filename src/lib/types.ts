// This is the userinput configs from the vscode extension.
// It can be translated to the filesync server configs.
export class SanitizedUserConfig {
    constructor(
        public syncRoot: string,
        public showPushSuccessNotification: boolean,
        public showSyncEnabledNotification: boolean,
        public filewatchConfig: UserFileWatcherConfig,
    ) {}

    static make(
        syncRoot: string,
        showPushSuccessToast: boolean,
        showSyncEnabledNotification: boolean,
        fileWatcherEnabled: boolean,
        allowedFileTypes: Array<string>,
        allowDelete: boolean,
        port: number,
        exclude: Array<string>,
        verbose: boolean = true,
        defFileSyncOn: boolean,
        defFilePath: string,
        pushAllOnConnection: boolean,
    ) {
        return new SanitizedUserConfig(
            syncRoot,
            showPushSuccessToast,
            showSyncEnabledNotification,
            new UserFileWatcherConfig(
                fileWatcherEnabled,
                allowedFileTypes,
                allowDelete,
                port,
                exclude,
                verbose,
                defFileSyncOn,
                defFilePath,
                pushAllOnConnection,
            ),
        );
    }

    public toFilesyncConfig() {
        return {
            showPushSuccessNotification: this.showPushSuccessNotification,
            definitionFileSync: this.filewatchConfig.definitionSyncEnabled,
            allowDeletingFiles: this.filewatchConfig.allowDeletingFiles,
            pushAllOnConnection: this.filewatchConfig.pushAllOnConnection,
            allowedFiletypes: this.filewatchConfig.allowedFiletypes,
            verboseLog: this.filewatchConfig.verbose,
        };
    }
}

export class UserFileWatcherConfig {
    constructor (
        public enabled: boolean = false,
        public allowedFiletypes: Array<string> = [],
        public allowDeletingFiles: boolean = false,
        public port: number = 12525,
        public exclude: Array<string> = [],
        public verbose: boolean = true,
        public definitionSyncEnabled: boolean = false,
        public definitionLocation: string = "./NetScriptDefinitions.d.ts",
        public pushAllOnConnection: boolean = false,
    ) {}
}
