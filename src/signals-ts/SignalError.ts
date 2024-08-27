class SignalError extends Error {}

export default function SignalErrorFactory(method: string, message: string) {
    return new SignalError(`.${method}: ${message}`);
};
