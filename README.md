# ngx-laravel-echo

> ⚠️ **Work In Progress (WIP)** - This is a very raw version. The API and documentation are subject to significant changes. Please use with caution in production environments.

A modern Angular wrapper for [Laravel Echo](https://laravel.com/docs/broadcasting) that enables real-time event broadcasting in your Angular applications. Built with **Angular 20**, **TypeScript**, and full support for multiple broadcast drivers.

## 🚀 Features

- ✨ **Modern Angular API** - Standalone providers with full dependency injection support
- 🔐 **Multi-Driver Support** - Pusher, Ably, Socket.io, and Laravel Reverb
- 📦 **Type-Safe** - Complete TypeScript support with generics for type-safe event payloads
- 🎯 **Channel Types** - Public, private, and presence channels with dedicated helpers
- 🔄 **Easy Integration** - Simple setup with `provideLaravelEcho()`
- ⚙️ **Flexible** - Switch broadcast drivers with just a configuration change

## 📦 Installation

```bash
npm install ngx-laravel-echo laravel-echo
```

Choose your broadcast driver:

**For Pusher:**
```bash
npm install pusher-js
```

**For Socket.io:**
```bash
npm install socket.io-client
```

**For Ably:**
```bash
npm install ably
```

## 🎯 Quick Start

### 1. Setup in your Angular Application

In your `main.ts`:

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

### 2. Use Helper Functions in Components

```typescript
import { Component } from '@angular/core';
import { laravelEcho } from 'ngx-laravel-echo';

@Component({
  selector: 'app-messages',
  template: `
    <div *ngFor="let msg of messages">{{ msg.text }}</div>
  `,
})
export class MessagesComponent {
  messages: any[] = [];

  constructor() {
    laravelEcho<{ text: string }>('messages', 'MessageSent', (data) => {
      this.messages.push(data.text);
    });
  }
}
```

## 🛠️ Usage Examples

### Using Public Channels

Public channels are available to all users:

```typescript
import { Component } from '@angular/core';
import { laravelEcho } from 'ngx-laravel-echo';

@Component({
  selector: 'app-public-chat',
})
export class PublicChatComponent {
  constructor() {
    laravelEcho<{ message: string }>('public.chat', 'MessagePosted', (data) => {
      console.log('Message:', data.message);
    });
  }
}
```

### Using Private Channels

Private channels restrict access to authenticated users:

```typescript
import { Component } from '@angular/core';
import { laravelEchoPrivate } from 'ngx-laravel-echo';

@Component({
  selector: 'app-notifications',
})
export class NotificationsComponent {
  constructor() {
    laravelEchoPrivate<{ notification: string }>('user.notifications', 'NotificationSent', (data) => {
      console.log('Notification:', data.notification);
    });
  }
}
```

### Using Presence Channels

Track online users in real-time:

```typescript
import { Component } from '@angular/core';
import { laravelEchoPresence } from 'ngx-laravel-echo';

@Component({
  selector: 'app-presence',
})
export class PresenceComponent {
  constructor() {
    laravelEchoPresence<{ users: User[] }>('room.1', 'UserPresence', (data) => {
      console.log('Presence update:', data.users);
    });
  }
}
```

## ⚙️ Configuration

### Pusher Configuration

```typescript
provideLaravelEcho({
  broadcaster: 'pusher',
  key: 'your-pusher-key',
  cluster: 'mt1',
  encrypted: true,
  wsHost: 'ws.pusher.com',
  wsPort: 443,
  wssPort: 443,
  disableStats: true,
})
```

### Socket.io Configuration

```typescript
provideLaravelEcho({
  broadcaster: 'socket.io',
  host: 'http://localhost:6001',
  rejectUnauthorized: false, // For development only
})
```

### Ably Configuration

```typescript
provideLaravelEcho({
  broadcaster: 'ably',
  key: 'your-ably-api-key',
})
```

### Using Environment-Based Configuration

Create separate configurations for different environments:

**environment.ts (Development):**
```typescript
export const environment = {
  production: false,
  broadcast: {
    broadcaster: 'socket.io',
    host: 'http://localhost:6001',
  },
};
```

**environment.prod.ts (Production):**
```typescript
export const environment = {
  production: true,
  broadcast: {
    broadcaster: 'pusher',
    key: 'your-pusher-key',
    cluster: 'mt1',
    encrypted: true,
  },
};
```

**main.ts:**
```typescript
import { environment } from './environments/environment';
import { provideLaravelEcho } from 'ngx-laravel-echo';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho(environment.broadcast),
  ],
});
```

## 📚 Core API Reference

### Helper Functions

#### `laravelEcho<T>()`

Listen to public channel events:

```typescript
const { stopListening } = laravelEcho<MessagePayload>(
  'channel-name',
  'EventName',
  (data) => { /* handle event */ }
);

// Stop listening
stopListening();
```

#### `laravelEchoPrivate<T>()`

Listen to private channel events:

```typescript
const { stopListening } = laravelEchoPrivate<NotificationPayload>(
  'user.notifications',
  'NotificationSent',
  (data) => { /* handle event */ }
);
```

#### `laravelEchoPresence<T>()`

Listen to presence channel events:

```typescript
const { stopListening } = laravelEchoPresence<UserPayload>(
  'room.1',
  'UserJoined',
  (data) => { /* handle event */ }
);
```


## 🌐 Supported Broadcast Drivers

| Driver | Package | Best For |
|--------|---------|----------|
| **Pusher** | `pusher-js` | Production, cloud-hosted, global reach |
| **Ably** | `ably` | High-availability, global edge network |
| **Socket.io** | `socket.io-client` | Self-hosted, full control |
| **Laravel Reverb** | `pusher-js` | Laravel Reverb (uses Pusher protocol) |
