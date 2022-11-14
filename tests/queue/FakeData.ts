import { QueueItem } from "../../src/queue/QueueItem";

export class FakeData extends QueueItem {
    public readonly Data: string;

    constructor(data: string) {
        super();
        this.Data = data;
    }

    public static New(): FakeData {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return new FakeData(([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        ));
    }

    toString(): string {
        return this.Data;
    }
}