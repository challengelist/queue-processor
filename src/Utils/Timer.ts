import { IDisposable } from "./IDisposable";

export class Timer implements IDisposable {
    private readonly timeout: NodeJS.Timeout;

    constructor(timespan: number, func: () => void) {
        this.timeout = setTimeout(func, timespan);
    }

    dispose(): void {
        clearTimeout(this.timeout);
    }
}

export function Delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}