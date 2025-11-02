# NgxLaravelEcho

A modern Angular wrapper for [Laravel Echo](https://laravel.com/docs/broadcasting) that supports multiple broadcast drivers (Pusher, Ably, Socket.io, and more).

## Installation

```bash
npm install ngx-laravel-echo laravel-echo
```

### Install Driver Dependencies

**For Pusher:**
```bash
npm install pusher-js
```

**For Ably:**
```bash
npm install ably
```

**For Socket.io:**
```bash
npm install socket.io-client
```

## Setup

### 1. Configure in Your App

Import and provide the Echo service in your Angular app configuration:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLaravelEcho } from 'ngx-laravel-echo';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho({
      broadcaster: 'pusher',
      key: 'your-pusher-key',
      cluster: 'mt1',
      encrypted: true,
    }),
  ],
});
```

### 2. Inject and Use in Components

```typescript
import { Component } from '@angular/core';
import { LaravelEcho } from 'ngx-laravel-echo';

@Component({
  selector: 'app-chat',
  template: `<div>{{ message }}</div>`,
})
export class ChatComponent {
  message: string = '';

  constructor(private echo: LaravelEcho) {
    // Listen to public channel
    this.echo.channel('chat').listen('MessageSent', (data) => {
      this.message = data.message;
    });
  }
}
```

## Supported Broadcast Drivers

### Pusher

```typescript
provideLaravelEcho({
  broadcaster: 'pusher',
  key: 'your-pusher-key',
  cluster: 'mt1',
  encrypted: true,
  forceTLS: true,
  // Optional: Custom host/port
  // host: 'example.com',
  // port: 6001,
  // scheme: 'https',
})
```

### Ably

```typescript
provideLaravelEcho({
  broadcaster: 'ably',
  key: 'your-ably-key',
  token: 'your-ably-token', // Alternative to key
  // Optional: Custom options
  // plugins: {
  //   RealtimePresence: require('ably/realtime').Realtime.Plugins.RealtimePresence
  // }
})
```

### Socket.io

```typescript
provideLaravelEcho({
  broadcaster: 'socket.io',
  host: 'http://localhost:6001',
  // Optional: Socket.io options
  // reconnection: true,
  // reconnection_delay: 100,
  // reconnection_delay_max: 500,
})
```

### ReverseProxy (for self-hosted solutions)

```typescript
provideLaravelEcho({
  broadcaster: 'reverseproxy',
  host: 'http://localhost:8000',
  // Optional: Custom path
  // path: '/socket.io'
})
```

## Channel Types

### Public Channel

Listen to events from any user:

```typescript
this.echo.channel('chat').listen('MessageSent', (data) => {
  console.log('Message received:', data);
});
```

### Private Channel

Listen to events only for the authenticated user:

```typescript
this.echo.privateChannel('private-user.1').listen('NotificationSent', (data) => {
  console.log('Notification received:', data);
});
```

### Presence Channel

Track online users and their presence:

```typescript
const presence = this.echo.presenceChannel('presence-room');

// User joined
presence.here((users) => {
  console.log('Users online:', users);
});

// User joined (new)
presence.joining((user) => {
  console.log('User joined:', user);
});

// User left
presence.leaving((user) => {
  console.log('User left:', user);
});

// Listen for events
presence.listen('UserAction', (data) => {
  console.log('User action:', data);
});
```

## API Reference

### `LaravelEcho` Service

#### Methods

- **`channel(name: string)`**: Subscribe to a public channel
- **`privateChannel(name: string)`**: Subscribe to a private channel
- **`presenceChannel(name: string)`**: Subscribe to a presence channel

## Environment Variables

For security, use environment variables for sensitive configuration:

```typescript
import { environment } from './environments/environment';
import { provideLaravelEcho } from 'ngx-laravel-echo';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho({
      broadcaster: environment.echo.broadcaster,
      key: environment.echo.key,
      cluster: environment.echo.cluster,
    }),
  ],
});
```

**environment.ts:**
```typescript
export const environment = {
  production: false,
  echo: {
    broadcaster: 'pusher',
    key: 'your-pusher-key',
    cluster: 'mt1',
  },
};
```

## Complete Example

```typescript
import { Component, OnInit } from '@angular/core';
import { LaravelEcho } from 'ngx-laravel-echo';

@Component({
  selector: 'app-notifications',
  template: `
    <div class="notifications">
      <div *ngFor="let notification of notifications">
        {{ notification.message }}
      </div>
    </div>
  `,
  styles: [`
    .notifications {
      padding: 20px;
      background: #f5f5f5;
    }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];

  constructor(private echo: LaravelEcho) {}

  ngOnInit() {
    // Listen to private channel
    this.echo.privateChannel(`notifications.${this.userId}`)
      .listen('NotificationSent', (event) => {
        this.notifications.push(event.data);
      });

    // Listen to presence channel
    this.echo.presenceChannel('team-room')
      .listen('UserStatusChanged', (event) => {
        console.log('User status changed:', event);
      });
  }

  get userId(): number {
    // Get from auth service
    return 1;
  }
}
```

## Troubleshooting

### Connection Issues

1. **Verify broadcaster credentials** in your configuration
2. **Check CORS settings** if using a remote broadcaster
3. **Ensure authenticator is configured** for private/presence channels
4. **Check browser console** for specific error messages

### Common Issues

- **"Broadcaster not found"**: Install the required driver package
- **"Connection refused"**: Check broadcaster host and port
- **"Unauthorized"**: Verify authentication for private channels

## Building

```bash
ng build ngx-laravel-echo
```

Build artifacts will be placed in the `dist/` directory.

### Publishing

```bash
cd dist/ngx-laravel-echo
npm publish
```

## Additional Resources

- [Laravel Echo Documentation](https://laravel.com/docs/broadcasting)
- [Laravel Broadcasting](https://laravel.com/docs/broadcasting)
- [Pusher Documentation](https://pusher.com/docs)
- [Ably Documentation](https://ably.com/docs)
- [Socket.io Documentation](https://socket.io/docs)
