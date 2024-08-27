"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.loadConfig = loadConfig;
var convict_1 = require("convict");
var fs_1 = require("fs");
// Define a schema
exports.config = (0, convict_1.default)({
    allowedFiletypes: {
        doc: "Filetypes that are synchronized to the game.",
        format: "Array",
        default: [".js", ".script", ".txt"],
    },
    allowDeletingFiles: {
        doc: "Allow deleting files in game if they get deleted off disk.",
        format: "Boolean",
        default: false,
        arg: "allowDeletingFiles",
    },
    port: {
        doc: "The port to bind to.",
        format: "Number",
        default: 12525,
        env: "BB_PORT",
        arg: "port",
    },
    scriptsFolder: {
        doc: "The to be synchronized folder.",
        format: "String",
        default: ".",
        env: "BB_SCRIPTFOLDER",
        arg: "folder",
    },
    exclude: {
        doc: "A list of folders or files to exclude from the sync.",
        format: "Array",
        default: [".vscode", ".idea", ".github"],
    },
    quiet: {
        doc: "Log less internal events to stdout.",
        format: "Boolean",
        env: "BB_VERBOSE",
        default: false,
        arg: "quiet",
    },
    dry: {
        doc: "Only print the files to be synchronised.",
        format: "Boolean",
        env: "BB_DRY",
        default: false,
        arg: "dry",
    },
    definitionFile: {
        update: {
            doc: "Automatically pull the definition file from the game.",
            format: "Boolean",
            env: "BB_UPDATE_DEF",
            default: false,
        },
        location: {
            doc: "Location/name of where the definition file gets placed.",
            format: "String",
            env: "BB_LOCATION_DEF",
            default: "./NetScriptDefinitions.d.ts",
        },
    },
    pushAllOnConnection: {
        doc: "Push all files when initial connection is made.",
        format: "Boolean",
        env: "BB_CON_PUSH",
        default: false,
        arg: "pushAllOnConnection",
    },
});
function loadConfig() {
    var configFile = "filesync.json";
    if ((0, fs_1.existsSync)(configFile)) {
        try {
            exports.config.loadFile(configFile);
        }
        catch (e) {
            throw new Error("Unable to load configuration file at ".concat(configFile, ": ").concat(e));
        }
    }
    else if (!exports.config.get("quiet")) {
        console.log("No configuration file found.");
    }
    // Perform validation
    exports.config.validate({ allowed: "strict" });
}
