/// <reference path="./../../node_modules/tns-platform-declarations/android.d.ts" />
/// <reference path="./../../node_modules/tns-platform-declarations/ios.d.ts" />

import { Component } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router/router-extensions";
import { VideoRecorder } from "nativescript-video-recorder";
import * as permissions from "nativescript-permissions";
import { ListPicker } from "ui/list-picker";
import { isAndroid } from "tns-core-modules/ui/page/page";
import * as FileSystemModule from "tns-core-modules/file-system";

import * as application from "tns-core-modules/application";

declare var android;

@Component({
  selector: "video-property",
  templateUrl: "./property/property.component.html"
})
export class PropertyComponent {
  private _cameras: any[];
  private _selectedCamera: any;
  private _outputFormats: any[];
  private _selectedOutputFormat: any;
  private _profiles: any[];
  private _selectedProfile: any;

  selectedCameraIndex = 0;
  selectedResolutionIndex = 0;
  selectedOutputFormatIndex = 0;
  selectedProfileIndex = 0;
  dir = "";
  file = "";

  get cameras(): any[] {
    if (this._cameras) {
      return this._cameras.map(i => i.name);
    } else {
      return [];
    }
  }

  get profiles(): any[] {
    if (this._profiles) {
      return this._profiles.map(i => i.name);
    } else {
      return [];
    }
  }

  get outputFormats(): any[] {
    if (this._outputFormats) {
      return this._outputFormats.map(i => i.name);
    } else {
      return [];
    }
  }

  constructor(private routerExtensions: RouterExtensions) {}
  ngOnInit() {
    let promise;

    if (isAndroid) {
      promise = permissions.requestPermissions(
        [
          android.Manifest.permission.WRITE_EXTERNAL_STORAGE,
          android.Manifest.permission.RECORD_AUDIO,
          android.Manifest.permission.CAMERA
        ],
        "App need audio permission"
      );
      // .then((e) => {
      // this.loadCameras();
      // this.loadProfiles();
      // this.loadOutputFormats();

      // this.dir = android
      //     .os
      //     .Environment
      //     .getExternalStoragePublicDirectory()
      //     .getAbsolutePath() + '/videorecordtest';

      // this.dir = application
      //     .android
      //     .context
      //     .getFilesDir().getAbsolutePath();

      // let dir = new java.io.File(this.dir);

      // if (!dir.exists()) {
      //     if (!dir.mkdirs()) {
      //         return null;
      //     }
      // }

      // this.file = 'vid_' + Date.now() + '.mp4';

      // }, (e) => {
      //     console.log('Permission Denied' + e);
      // });
    } else {
      promise = Promise.resolve();
      // this.loadCameras();
      // this.loadProfiles();

      // let paths = NSSearchPathForDirectoriesInDomains(NSSearchPathDirectory.DocumentDirectory, NSSearchPathDomainMask.UserDomainMask, true);
      // this.dir = paths[0];
      // this.file = 'vid_' + Date.now() + '.mov';
    }

    promise.then(() => {
      this.loadCameras();
      this.loadProfiles();

      if (isAndroid) {
        this.loadOutputFormats();
      }

      let documents = isAndroid
        ? FileSystemModule.knownFolders.currentApp()
        : FileSystemModule.knownFolders.documents();
      let folder = documents.getFolder(Date.now().toString());
      this.dir = folder.path;
      this.file = "vid_" + Date.now() + ".mp4";
    });
  }

  loadCameras() {
    this._cameras = VideoRecorder.getCameras();
    this.selectCamera(this._cameras[0]);
  }

  loadOutputFormats() {
    this._outputFormats = VideoRecorder.getOutputFormats();
    this.selectOutputFormat(this._outputFormats[0]);
  }

  loadProfiles() {
    this._profiles = VideoRecorder.getOutputProfiles();
    this.selectProfile(this._profiles[0]);
  }

  selectCamera(camera) {
    this._selectedCamera = camera;
  }

  selectOutputFormat(outputFormat) {
    this._selectedOutputFormat = outputFormat;
  }

  selectProfile(profile) {
    this._selectedProfile = profile;
  }

  onCameraSelect(args) {
    let picker = <ListPicker>args.object;

    if (this.selectedCameraIndex !== picker.selectedIndex) {
      this.selectedCameraIndex = picker.selectedIndex;
      this.selectCamera(this._cameras[picker.selectedIndex]);
    }
  }

  onOutputFormatSelect(args) {
    let picker = <ListPicker>args.object;

    if (this.selectedOutputFormatIndex !== picker.selectedIndex) {
      this.selectedOutputFormatIndex = picker.selectedIndex;
      this.selectOutputFormat(this._outputFormats[picker.selectedIndex]);
    }
  }

  onProfileSelect(args) {
    let picker = <ListPicker>args.object;

    if (this.selectedProfileIndex !== picker.selectedIndex) {
      this.selectedProfileIndex = picker.selectedIndex;
      this.selectProfile(this._profiles[picker.selectedIndex]);
    }
  }

  startPreview() {
    this.routerExtensions.navigate(["preview"], {
      queryParams: {
        cameraId: this._selectedCamera.value,
        file: this.dir + "/" + this.file,
        outputFormat: this._selectedOutputFormat
          ? this._selectedOutputFormat.value
          : undefined,
        profile: this._selectedProfile.value
      }
    });
  }
}
