export class QueueConfiguration {
    /**
     * The queue to read from.
     */
    public InputQueueName: string = "default";

    /**
     * The time between polls, in case a poll returns no items.
     */
    public TimeBetweenPolls: number = 100;

    /**
     * The number of items allowed to be dequeued but not processed at one time.
     */
    public MaxInFlightItems: number = 100;

    /**
     * The number of times to re-queue a failed item for another attempt.
     */
    public MaxRetries: number = 3;

    /**
     * The maximum number of recent errors before exiting with an error.
     * Every error will increment an internal count, while every success will decrement it.
     */
    public ErrorThreshold: number = 10;

    /**
     * Setting above 1 will allow processing in batches.
     * @see QueueProcessor#ProcessBatch
     */
    public BatchSize: number = 1;

    constructor(props: any) {
        this.InputQueueName = props.InputQueueName ?? "default";
        this.TimeBetweenPolls = props.TimeBetweenPolls ?? 100;
        this.MaxInFlightItems = props.MaxInFlightItems ?? 100;
        this.MaxRetries = props.MaxRetries ?? 3;
        this.ErrorThreshold = props.ErrorThreshold ?? 10;
        this.BatchSize = props.BatchSize ?? 1;
    }
}