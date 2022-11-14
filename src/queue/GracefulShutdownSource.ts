import CancellationToken from "cancellationtoken";

export class GracefulShutdownSource {
    public readonly Token: CancellationToken;

    private readonly cancel: (reason?: any) => void;

    constructor(token: CancellationToken, cancel: (reason?: any) => void) {
        this.Token = token;
        this.cancel = cancel;

        process.on("SIGTERM", () => {
            this.Cancel("sigterm");
        });
    }

    public Cancel(reason?: string): void {
        this.cancel(reason);
    }
}