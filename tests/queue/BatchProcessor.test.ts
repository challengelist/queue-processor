import CancellationToken from "cancellationtoken";
import { Delay } from "../../src/Utils/Timer";
import { FakeData } from "./FakeData";
import { TestBatchProcessor } from "./TestBatchProcessor";

const processor: TestBatchProcessor = new TestBatchProcessor();

beforeEach(async () => {
    await processor.ClearQueue();
});

test("Process Empty Queue", async () => {
    const { token, cancel } = CancellationToken.create();
    await processor.Run(token, cancel);
});

describe("Send then receive", () => {
    test("single", async () => {
        const {token, cancel} = CancellationToken.create();
        const obj = FakeData.New();

        let receivedObj: FakeData;

        await processor.PushItemToQueue(obj);

        processor.Received = o => {
            receivedObj = o;
            cancel();
        };

        await processor.Run(token, cancel);

        expect(receivedObj!.Data).toEqual(obj.Data);
    });

    test("multiple", async () => {
        const send_count = 20;
        const {token, cancel} = CancellationToken.create();

        const objects: FakeData[] = [];
        for (let i = 0; i < send_count; i++) {
            objects.push(FakeData.New());
        }

        const receivedObjects: FakeData[] = [];

        for (const obj of objects) {
            await processor.PushItemToQueue(obj);
        }

        processor.Received = o => {
            receivedObjects.push(o);

            if (receivedObjects.length === objects.length)
                cancel();
        };

        await processor.Run(token, cancel);

        expect(receivedObjects.map(o => {
            return o.Data;
        })).toEqual(objects.map(o => {
            return o.Data;
        }));
    });

    test("multiple using single call", async () => {
        const send_count = 20;
        const {token, cancel} = CancellationToken.create();

        const objects: FakeData[] = [];
        for (let i = 0; i < send_count; i++) {
            objects.push(FakeData.New());
        }

        const receivedObjects: FakeData[] = [];
        await processor.PushItemsToQueue(objects);

        processor.Received = o => {
            receivedObjects.push(o);

            if (receivedObjects.length === objects.length)
                cancel();
        };

        await processor.Run(token, cancel);

        expect(receivedObjects.map(o => {
            return o.Data;
        })).toEqual(objects.map(o => {
            return o.Data;
        }));
    });
});

test("Ensure cancelling does not lose items", async () => {
    const inFlightObjects: FakeData[] = [];

    let processed = 0;
    let sent = 0;

    const run_count = 5;

    processor.Received = o => {
        inFlightObjects.splice(inFlightObjects.indexOf(o), 1);
        processed++;
    };

    for (let i = 0; i < run_count; i++) {
        const {token, cancel} = CancellationToken.create();

        // eslint-disable-next-line no-async-promise-executor
        const sendTask = new Promise<void>(async (res) => {
            while (!token.isCancelled) {
                const obj = FakeData.New();

                await processor.PushItemToQueue(obj);
                inFlightObjects.push(obj);

                sent++;
            }

            res();
        });

        while (inFlightObjects.length < 1000)
            await Delay(100);

        // eslint-disable-next-line no-async-promise-executor
        const receiveTask = new Promise<void>(async (res) => {
            await processor.Run(token, cancel);

            res();
        });

        await Delay(1000);

        cancel();

        await sendTask;
        await receiveTask;

        console.log(`Sent: ${sent} In-flight: ${inFlightObjects.length} Processed: ${processed}`);
    }

    const { token, cancel } = CancellationToken.create();

    processor.Received = o => {
        inFlightObjects.splice(inFlightObjects.indexOf(o), 1);
        processed++;

        if (inFlightObjects.length === 0)
            cancel();
    };

    await processor.Run(token, cancel);

    expect(inFlightObjects.length).toBe(0);
    expect(await processor.GetQueueSize()).toBe(0);

    console.log(`Sent: ${sent} In-flight: ${inFlightObjects.length} Processed: ${processed}`);
});