/**
 * An item to be managed by a {@link QueueProcessor}.
 */
export class QueueItem {
    /**
     * The number of times this item has been retried for processing.
     */
    public TotalRetries!: number;

    /**
     * Set to true if this item has failed. This will cause it to be retried.
     */
    public Failed!: boolean;

    /**
     * Tags which will be used for tracking a processed item.
     */
    public Tags!: string[];
}