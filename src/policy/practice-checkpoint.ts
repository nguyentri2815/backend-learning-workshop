export interface CheckpointValues {label:string;values?:Record<string,unknown>;empty?:string;changed?:string[];observed?:Record<string,unknown>;note?:string}
export interface CheckpointView {
  title:string;purpose:string;status:string;branch?:string;viewing:string;achieved:string;
  before:CheckpointValues;after:CheckpointValues;
}
