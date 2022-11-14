// eslint-disable-next-line import/namespace
import { QueueConfiguration } from "../../src/queue/QueueConfiguration";
import { QueueProcessor } from "../../src/queue/QueueProcessor";
import { FakeData } from "./FakeData";

export class TestProcessor extends QueueProcessor<FakeData> {
    constructor() {
        super(new QueueConfiguration({
            InputQueueName: "test"
        }));
    }

    protected ProcessItem(item: FakeData): void {
        this.Received?.(item);
    }

    public Received?: (item: FakeData) => void;
}