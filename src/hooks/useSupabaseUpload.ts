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

    // FIX #1: Store callbacks in refs to avoid stale closures
    // and prevent useCallback from re-creating on every render
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;

    // FIX #2: Get supabase via ref — createClient() is a singleton,
    // but calling it inside useCallback deps caused infinite loop
    const supabaseRef = useRef(createClient());

    const upload = useCallback(
        async (file: File, path: string) => {
            // Reset state immediately
            setState({ progress: 0, isUploading: true, error: null });

            const supabase = supabaseRef.current;

            try {
                // FIX #3: Use getUser() for token — faster than getSession()
                // getSession() reads from storage which can be slow on first call.
                // Instead, get session from auth state which is already cached.
                const {
                    data: { session },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {
                    throw new Error("Not authenticated. Please log in again.");
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
                            cacheControl: "3600", // FIX #4: Must be string in TUS metadata
                        },
                        chunkSize: 6 * 1024 * 1024, // Must be 6MB per Supabase docs
                        onError: (err) => {
                            const error = err instanceof Error ? err : new Error(String(err));
                            setState({ progress: 0, isUploading: false, error: error.message });
                            onErrorRef.current?.(error);
                            reject(error);
                        },
                        onProgress: (bytesUploaded, bytesTotal) => {
                            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                            setState((prev) => ({ ...prev, progress: percentage }));
                        },
                        onSuccess: () => {
                            // Build the public URL
                            const {
                                data: { publicUrl },
                            } = supabase.storage.from(bucket).getPublicUrl(path);

                            setState({ progress: 100, isUploading: false, error: null });
                            onSuccessRef.current?.(publicUrl);
                            resolve(publicUrl);
                        },
                    });

                    uploadRef.current = tusUpload;

                    // FIX #5: Don't search for previous uploads for small files (< 6MB)
                    // This adds unnecessary latency for typical image uploads.
                    // Only resume for large files where resumability matters.
                    if (file.size > 6 * 1024 * 1024) {
                        tusUpload.findPreviousUploads().then((previousUploads) => {
                            if (previousUploads.length) {
                                tusUpload.resumeFromPreviousUpload(previousUploads[0]);
                            }
                            tusUpload.start();
                        });
                    } else {
                        // Small file — just start immediately, no fingerprint lookup
                        tusUpload.start();
                    }
                });
            } catch (err: any) {
                const error = err instanceof Error ? err : new Error(String(err));
                setState({ progress: 0, isUploading: false, error: error.message });
                onErrorRef.current?.(error);
                throw error;
            }
        },
        [bucket], // FIX #6: Only depend on bucket — everything else is in refs
    );

    const abort = useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
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
