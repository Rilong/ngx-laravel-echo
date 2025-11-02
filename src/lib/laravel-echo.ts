import {inject, Injectable} from "@angular/core";
import {NGX_LARAVEL_ECHO_CONFIG} from "./laravel-echo-config";
import Echo, {BroadcastDriver, Broadcaster, Channel, EchoOptions} from "laravel-echo";
import Pusher from "pusher-js";


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
}
