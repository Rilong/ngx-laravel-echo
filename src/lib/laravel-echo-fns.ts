import {inject} from "@angular/core";
import {LaravelEcho} from "./laravel-echo";

const laravelEcho = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void) => {
  return inject(LaravelEcho).getEcho()
    .channel(channelName)
    .listen(eventName, callback);
}

const laravelEchoPrivate = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void) => {
  return inject(LaravelEcho).getEcho()
    .private(channelName)
    .listen(eventName, callback);
}

const laravelEchoPresence = <TPayload>(channelName: string, eventName: string, callback: (data: TPayload) => void) => {
  return inject(LaravelEcho).getEcho()
    .join(channelName)
    .whisper(eventName, callback);
}
