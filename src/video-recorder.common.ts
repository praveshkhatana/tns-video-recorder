import { View } from "tns-core-modules/ui/core/view";

export abstract class Common extends View {
  public static availableEvent = "available";
}

export enum RECORDING_STATE {
  NOT_RECORDING = "NOT_RECORDING",
  RECORDING = "RECORDING",
  PAUSED = "PAUSED"
}
