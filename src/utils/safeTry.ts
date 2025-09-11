import { toast } from 'svelte-sonner';

type GenericAsyncFunction = (...args: any[]) => Promise<any>;
type AwaitedReturn<T extends GenericAsyncFunction> = Awaited<ReturnType<T>>;

export type SafeTrySuccessResult<ResultT> = { result: ResultT; error: null };
export type SafeTryErrorResult = { result: null; error: Error };
export type SafeTryResult<ResultT> = SafeTrySuccessResult<ResultT> | SafeTryErrorResult;
export type SafeTryResultFromAsyncFunction<T extends GenericAsyncFunction> = SafeTryResult<AwaitedReturn<T>>;

export async function safeTry<FuncT extends GenericAsyncFunction>(
    fn: FuncT
): Promise<SafeTryResultFromAsyncFunction<FuncT>> {
    try {
        const result = await fn();

        return { result, error: null };
    } catch (error) {
        if (error instanceof Error) {
            return { result: null, error };
        }

        return { result: null, error: new Error(JSON.stringify(error)) };
    }
}

// Converts a function that returns a SafeTryResult into a Promise that either resolves with the result or rejects with the error.
// Useful for integrating with APIs that expect Promises.
export async function safeTryIntoPromise<ResultT>(fn: () => Promise<SafeTryResult<ResultT>>): Promise<ResultT> {
    return new Promise(async (resolve, reject) => {
        const { result, error } = await fn();
        if (error) {
            reject(error);
            return;
        }

        resolve(result);
    });
}

// Requires the svelte-sonner Toaster to be mounted in the app.
// Wraps a function that returns a SafeTryResult and shows toast notifications for loading, success, and error states.
export async function safeTryWithToast<ResultT>(
    func: () => Promise<SafeTryResult<ResultT>>,
    data: Parameters<typeof toast.promise<ResultT>>[1]
) {
    const promise = safeTryIntoPromise(func);
    toast.promise(promise, data);
    return await safeTry(() => promise);
}
