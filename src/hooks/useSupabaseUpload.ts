"use client";

import { useState, useRef, useCallback } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PROJECT_ID = SUPABASE_URL.replace("https://", "").split(".")[0];
const TUS_ENDPOINT = `https://${PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;

// tus-js-client's browser XHR stack does not set xhr.timeout. A hanging TCP
// connection (server accepts but never responds) will freeze isUploading=true
// forever. This timeout covers both the getSession() await and the TUS
// POST/PATCH requests. 90 s is generous for a product image ≤5 MB.
const UPLOAD_TIMEOUT_MS = 90_000;

interface UseSupabaseUploadOptions {
    bucket: string;
    onSuccess?: (publicUrl: string) => void;
    onError?: (error: Error) => void;
}

interface UploadState {
    progress: number;
    isUploading: boolean;
    error: string | null;
}

export function useSupabaseUpload({ bucket, onSuccess, onError }: UseSupabaseUploadOptions) {
    const [state, setState] = useState<UploadState>({
        progress: 0,
        isUploading: false,
        error: null,
    });

    const uploadRef = useRef<tus.Upload | null>(null);

    // Generation counter — incremented at the start of every upload() call and
    // inside abort(). Every async callback closes over `gen` and drops itself
    // if a newer generation has started by the time it fires.
    const uploadGenRef = useRef(0);

    // Tracks the active hang-guard timeout so it can be cancelled on success,
    // error, abort, or when a new upload supersedes the current one.
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Callbacks are stored in refs so TUS closures always call the latest
    // version without being listed in useCallback deps.
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;

    // Singleton Supabase client — recreating it inside useCallback deps caused
    // an infinite re-render loop.
    const supabaseRef = useRef(createClient());

    // Internal helper: clear the active timeout safely.
    const clearUploadTimeout = useCallback(() => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const upload = useCallback(
        async (file: File, path: string) => {
            // ── Step 1: Advance generation BEFORE aborting. ──────────────────────
            // tus-js-client v4's _emitError is suppressed once _aborted=true, but
            // we advance gen first as a defence-in-depth guard against any edge
            // where a callback might slip through before _aborted is set.
            const gen = ++uploadGenRef.current;

            // Cancel the previous hang-guard timeout so it can't fire for this
            // generation and confuse state owned by the new upload.
            clearUploadTimeout();

            // Abort any in-flight TUS upload. .catch() silences unhandled
            // rejections if the server-side DELETE fails (e.g. network error or
            // upload not yet registered on the server).
            if (uploadRef.current) {
                uploadRef.current.abort(true).catch(() => {});
                uploadRef.current = null;
            }

            setState({ progress: 0, isUploading: true, error: null });

            // ── Step 2: Arm the hang-guard timeout. ───────────────────────────────
            // Covers two separate hang points:
            //   a) getSession() awaiting a slow/unreachable Supabase auth endpoint.
            //   b) TUS POST (create upload resource) or PATCH (send data) hanging
            //      on a dead TCP connection — tus-js-client sets no xhr.timeout.
            // When the timer fires it aborts any live TUS upload, advances gen to
            // suppress stale callbacks, resets UI state, and fires onError.
            timeoutRef.current = setTimeout(() => {
                if (gen !== uploadGenRef.current) return; // superseded, no-op

                // Advance gen so any in-flight TUS callback is dropped after this.
                uploadGenRef.current++;
                if (uploadRef.current) {
                    uploadRef.current.abort(true).catch(() => {});
                    uploadRef.current = null;
                }
                setState({ progress: 0, isUploading: false, error: "Upload timed out" });
                onErrorRef.current?.(
                    new Error("Upload timed out. Please check your connection and try again."),
                );
            }, UPLOAD_TIMEOUT_MS);

            const supabase = supabaseRef.current;

            try {
                // getSession() only reads the cached JWT — no server round-trip
                // unless the token needs refreshing. The hang-guard above covers
                // the case where a refresh stalls indefinitely.
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error("Not authenticated. Please log in again.");
                }

                // Guard the async gap between getSession() resolving and TUS
                // starting. If the user selected a second file (or clicked Cancel)
                // while getSession() was in-flight, bail out cleanly.
                if (gen !== uploadGenRef.current) {
                    clearUploadTimeout();
                    return;
                }

                return new Promise<string>((resolve, reject) => {
                    const tusUpload = new tus.Upload(file, {
                        endpoint: TUS_ENDPOINT,
                        retryDelays: [0, 1000, 3000, 5000],
                        headers: {
                            authorization: `Bearer ${session.access_token}`,
                            "x-upsert": "true",
                        },
                        uploadDataDuringCreation: true,
                        removeFingerprintOnSuccess: true,
                        metadata: {
                            bucketName: bucket,
                            objectName: path,
                            contentType: file.type,
                            cacheControl: "3600",
                        },
                        chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6 MB chunks
                        onError: (err) => {
                            // Always clear the timeout on terminal events, even for stale
                            // uploads — the timeout belongs to the active gen so clearing
                            // it when gen mismatches is safe (the new upload set its own).
                            if (gen !== uploadGenRef.current) {
                                clearUploadTimeout();
                                return;
                            }
                            clearUploadTimeout();
                            const error = err instanceof Error ? err : new Error(String(err));
                            setState({ progress: 0, isUploading: false, error: error.message });
                            onErrorRef.current?.(error);
                            reject(error);
                        },
                        onProgress: (bytesUploaded, bytesTotal) => {
                            if (gen !== uploadGenRef.current) return;
                            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                            setState((prev) => ({ ...prev, progress: percentage }));
                        },
                        onSuccess: () => {
                            if (gen !== uploadGenRef.current) {
                                clearUploadTimeout();
                                return;
                            }
                            clearUploadTimeout();
                            const {
                                data: { publicUrl },
                            } = supabase.storage.from(bucket).getPublicUrl(path);
                            setState({ progress: 100, isUploading: false, error: null });
                            onSuccessRef.current?.(publicUrl);
                            resolve(publicUrl);
                        },
                    });

                    uploadRef.current = tusUpload;

                    // Skip fingerprint lookup for files that fit in a single chunk —
                    // the extra round-trip adds latency for typical product images.
                    if (file.size > 6 * 1024 * 1024) {
                        tusUpload.findPreviousUploads().then((previousUploads) => {
                            if (gen !== uploadGenRef.current) return;
                            if (previousUploads.length) {
                                tusUpload.resumeFromPreviousUpload(previousUploads[0]);
                            }
                            tusUpload.start();
                        });
                    } else {
                        tusUpload.start();
                    }
                });
            } catch (err: any) {
                if (gen !== uploadGenRef.current) {
                    clearUploadTimeout();
                    return;
                }
                clearUploadTimeout();
                const error = err instanceof Error ? err : new Error(String(err));
                setState({ progress: 0, isUploading: false, error: error.message });
                onErrorRef.current?.(error);
                throw error;
            }
        },
        [bucket, clearUploadTimeout],
    );

    const abort = useCallback(() => {
        // Clear the hang-guard before advancing gen — if the timeout fired in
        // the same JS turn (impossible in single-threaded JS, but defensive),
        // clearing it first means it can never race with the gen advance below.
        clearUploadTimeout();

        // Advance gen BEFORE abort() so that if tus-js-client fires any callback
        // synchronously inside abort() (not observed in v4, but defensive), those
        // callbacks see the new gen value and correctly bail out.
        uploadGenRef.current++;

        if (uploadRef.current) {
            uploadRef.current.abort(true).catch(() => {});
            uploadRef.current = null;
        }
        setState({ progress: 0, isUploading: false, error: null });
    }, [clearUploadTimeout]);

    const reset = useCallback(() => {
        setState({ progress: 0, isUploading: false, error: null });
    }, []);

    return {
        upload,
        abort,
        reset,
        progress: state.progress,
        isUploading: state.isUploading,
        error: state.error,
    };
}
