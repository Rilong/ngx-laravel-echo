import {EnvironmentProviders, makeEnvironmentProviders} from "@angular/core";
import {NGX_LARAVEL_ECHO_CONFIG} from "./laravel-echo-config";
import {LaravelEcho} from "./laravel-echo";
import {Broadcaster, EchoOptions} from "laravel-echo";


export function provideLaravelEcho<T extends keyof Broadcaster>(config: EchoOptions<T>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_LARAVEL_ECHO_CONFIG, useValue: config },
    LaravelEcho
  ]);
}
