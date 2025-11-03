import {inject} from "@angular/core";
import {LaravelEcho} from "./laravel-echo";

type Visibility = 'public' | 'private' | 'presence';

const echo = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void, visibility: Visibility = 'public') => {
  const echoService = inject(LaravelEcho).getEcho();
  const channels = {
    public: echoService.channel(channelName),
    private: echoService.private(channelName),
    presence: echoService.join(channelName),
  };

  if (visibility === 'presence') {
    channels[visibility].whisper(eventName, callback);
  } else {
    channels[visibility].listen(eventName, callback);
  }
  return { stopListening: () => { channels[visibility].stopListening(eventName) } };
}

export const laravelEcho = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void) => {
  return echo(channelName, eventName, callback, 'public');
}

export const laravelEchoPrivate = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void) => {
  return echo(channelName, eventName, callback, 'private');
}

export const laravelEchoPresence = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void) => {
  return echo(channelName, eventName, callback, 'presence');
}
