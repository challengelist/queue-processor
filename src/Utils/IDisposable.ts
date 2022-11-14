export interface IDisposable {
    dispose(): void;
}

export async function using<T extends IDisposable>(resource: T, func: (resource: T) => void): Promise<void> {
    try {
        await func(resource);
    } finally {
        resource.dispose();
    }
}