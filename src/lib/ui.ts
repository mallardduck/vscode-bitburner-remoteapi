import * as vscode from 'vscode';

export enum ToastType {
    Information = 'information',
    Warning = 'warning',
    Error = 'error',
}

function toastTypeCallback(type: ToastType) {
    switch(type) {
        case ToastType.Information:
            return vscode.window.showInformationMessage;
        case ToastType.Warning:
            return vscode.window.showWarningMessage;
        case ToastType.Error:
            return vscode.window.showErrorMessage;
    };
}

/**
 * Show a toast/notification to the user.
 * @param {string} message The message to be in the toast
 * @param {ToastType} toastType The type of toast we are wanting to issue, defaults to 'information' if not provided
 * @param {{ forceShow: boolean }} opts Optional toast options
 */
export const showToast = (
    message: string,
    toastType: ToastType = ToastType.Information,
    toastOpts: vscode.MessageOptions|null = null
): Thenable<string|undefined>|undefined => {
    if (toastOpts !== null)
        return toastTypeCallback(toastType)("[BitburnerExt] " + message, toastOpts);

    return toastTypeCallback(toastType)("[BitburnerExt] " + message);
};
