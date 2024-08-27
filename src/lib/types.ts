// This is the userinput configs from the vscode extension.
// It can be translated to the filesync server configs.
export class SanitizedUserConfig {
    constructor(
        public syncRoot: string,
        public client: UserClientConfig,
        public showFileWatcherEnabledNotification: boolean,
        public filewatchConfig: UserFileWatcherConfig,
        public showPushSuccessNotification: boolean,
    ) {}

    static make(
        syncRoot: string,
        authToken: string,
        showPushSuccessToast: boolean,
        fileWatcherEnabled: boolean,
        showFileWatchStartedToast: boolean,
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
            new UserClientConfig(authToken),
            showFileWatchStartedToast,
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
            showPushSuccessToast,
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

export class UserClientConfig {
    constructor (
        public authToken: string,
    ) {}
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
