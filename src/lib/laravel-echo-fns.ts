import {DestroyRef, inject, Injector} from "@angular/core";
import {LaravelEcho} from "./laravel-echo";
import {ChannelData, EchoOptions} from "./laravel-echo-types";

const echo = <TPayload>(channelData: ChannelData, callback: (data: TPayload) => void, options?: EchoOptions) => {
  const injector = options?.injector ?? inject(Injector);
  const echoService = injector.get(LaravelEcho);
  const destroyRef = injector.get(DestroyRef);

  const { stopListening } = echoService.listen(channelData, callback);

  if(!options?.manualCleanup) {
    destroyRef.onDestroy(stopListening);
  }

  return { stopListening };
}

export const laravelEcho = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void, options?: EchoOptions) => {
  return echo({ channel: channelName, eventName, visibility: 'public' }, callback, options);
}

export const laravelEchoPrivate = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void, options?: EchoOptions) => {
  return echo({ channel: channelName, eventName, visibility: 'private' }, callback, options);
}

export const laravelEchoPresence = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void, options?: EchoOptions) => {
  return echo({ channel: channelName, eventName, visibility: 'presence' }, callback, options);
}
