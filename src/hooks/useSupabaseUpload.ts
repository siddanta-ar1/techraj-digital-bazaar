"use client";

import { useState, useRef, useCallback } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

// Extract project ID from Supabase URL once at module level
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const PROJECT_ID = SUPABASE_URL.replace("https://", "").split(".")[0];
const TUS_ENDPOINT = `https://${PROJECT_ID}.storage.supabase.co/storage/v1/upload/resumable`;

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

    // Generation counter — incremented at the start of each upload() call.
    // Every callback checks its captured generation against the current value;
    // if they differ, a newer upload has superseded this one and the callback is dropped.
    const uploadGenRef = useRef(0);

    // Store callbacks in refs so TUS callbacks always see the latest versions
    // without needing to be in useCallback deps (which would cause churn).
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;

    // Supabase client via ref — createClient() is a singleton but calling it
    // inside useCallback deps caused an infinite loop.
    const supabaseRef = useRef(createClient());

    const upload = useCallback(
        async (file: File, path: string) => {
            // Increment gen BEFORE aborting the previous upload. tus-js-client can fire
            // onError synchronously during abort() if the upload hasn't started its
            // initial POST yet. If gen were incremented after, onError's gen check would
            // see a matching value and incorrectly trigger the user-visible error callback.
            const gen = ++uploadGenRef.current;

            if (uploadRef.current) {
                // .catch() silences unhandled rejections if the server-side DELETE fails.
                uploadRef.current.abort(true).catch(() => {});
                uploadRef.current = null;
            }

            setState({ progress: 0, isUploading: true, error: null });

            const supabase = supabaseRef.current;

            try {
                // getSession() is sufficient here — we only need the JWT to pass to
                // TUS headers; we're not making a server-side identity check.
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error("Not authenticated. Please log in again.");
                }

                // Guard the gap between the await and TUS start. If the user selected
                // a second file while getSession() was in-flight, bail out here.
                if (gen !== uploadGenRef.current) return;

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
                            cacheControl: "3600", // Must be a string in TUS metadata
                        },
                        chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6MB chunks
                        onError: (err) => {
                            if (gen !== uploadGenRef.current) return;
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
                            if (gen !== uploadGenRef.current) return;
                            const {
                                data: { publicUrl },
                            } = supabase.storage.from(bucket).getPublicUrl(path);
                            setState({ progress: 100, isUploading: false, error: null });
                            onSuccessRef.current?.(publicUrl);
                            resolve(publicUrl);
                        },
                    });

                    uploadRef.current = tusUpload;

                    // Skip fingerprint lookup for small files (< 6MB) — the latency
                    // isn't worth it for files that upload in a single chunk anyway.
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
                if (gen !== uploadGenRef.current) return;
                const error = err instanceof Error ? err : new Error(String(err));
                setState({ progress: 0, isUploading: false, error: error.message });
                onErrorRef.current?.(error);
                throw error;
            }
        },
        [bucket],
    );

    const abort = useCallback(() => {
        // Invalidate in-flight callbacks BEFORE calling abort(). Same reason as in
        // upload(): tus-js-client may fire onError synchronously during abort(), and
        // the gen check must already see the new value to correctly drop it.
        uploadGenRef.current++;
        if (uploadRef.current) {
            uploadRef.current.abort(true).catch(() => {});
            uploadRef.current = null;
        }
        setState({ progress: 0, isUploading: false, error: null });
    }, []);

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
