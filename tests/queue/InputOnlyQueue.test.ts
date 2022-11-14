import { equal } from "assert";
import CancellationToken from "cancellationtoken";
import { FakeData } from "./FakeData";
import { TestProcessor } from "./TestProcessor";

const processor: TestProcessor = new TestProcessor();

beforeEach(async () => {
    await processor.ClearQueue();
});

describe("Send then receive", () => {
    test("single", async () => {
        const { token, cancel } = CancellationToken.create();
        const obj = FakeData.New();

        let receivedObj: FakeData;

        processor.Received = o => {
            receivedObj = o;
            cancel();
        };

        await processor.Run(token, cancel);

        equal(obj.Data, receivedObj!.Data);
    });
});