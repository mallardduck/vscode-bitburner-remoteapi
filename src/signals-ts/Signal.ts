import SignalError from './SignalError.js';
import {
    isFunction,
    isString,
    isSymbol,
} from "./utils";

type ValidKey = string | number | symbol;

const isValidKey = function(value: any): value is ValidKey {
    return value !== null && isString(value) || Number.isFinite(value) || isSymbol(value);
};

type CallbackFunction = (...args: any[]) => void;
type EventMap = Map<ValidKey, Set<CallbackFunction>>;

class Signal {
    events: EventMap;

    constructor() {
        this.events = new Map<ValidKey, Set<CallbackFunction>>();
    }

    public on(name: string, fn: CallbackFunction) {
        if (!isValidKey(name)) throw SignalError('on', 'requires event name');
        if (!isFunction(fn)) throw SignalError('on', 'requires callback');

        const location = this.events;
        const fns = location.has(name) ? location.get(name)! : location.set(name, new Set()).get(name)!;
        fns.add(fn);

        return this;
    }

    public off(name: string, fn: CallbackFunction) {
        if (!isValidKey(name)) throw SignalError('off', 'requires event name');

        const location = this.events;

        if (!location.has(name)) return this;
        // remove single
        if (fn) {
            const fns = location.get(name);
            if (fns === undefined) throw SignalError("off", "fns are undefined...")

            // remove this function
            fns.has(fn) && fns.delete(fn);

            // check size and delete location if empty
            fns.size === 0 && location.delete(name);
            return this;
        }

        // remove all
        location.delete(name);
        return this;
    }

    public once(name: string, fn: CallbackFunction) {
        if (!isValidKey(name)) throw SignalError('once', 'requires an event name');
        if (!isFunction(fn)) throw SignalError('once', 'requires a function');

        // slow path the params...this is for flexibility
        // and since these are single calls, the depotimization
        // shouldn't be a concern
        const callback = (...parms: any[]) => {
            this.off(name, callback);
            fn(...parms);
        };

        return this.on(name, callback);
    }

    public emit(name: string, ...args: any[]) {
        if (!isValidKey(name)) throw SignalError('emit', 'requires an event name');

        const location = this.events;

        // nothing at the location
        if (!location.has(name)) return this;

        const fns = location.get(name);
        if (fns === undefined) throw SignalError("off", "fns are undefined...")
        // no events at the location
        if (!fns.size) return this;

        // we have an array of functions to call
        const numOfArgs = args.length;
        // fast path
        if (numOfArgs <= 2) {
            single(fns, args[0]);
            return this;
        }

        // prevent this function from being de-optimized
        // because of using the arguments:
        // http://reefpoints.dockyard.com/2014/09/22/javascript-performance-for-the-win.html
        // We only need the arguments after the event name
        let idx = 1;
        const argsArray = new Array(numOfArgs - 1);
        for (; idx < numOfArgs; idx += 1)
            argsArray[idx - 1] = args[idx];


        multiple(fns, argsArray);
        return this;
    }

    public listeners(name: string) {
        const location = this.events;

        // make sure to always send an array and clean any
        // references so that we cant mutate to undefined behavior

        if (name !== undefined) {
            return location.has(name) ?
                Array.from(location.get(name) as Set<CallbackFunction>) :
                [];
        }

        return Array.from(location.values())
            .map(set => Array.from(set))
            .flat();
    }

    public names() {
        const location = this.events;
        return Array.from(location.keys());
    }

    /**
     * Returns the number of listeners for the event.
     * When no name passed returns number of all listeners.
     * @param {null|string} name
     * @returns number
     */
    public size(name: string|null = null): number {
        const location = this.events;

        // make sure to always send an array and clean any
        // references so that we cant mutate to undefined behavior

        if (isValidKey(name)) {
            return location.has(name) ?
                (location.get(name) as Set<CallbackFunction>).size :
                0;
        }

        return Array.from(location.values())
            .reduce((memo, set) => memo + set.size, 0);
    }


    /**
     * Forcefully clear listeners on the given `name`.
     * When no name is passed it will clear all events.
     * @param {null|string} name
     * @returns Signal
     */
    public clear(name: string|null = null): Signal {
        const location = this.events;

        if (isValidKey(name) && location.has(name)) {
            (location.get(name) as Set<CallbackFunction>).clear();
            return this;
        }

        this.events.clear();
        return this;
    }

    public addListener = this.on;
    public subscribe = this.on;
    public bind = this.on;
    public removeListender = this.off;
    public unsubscribe = this.off;
    public unbind = this.off;
    public trigger = this.emit;
    public dispatch = this.emit;
}

export default Signal;

export const multiple = (fns: Set<CallbackFunction>, args: any[]) => {
    for (const fn of fns) fn(...args);
};

export const single = (fns: Set<CallbackFunction>, arg: any[]) => {
    for (const fn of fns) fn(arg);
};
