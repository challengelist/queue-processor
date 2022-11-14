import * as crypto from "crypto";
import { QueueItem } from "../../src/queue/QueueItem";

export class FakeData extends QueueItem {
    public readonly Data: string;

    constructor(data: string) {
        super();
        this.Data = data;
    }

    public static New(): FakeData {
        return new FakeData(crypto.randomBytes(16).toString("hex"));
    }

    toString(): string {
        return this.Data;
    }
}