import {Injector} from "@angular/core";

type Visibility = 'public' | 'private' | 'presence';

export interface EchoOptions {
  injector?: Injector;
  manualCleanup?: boolean;
}

export interface ChannelData {
  channel: string;
  eventName: string;
  visibility: Visibility;
}
