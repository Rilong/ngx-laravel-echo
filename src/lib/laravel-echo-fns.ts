import {DestroyRef, inject, Injector} from "@angular/core";
import {LaravelEcho} from "./laravel-echo";

type Visibility = 'public' | 'private' | 'presence';

interface EchoOptions {
  injector?: Injector;
  manualCleanup?: boolean;
}

interface ChannelData {
  channel: string;
  eventName: string;
  visibility: Visibility;
}

const listenChannel = (channelData: ChannelData, callback: (data: any) => void, injector: Injector) => {
  const { channel, eventName, visibility } = channelData;
  const echoInstance = injector.get(LaravelEcho).getEcho();

  const channels = {
    public: echoInstance.channel(channel),
    private: echoInstance.private(channel),
    presence: echoInstance.join(channel),
  };

  if (visibility === 'presence') {
    channels[visibility].whisper(eventName, callback);
  } else {
    channels[visibility].listen(eventName, callback);
  }

  return { stopListening: () => { channels[visibility].stopListening(eventName) } };
}

const echo = <TPayload>(channelData: ChannelData, callback: (data: TPayload) => void, options?: EchoOptions) => {
  const injector = options?.injector ?? inject(Injector);
  const destroyRef = injector.get(DestroyRef);

  const { stopListening } = listenChannel(channelData, callback, injector);

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
