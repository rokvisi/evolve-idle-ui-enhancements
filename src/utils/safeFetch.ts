import { type SafeTryErrorResult, type SafeTryResult, type SafeTryResultFromAsyncFunction } from '$src/utils/safeTry';
import { type InferOutput, type GenericSchema, ValiError, parse } from 'valibot';
import * as v from 'valibot';

export function flattenValibotError(err: v.ValiError<any>) {
    const flattenedIssues = v.flatten(err.issues);
    const result = [];

    // Add root issues.
    const rootIssues = flattenedIssues.root?.flatMap((i) => `root: ${i}`);
    if (rootIssues) result.push(...rootIssues);

    // Add field (nested) issues.
    if (flattenedIssues.nested) {
        const nestedIssues = Object.entries(flattenedIssues.nested).map(([key, issues]) => {
            return `'${key}': ${issues?.flatMap((i) => i)}`;
        });

        result.push(...nestedIssues);
    }

    // Add other issues.
    const otherIssues = flattenedIssues.other?.flatMap((i) => `other: ${i}`);
    if (otherIssues) result.push(...otherIssues);

    // Return all as a single string.
    return result.join('\n');
}

function makeErrorCreationHelper(input: RequestInfo | URL, init: RequestInit | undefined, baseErrorName: string) {
    return (cause: string): SafeTryErrorResult => ({
        result: null,
        error: new Error(`${init?.method ?? 'GET'} "${input.toString()}" - ${baseErrorName}.`, {
            cause,
        }),
    });
}

export async function safeFetch(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<SafeTryResultFromAsyncFunction<typeof fetch>> {
    // Cleaner error creation with additional info.
    const createErrorResult = makeErrorCreationHelper(input, init, 'failed to fetch');

    // Fetch the response.
    try {
        //? 'fetch' throws 'TypeError' on network errors or invalid response headers (CORS included).
        const response = await fetch(input, init);
        if (!response.ok) {
            return createErrorResult(
                `Response ${response.status}${response.statusText ? ` - ${response.statusText}.` : '.'}`
            );
        }

        return { result: response, error: null };
    } catch (err) {
        if (err instanceof TypeError) {
            return createErrorResult('Network error or invalid response headers (CORS included).');
        }

        // Unknown error - Realistically should never happen.
        return createErrorResult(
            `Unknown error during 'fetch()' (shouldn't happen - investigate). Details: '${JSON.stringify(err)}'.`
        );
    }
}

export async function safeFetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<SafeTryResult<unknown>> {
    // Cleaner error creation with additional info.
    const createErrorResult = makeErrorCreationHelper(input, init, 'failed to parse JSON');

    // Safe fetch the response.
    const { result: response, error } = await safeFetch(input, init);
    if (error) {
        return { result: null, error };
    }

    // Parse the response json.
    try {
        //? 'response.json()' throws:
        //? - 'SyntaxError': The response body cannot be parsed as JSON.
        //? - 'TypeError':
        //?     * "The response body is disturbed or locked."
        //?     * "There was an error decoding the body content"
        //? - 'DOMException': The request was aborted.
        const json = await response.json();

        return { result: json as unknown, error: null };
    } catch (err) {
        // '.json()' failed due to 'TypeError'.
        if (err instanceof TypeError) {
            // '.json()' failed to parse the response body because it was locked or disturbed.
            // Should not happen because we're only reading the json once and without a stream.
            if (err.message.startsWith("Failed to execute 'json' on 'Response'")) {
                return createErrorResult('The response body is disturbed or locked.');
            }

            // '.json()' could fail because "There was an error decoding the body content".
            // Couldn't find a way to reproduce this error to add any better identification or handling.
            return createErrorResult(
                `There was an error decoding the body content (MAYBE - investigate). Details: '${JSON.stringify(err)}'`
            );
        }

        // '.json()' failed to parse the response body.
        if (err instanceof SyntaxError) {
            return createErrorResult('The response body cannot be parsed as JSON.');
        }

        // '.json()' request was aborted.
        if (err instanceof DOMException) {
            return createErrorResult('The request was aborted.');
        }

        // Unknown error - Realistically should never happen.
        return createErrorResult(
            `Unknown error during '.json()' (shouldn't happen - investigate). Details: '${JSON.stringify(err)}'.`
        );
    }
}

// export type SafeTrySuccessResult<T extends GenericAsyncFunction> = { result: Awaited<ReturnType<T>>; error: null };
export async function safeFetchJsonSchema<Schema extends GenericSchema>(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    schema: Schema
): Promise<SafeTryResult<InferOutput<Schema>>> {
    // Cleaner error creation with additional info.
    const createErrorResult = makeErrorCreationHelper(input, init, 'JSON did not match the schema');

    // Safe fetch the json.
    const { result: json, error } = await safeFetchJson(input, init);
    if (error) {
        return { result: null, error };
    }

    // Validate the JSON against the schema.
    try {
        //? 'v.parse()' only throws a 'ValiError' if the JSON does not match the schema.
        const parsedSchema = parse(schema, json);

        return { result: parsedSchema, error: null };
    } catch (err) {
        // Response JSON did not match the schema.
        if (err instanceof ValiError) {
            return createErrorResult(flattenValibotError(err));
        }

        return createErrorResult(
            `Unknown error during schema validation (shouldn't happen - investigate). Details: '${JSON.stringify(err)}'.`
        );
    }
}
