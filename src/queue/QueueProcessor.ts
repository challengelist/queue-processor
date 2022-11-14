import CancellationToken from "cancellationtoken";
import { using } from "../Utils/IDisposable";
import { Timer } from "../Utils/Timer";
import { GracefulShutdownSource } from "./GracefulShutdownSource";
import { QueueConfiguration } from "./QueueConfiguration";
import { QueueItem } from "./QueueItem";
import { createClient } from "redis";

export abstract class QueueProcessor<T extends QueueItem> {
    /**
     * The total queue items processed since startup
     */
    public get TotalProcessed(): number {
        return this.totalProcessed;
    }

    /**
     * The total queue items dequeued since startup.
     */
    public get TotalDequeued(): number {
        return this.totalDequeued;
    }

    /**
     * The total errors encountered processing items since startup.
     * Note that this may include more than one error from the same queue item failing multiple times.
     */
    public get TotalErrors(): number {
        return this.totalErrors;
    }

    /**
     * The name of this queue, as provided by {@link QueueConfiguration}
     */
    public readonly QueueName: string;

    private readonly config: QueueConfiguration;

    private readonly redis = createClient({
        url: "redis://:@localhost:6379"
    });

    private totalProcessed: number = 0;
    private totalDequeued: number = 0;
    private totalErrors: number = 0;
    private consecutiveErrors: number = 0;

    private get totalInFlight(): number {
        return this.totalDequeued - this.totalProcessed - this.totalErrors;
    }

    protected constructor(config: QueueConfiguration) {
        this.config = config;

        this.redis.on("error", e => {
            console.log(`ERROR [redis]: ${e}`);
        });

        (async () => {
            await this.redis.connect();
        })();

        const queue_prefix: string = "cl-queue:";
        this.QueueName = `${queue_prefix}${config.InputQueueName}`;
    }

    public async Run(token: CancellationToken, cancel: (reason?: any) => void): Promise<void> {
        using(new Timer(5000, async () => { await this.outputStats(); }), async () => {
            new GracefulShutdownSource(token, cancel);

            while (!token.isCancelled) {
                if (this.consecutiveErrors > this.config.ErrorThreshold) {
                    console.log("Error threshold exceeded, shutting down");
                    break;
                }

                try {
                    if (this.totalInFlight >= this.config.MaxInFlightItems || this.consecutiveErrors > this.config.ErrorThreshold) {
                        await this.delay(this.config.TimeBetweenPolls);
                        continue;
                    }

                    const redisItems = await this.redis.rPopCount(this.QueueName, this.config.BatchSize);

                    // eslint-disable-next-line eqeqeq
                    if (redisItems == null) {
                        await this.delay(this.config.TimeBetweenPolls);
                        continue;
                    }

                    const items: T[] = [];

                    for (const redisItem of redisItems) {
                        // eslint-disable-next-line eqeqeq
                        if (redisItem == null || redisItem == "")
                            continue;

                        items.push(JSON.parse(redisItem));
                    }

                    if (items.length === 0) {
                        await this.delay(this.config.TimeBetweenPolls);
                        continue;
                    }

                    this.totalDequeued += items.length;
                    
                    new Promise(() => this.ProcessBatch(items)).then(() => {
                        for (const item of items) {
                            if (item.Failed) {
                                this.totalErrors++;
                                this.consecutiveErrors++;

                                console.log(`Error processing ${item}`);
                                this.attemptRetry(item);
                            } else {
                                this.totalProcessed++;
                                this.consecutiveErrors = 0;
                            }
                        }
                    });
                } catch (e) {
                    this.consecutiveErrors++;
                    console.log(`Error dequeuing from queue: ${e}`);
                }
            }

            console.log("Shutting down...");

            while (this.totalInFlight > 0) {
                console.log(`Waiting for remaining ${this.totalInFlight} in-flight items...`);
                await this.delay(5000);
            }

            console.log("shutdown complete.");
        });

        await this.outputStats();
        await this.redis.disconnect();
    }

    private delay(time: number) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    private async attemptRetry(item: T): Promise<void> {
        item.Failed = false;

        if (item.TotalRetries++ < this.config.MaxRetries) {
            console.log(`Re-queueing for attempt ${item.TotalRetries} / ${this.config.MaxRetries}`);
            await this.PushItemToQueue(item);
        } else {
            console.log("Attempts exhausted; dropping item");
        }
    }

    public async PushItemToQueue(item: T): Promise<void> {
        await this.redis.lPush(this.QueueName, JSON.stringify(item));
    }

    public async PushItemsToQueue(item: T[]): Promise<void> {
        await this.redis.lPush(this.QueueName, item.map((i) => {
            return JSON.stringify(i);
        }));
    }

    public async GetQueueSize(): Promise<number> {
        return await this.redis.lLen(this.QueueName);
    }

    public async ClearQueue(): Promise<void> {
        await this.redis.del(this.QueueName);
    }

    private async outputStats(): Promise<void> {
        // console.log(`stats: queue:${await this.GetQueueSize()} inflight:${this.totalInFlight} dequeued:${this.totalDequeued} processed:${this.totalProcessed} errors:${this.totalErrors}`);
    }

    protected abstract ProcessItem(item: T): void;

    protected ProcessBatch(items: T[]): void {
        for (const item of items)
            this.ProcessItem(item);
    }
}