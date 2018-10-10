import {
  Common as VideoViewCommon,
  RECORDING_STATE
} from "./video-recorder.common";
import { Length } from "tns-core-modules/ui/page/page";
import { letterSpacingProperty } from "tns-core-modules/ui/text-base/text-base";

export { RECORDING_STATE } from "./video-recorder.common";

let surfaceTextureListener: android.view.TextureView.SurfaceTextureListener;
let MediaMetadataRetriever = android.media.MediaMetadataRetriever;

/**
 * Interface for SurfareTextureListner
 */
@Interfaces([android.view.TextureView.SurfaceTextureListener])
class SurfaceTextureListener extends java.lang.Object
  implements android.view.TextureView.SurfaceTextureListener {
  public owner: VideoView;

  constructor(owner) {
    super();
    this.owner = owner;
    return global.__native(this);
  }

  public onSurfaceTextureAvailable(surface, width, height) {
    // Once available notify controller for same
    if (this.owner) {
      this.owner.notify({
        eventName: VideoViewCommon.availableEvent,
        object: this.owner
      });
    }
  }

  public onSurfaceTextureSizeChanged(surface, width, height) {
    console.log(
      "Sureface Texture Changed : width : " + width + " height: " + height
    );
  }

  public onSurfaceTextureDestroyed(surface) {
    console.log("Sureface Texture Destroyed");
    return true;
  }

  public onSurfaceTextureUpdated(surface) {}
}

export class VideoView extends VideoViewCommon {
  public createNativeView(): Object {
    let textureView = new android.view.TextureView(this._context);
    textureView.setSurfaceTextureListener(new SurfaceTextureListener(this));
    return textureView;
  }

  initNativeView(): void {
    (<any>this.nativeView).owner = this;
    super.initNativeView();
  }

  disposeNativeView(): void {
    (<any>this.nativeView).owner = null;
    super.disposeNativeView();
  }
}

export class VideoRecorder {
  /**
   * Get Cameras. User value attribute while creating VideoRecorder
   */
  public static getCameras() {
    return [
      {
        value: 0,
        name: "Back"
      },
      {
        value: 1,
        name: "Front"
      }
    ];
  }

  /**
   * Create Recording
   * @param options
   */
  public static createRecording(options: VideoRecordingOptions) {
    try {
      let recording = new VideoRecording({
        videoView: options.videoView,
        cameraId: +options.cameraId,
        file: options.file,
        profile: +options.profile,
        outputFormat: +options.outputFormat,
        thumbnailCount: options.thumbnailCount
      });

      recording.startPreview();
      return recording;
    } catch (e) {
      throw "Error in creating recording" + e;
    }
  }

  /**
   * Get profiles. Use value attribute while creating VideoRecording.
   */
  public static getOutputProfiles() {
    return [
      {
        name: "QUALITY_480P",
        value: android.media.CamcorderProfile.QUALITY_480P
      },
      {
        name: "QUALITY_720P",
        value: android.media.CamcorderProfile.QUALITY_720P
      },
      {
        name: "QUALITY_1080P",
        value: android.media.CamcorderProfile.QUALITY_1080P
      },
      {
        name: "QUALITY_QVGA",
        value: android.media.CamcorderProfile.QUALITY_QVGA
      }
    ];
  }

  /**
   * Get output formats. Use value attribute while creating VideoRecording.
   */
  public static getOutputFormats() {
    return [
      {
        name: "3gpp",
        value: android.media.MediaRecorder.OutputFormat.THREE_GPP
      },
      {
        name: "mp4",
        value: android.media.MediaRecorder.OutputFormat.MPEG_4
      }
    ];
  }
}

export class VideoRecording {
  private cameraId: number;
  private camera: android.hardware.Camera;
  private file;
  private videoView: android.view.TextureView;
  private profile;
  private mediaRecorder: android.media.MediaRecorder;
  public state: RECORDING_STATE;
  public outputFormat: number;
  public thumbnailCount: number;
  public thumbnails: string[];

  constructor({
    videoView,
    cameraId,
    file,
    profile,
    outputFormat,
    thumbnailCount
  }) {
    this.videoView = videoView;
    this.cameraId = cameraId;
    this.camera = CameraHelper.getCamera(cameraId);
    this.file = file;
    this.profile = profile;
    this.state = RECORDING_STATE.NOT_RECORDING;
    this.outputFormat = outputFormat;
    this.thumbnailCount = thumbnailCount;
  }

  private prepareMediaRecorder() {
    try {
      this.mediaRecorder = new android.media.MediaRecorder();

      // Needed to set output file orientation.
      this.mediaRecorder.setOrientationHint(this.cameraId === 0 ? 90 : 270);
      this.camera.unlock();
      this.mediaRecorder.setCamera(this.camera);
      this.mediaRecorder.setAudioSource(
        android.media.MediaRecorder.AudioSource.DEFAULT
      );
      this.mediaRecorder.setVideoSource(
        android.media.MediaRecorder.VideoSource.CAMERA
      );
      let profile = android.media.CamcorderProfile.get(this.profile);
      profile.fileFormat = this.outputFormat;
      this.mediaRecorder.setProfile(profile);
      this.mediaRecorder.setOutputFile(this.file);
      this.mediaRecorder.prepare();
    } catch (e) {
      throw "Error while preparing media recorder " + e;
    }
  }

  private releaseMediaRecorder() {
    if (this.mediaRecorder != null) {
      this.mediaRecorder.reset();
      this.mediaRecorder.release();
      this.mediaRecorder = null;
      this.camera.lock();
    }
  }

  private releaseCamera() {
    if (this.camera) {
      this.camera.stopPreview();
      this.camera.release();
    }
  }

  public startPreview() {
    let cParams = this.camera.getParameters();

    // set focus mode to auto if supported
    let supportedFocusModes = cParams.getSupportedFocusModes();
    if (
      supportedFocusModes.contains(
        android.hardware.Camera.Parameters.FOCUS_MODE_AUTO
      )
    ) {
      console.log("Setting focus mode to auto");
      cParams.setFocusMode(android.hardware.Camera.Parameters.FOCUS_MODE_AUTO);
    }

    if (cParams.isAutoWhiteBalanceLockSupported()) {
      console.log("Setting auto white balance lock to false");
      cParams.setAutoWhiteBalanceLock(false);
    }

    cParams.setExposureCompensation(cParams.getMaxExposureCompensation());

    if (cParams.isAutoExposureLockSupported()) {
      console.log("Setting auto exposure lock to false");
      cParams.setAutoExposureLock(false);
    }

    let supportedSceneModes = cParams.getSupportedSceneModes();

    // set night mode scene if supported
    if (
      supportedSceneModes &&
      supportedSceneModes.contains(
        android.hardware.Camera.Parameters.SCENE_MODE_NIGHT
      )
    ) {
      console.log("Setting scene mode to night mode");
      cParams.setSceneMode(android.hardware.Camera.Parameters.SCENE_MODE_NIGHT);
    }

    let previewFpsRange = new Array(2);
    cParams.getPreviewFpsRange(previewFpsRange);

    if (previewFpsRange[0] === previewFpsRange[1]) {
      let supportedFpsRanges = cParams.getSupportedPreviewFpsRange();
      console.log(supportedFpsRanges);
      for (let i = 0; i < supportedFpsRanges.size(); i++) {
        let range = supportedFpsRanges.get(i);

        if (range[0] !== range[1]) {
          console.log(
            "Setting preview fps range to " + range[0] + " - " + range[1]
          );
          cParams.setPreviewFpsRange(range[0], range[1]);
          break;
        }
      }
    }

    this.camera.setParameters(cParams);

    try {
      this.camera.setPreviewTexture(this.videoView.getSurfaceTexture());
    } catch (e) {
      throw "Surface texture is unavailable or unsuitable" + e;
    }

    this.camera.startPreview();
  }

  start() {
    this.prepareMediaRecorder();
    this.mediaRecorder.start();
    this.state = RECORDING_STATE.RECORDING;
  }

  stop() {
    this.releaseMediaRecorder();
    this.state = RECORDING_STATE.NOT_RECORDING;

    if (this.thumbnailCount && this.thumbnailCount > 0) {
      this.extractThumbnails();
    }
  }

  pause() {
    if (this.mediaRecorder != null) {
      (<any>this.mediaRecorder).pause();
      this.state = RECORDING_STATE.PAUSED;
    }
  }

  resume() {
    if (this.mediaRecorder != null) {
      (<any>this.mediaRecorder).resume();
      this.state = RECORDING_STATE.RECORDING;
    }
  }

  switchCamera() {
    this.releaseCamera();
    this.cameraId = this.cameraId === 0 ? 1 : 0;
    this.camera = CameraHelper.getCamera(this.cameraId);
    this.startPreview();
  }

  /**
   * Release all resources
   */
  release() {
    this.releaseMediaRecorder();
    this.releaseCamera();
  }

  extractThumbnails() {
    this.thumbnails = [];
    let mediaMetadataRetriever = new MediaMetadataRetriever();

    mediaMetadataRetriever.setDataSource(this.file);
    let METADATA_KEY_DURATION = mediaMetadataRetriever.extractMetadata(
      MediaMetadataRetriever.METADATA_KEY_DURATION
    );

    let max = parseInt(METADATA_KEY_DURATION.toString());

    let it = parseInt((max / this.thumbnailCount).toString());

    for (let index = 0; index < this.thumbnailCount; index++) {
      let bmpOriginal = mediaMetadataRetriever.getFrameAtTime(
        index * it * 1000,
        MediaMetadataRetriever.OPTION_CLOSEST
      );
      let byteCount = bmpOriginal.getWidth() * bmpOriginal.getHeight() * 4;
      let tmpByteBuffer = java.nio.ByteBuffer.allocate(byteCount);
      bmpOriginal.copyPixelsToBuffer(tmpByteBuffer);
      let quality = 100;

      let outputFilePath =
        this.file.substr(0, this.file.lastIndexOf(".")) +
        "_thumbnail_" +
        index +
        ".png";
      let outputFile = new java.io.File(outputFilePath);
      let outputStream = null;

      try {
        outputStream = new java.io.FileOutputStream(outputFile);
      } catch (e) {
        console.log(e);
      }

      let bmpScaledSize = android.graphics.Bitmap.createScaledBitmap(
        bmpOriginal,
        bmpOriginal.getWidth(),
        bmpOriginal.getHeight(),
        false
      );
      bmpScaledSize.compress(
        android.graphics.Bitmap.CompressFormat.PNG,
        quality,
        outputStream
      );

      try {
        outputStream.close();
        this.thumbnails.push(outputFilePath);
      } catch (e) {
        console.log(e);
      }
    }

    mediaMetadataRetriever.release();
  }
}

class CameraHelper {
  public static getCamera(cameraId) {
    let camera = android.hardware.Camera.open(cameraId);
    // Set orientation for view.
    camera.setDisplayOrientation(90);
    return camera;
  }
}

export interface VideoRecordingOptions {
  videoView: VideoView;
  cameraId: number;
  file: string;
  profile: any;
  outputFormat: number;
  thumbnailCount?: number;
}
