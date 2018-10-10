import {
  Common as VideoViewCommon,
  RECORDING_STATE
} from "./video-recorder.common";

export { RECORDING_STATE } from "./video-recorder.common";

export class VideoView extends VideoViewCommon {
  public createNativeView(): Object {
    let view = UIView.new();
    return view;
  }
  //constructor() { super();super.onLoaded();}
  initNativeView(): void {
    (<any>this.nativeView).owner = this;
    super.initNativeView();
  }

  onLoaded() {
    setTimeout(() => {
      this.notify({ eventName: VideoViewCommon.availableEvent, object: this });
    }, 1000);
    super.onLoaded();
  }

  disposeNativeView(): void {
    (<any>this.nativeView).owner = null;
    super.disposeNativeView();
  }
}

export class VideoRecorder {
  public static getCameras() {
    return [
      {
        value: AVCaptureDevicePosition.Back,
        name: "Back"
      },
      {
        value: AVCaptureDevicePosition.Front,
        name: "Front"
      }
    ];
  }

  public static getOutputProfiles() {
    return [
      {
        name: "QUALITY_480P",
        value: AVCaptureSessionPreset640x480
      },
      {
        name: "QUALITY_720P",
        value: AVCaptureSessionPreset1280x720
      },
      {
        name: "QUALITY_1080P",
        value: AVCaptureSessionPreset1920x1080
      }
    ];
  }

  public static createRecording(
    options: VideoRecordingOptions
  ): VideoRecording {
    let recording = new VideoRecording({
      videoView: options.videoView,
      cameraId: +options.cameraId,
      file: options.file,
      profile: options.profile,
      thumbnailCount: options.thumbnailCount
    });

    recording.startPreview();

    return recording;
  }
}

export class VideoRecording {
  private cameraId: number;
  private camera: AVCaptureDevice;
  private file: string;
  private videoView: UIView;
  private profile: string;
  public state: RECORDING_STATE;
  private captureSession: AVCaptureSession;
  private movieFileOutput: AVCaptureMovieFileOutput;
  public thumbnailCount: number;
  public thumbnails: string[];

  constructor({ videoView, cameraId, file, profile, thumbnailCount }) {
    this.videoView = videoView;
    this.cameraId = cameraId;
    this.camera = CameraHelper.getCamera(cameraId);
    this.file = file;
    this.profile = profile;
    this.state = RECORDING_STATE.NOT_RECORDING;
    this.thumbnailCount = thumbnailCount;
  }

  public startPreview() {
    this.captureSession = AVCaptureSession.new();

    try {
      this.captureSession.beginConfiguration();

      if (this.captureSession.canSetSessionPreset(this.profile)) {
        this.captureSession.sessionPreset = this.profile;
      }

      let cameraDeviceInput = AVCaptureDeviceInput.deviceInputWithDeviceError(
        this.camera
      );

      if (this.captureSession.canAddInput(cameraDeviceInput) === true) {
        this.captureSession.addInput(cameraDeviceInput);
      }

      let audioDevice = AVCaptureDevice.defaultDeviceWithMediaType(
        AVMediaTypeAudio
      );
      let audioDeviceInput = AVCaptureDeviceInput.deviceInputWithDeviceError(
        audioDevice
      );

      if (this.captureSession.canAddInput(audioDeviceInput) === true) {
        this.captureSession.addInput(audioDeviceInput);
      }

      this.movieFileOutput = AVCaptureMovieFileOutput.new();

      if (this.captureSession.canAddOutput(this.movieFileOutput) === true) {
        this.captureSession.addOutput(this.movieFileOutput);
      }

      this.captureSession.commitConfiguration();
      this.captureSession.startRunning();
      let previewLayer = AVCaptureVideoPreviewLayer.layerWithSession(
        this.captureSession
      );

      if (previewLayer) {
        previewLayer.bounds = CGRectMake(
          0,
          0,
          this.videoView.bounds.size.width,
          this.videoView.bounds.size.height
        );
        previewLayer.position = CGPointMake(
          this.videoView.bounds.size.width / 2,
          this.videoView.bounds.size.height / 2
        );
        previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
        this.videoView.layer.addSublayer(previewLayer);
      }

      this.videoView.clipsToBounds = true;
    } catch (error) {
      console.log("Error while setting preview" + error);
    }
  }

  start() {
    this.movieFileOutput.startRecordingToOutputFileURLRecordingDelegate(
      NSURL.URLWithString("file://" + this.file),
      new CaptureDelegate()
    );
    this.state = RECORDING_STATE.RECORDING;
  }

  stop() {
    if (this.movieFileOutput) {
      this.movieFileOutput.stopRecording();
    }

    this.state = RECORDING_STATE.NOT_RECORDING;
    this.release();

    if (this.thumbnailCount && this.thumbnailCount > 0) {
      this.extractThumbnails();
    }
  }

  pause() {
    console.log("Not Supported in IOS");
  }

  resume() {
    console.log("Not Supported in IOS");
  }

  public switchCamera() {
    this.captureSession.beginConfiguration();

    let inputs = this.captureSession.inputs;
    let input;

    for (let i = 0; i < inputs.count; i++) {
      input = inputs[i];

      if (
        input.isKindOfClass(<any>AVCaptureDeviceInput) &&
        (<AVCaptureDeviceInput>input).device.hasMediaType(AVMediaTypeVideo)
      ) {
        break;
      }
    }

    this.captureSession.removeInput(input);

    let newCamera = CameraHelper.getCamera(
      input.device.position === AVCaptureDevicePosition.Back
        ? AVCaptureDevicePosition.Front
        : AVCaptureDevicePosition.Back
    );

    let newVideoInput: AVCaptureDeviceInput;

    try {
      newVideoInput = AVCaptureDeviceInput.deviceInputWithDeviceError(
        newCamera
      );
      this.captureSession.addInput(newVideoInput);
    } catch (err) {
      console.log(err);
    }

    this.captureSession.commitConfiguration();
  }

  /**
   * Release all the resources
   */
  release() {
    if (this.captureSession) {
      this.captureSession.stopRunning();
    }
  }

  extractThumbnails() {
    this.thumbnails = [];
    let asset = AVURLAsset.alloc().initWithURLOptions(
      NSURL.URLWithString("file://" + this.file),
      null
    );
    let assetIG = AVAssetImageGenerator.alloc().initWithAsset(asset);
    assetIG.appliesPreferredTrackTransform = true;
    assetIG.apertureMode = AVAssetImageGeneratorApertureModeEncodedPixels;
    let it = parseInt((asset.duration.value / this.thumbnailCount).toString());

    for (let index = 0; index < this.thumbnailCount; index++) {
      let thumbnailImageRef = assetIG.copyCGImageAtTimeActualTimeError(
        CMTimeMake(it * index, asset.duration.timescale),
        null
      );

      if (!thumbnailImageRef) {
        console.log("Thumbnail Image Generation Error");
      }

      let image = UIImage.alloc().initWithCGImage(thumbnailImageRef);
      let outputFilePath =
        this.file.substr(0, this.file.lastIndexOf(".")) +
        "_thumbnail_" +
        index +
        ".png";
      let ok = UIImagePNGRepresentation(image).writeToFileAtomically(
        outputFilePath,
        true
      );

      if (!ok) {
        console.log("Could not write thumbnail to file");
      } else {
        this.thumbnails.push(outputFilePath);
      }
    }
  }
}

class CaptureDelegate extends NSObject
  implements AVCaptureFileOutputRecordingDelegate {
  captureOutputDidFinishRecordingToOutputFileAtURLFromConnectionsError(
    output: AVCaptureFileOutput,
    outputFileURL: NSURL,
    connections: NSArray<AVCaptureConnection>,
    error: NSError
  ): void {
    console.log("recording finished");
  }

  captureOutputDidStartRecordingToOutputFileAtURLFromConnections?(
    output: AVCaptureFileOutput,
    fileURL: NSURL,
    connections: NSArray<AVCaptureConnection>
  ): void {
    console.log("recording start");
  }
}

class CameraHelper {
  public static getCamera(cameraId: AVCaptureDevicePosition) {
    let discoverySession = AVCaptureDeviceDiscoverySession.discoverySessionWithDeviceTypesMediaTypePosition(
      NSArray.arrayWithObject(AVCaptureDeviceTypeBuiltInWideAngleCamera),
      AVMediaTypeVideo,
      AVCaptureDevicePosition.Unspecified
    );

    for (let i = 0; i < discoverySession.devices.count; i++) {
      let device = discoverySession.devices[i];
      if (device.position === cameraId) {
        if (device.lockForConfiguration()) {
          if (
            device.isWhiteBalanceModeSupported(
              AVCaptureWhiteBalanceMode.AutoWhiteBalance
            )
          ) {
            console.log("Setting white balance to auto");
            device.whiteBalanceMode =
              AVCaptureWhiteBalanceMode.AutoWhiteBalance;
          }

          device.unlockForConfiguration();
        }
        return device;
      }
    }

    throw "Camera not found";
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
