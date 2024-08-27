/**
 * Type guard for {@code NodeJS.ErrnoException}.
 * @param err
 */
export function isError(err: unknown): err is NodeJS.ErrnoException {
    return (err as NodeJS.ErrnoException)?.code !== undefined;
}
