import { QueueConfiguration } from "../../src/queue/QueueConfiguration";
import { QueueProcessor } from "../../src/queue/QueueProcessor";
import { FakeData } from "./FakeData";

export class TestBatchProcessor extends QueueProcessor<FakeData> {
    constructor() {
        super(new QueueConfiguration({
            InputQueueName: "test-batch",
            BatchSize: 5
        }));
    }

    protected ProcessBatch(items: FakeData[]): void {
        for (const item of items)
            this.Received?.(item);
    }

    public Received?: (item: FakeData) => void;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected ProcessItem(item: FakeData): void {
    }
}