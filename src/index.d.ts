import { Common as VideoViewCommon } from "./video-recorder.common";
import { RECORDING_STATE } from "./video-recorder.common";
export { RECORDING_STATE } from "./video-recorder.common";
export declare class VideoView extends VideoViewCommon {
  createNativeView(): Object;
  initNativeView(): void;
  disposeNativeView(): void;
}
export declare class VideoRecorder {
  static getCameras(): {
    value: number;
    name: string;
  }[];
  static createRecording(options: VideoRecordingOptions): VideoRecording;
  static getOutputProfiles(): {
    name: string;
    value: number;
  }[];
  static getOutputFormats(): {
    name: string;
    value: number;
  }[];
}
export declare class VideoRecording {
  private cameraId;
  private camera;
  private file;
  private videoView;
  private profile;
  private mediaRecorder;
  state: RECORDING_STATE;
  outputFormat: number;
  thumbnailCount: number;
  thumbnails: string[];

  constructor({
    videoView,
    cameraId,
    file,
    profile,
    outputFormat
  }: {
    videoView: any;
    cameraId: any;
    file: any;
    profile: any;
    outputFormat: any;
  });
  private prepareMediaRecorder();
  private releaseMediaRecorder();
  private releaseCamera();
  startPreview(): void;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  switchCamera(): void;
  release(): void;
}
export interface VideoRecordingOptions {
  videoView: VideoView;
  cameraId: any;
  file: any;
  profile: any;
  outputFormat: any;
  thumbnailCount?: number;
}
