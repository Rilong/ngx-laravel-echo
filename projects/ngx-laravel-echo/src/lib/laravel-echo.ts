import {inject, Injectable, Injector} from "@angular/core";
import {NGX_LARAVEL_ECHO_CONFIG} from "./laravel-echo-config";
import Echo, {BroadcastDriver, Broadcaster, Channel, EchoOptions} from "laravel-echo";
import Pusher from "pusher-js";
import {ChannelData} from "./laravel-echo-types";


declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<BroadcastDriver>;
  }
}
@Injectable()
export class LaravelEcho {
  private config = inject<EchoOptions<BroadcastDriver>>(NGX_LARAVEL_ECHO_CONFIG);

  private echo: Echo<BroadcastDriver>

  constructor() {
    const config = this.config;
    config.Pusher ??= Pusher;
    this.echo = new Echo<BroadcastDriver>(this.config);
    window.Echo = this.echo;
  }

  public getEcho(): Echo<BroadcastDriver> {
    return this.echo;
  }

  public listen(channelData: ChannelData, callback: (data: any) => void) {
    const {channel, eventName, visibility} = channelData;

    const channels = {
      public: () => this.echo.channel(channel),
      private: () => this.echo.private(channel),
      presence: () => this.echo.join(channel),
    };

    if (visibility === 'presence') {
      channels[visibility]().whisper(eventName, callback);
    } else {
      channels[visibility]().listen(eventName, callback);
    }

    return {stopListening: () => {channels[visibility]().stopListening(eventName)}};
  }

}
