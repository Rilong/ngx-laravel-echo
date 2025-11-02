import {InjectionToken} from "@angular/core";
import {Broadcaster, EchoOptions} from "laravel-echo";

export const NGX_LARAVEL_ECHO_CONFIG = new InjectionToken('NGX_LARAVEL_ECHO_CONFIG');

export type LaravelEchoConfig = EchoOptions<keyof Broadcaster>;

// Re-export for convenience
export type {Broadcaster, EchoOptions};
