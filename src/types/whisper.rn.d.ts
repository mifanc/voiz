declare module 'whisper.rn' {
  export interface TranscribeOptions {
    language?: string;
    maxLen?: number;
    tokenTimestamps?: boolean;
    translate?: boolean;
    maxThreads?: number;
    offset?: number;
    duration?: number;
    prompt?: string;
  }

  export interface TranscribeSegment {
    text: string;
    t0: number;
    t1: number;
  }

  export interface TranscribeResult {
    result: string;
    language: string;
    segments: TranscribeSegment[];
    isAborted: boolean;
  }

  export class WhisperContext {
    transcribe(
      filePathOrBase64: string,
      options?: TranscribeOptions,
    ): { promise: Promise<TranscribeResult>; stop: () => Promise<void> };
    release(): Promise<void>;
  }

  export function initWhisper(options: {
    filePath: string;
    isBundleAsset?: boolean;
    useGpu?: boolean;
    useCoreMLIos?: boolean;
  }): Promise<WhisperContext>;

  export function releaseAllWhisper(): Promise<void>;
}
