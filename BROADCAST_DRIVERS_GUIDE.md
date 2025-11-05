# Working with Different Broadcast Drivers

This guide explains how to configure and switch between different broadcast drivers using the ngx-laravel-echo library.

## Quick Reference

| Driver | Use Case | Installation |
|--------|----------|--------------|
| **Pusher** | Production, reliable, managed service | `npm install pusher-js` |
| **Ably** | Alternative to Pusher, global edge network | `npm install ably` |
| **Socket.io** | Self-hosted, full control | `npm install socket.io-client` |
| **Reverb** | Laravel Reverb (official) | `npm install pusher-js` |

---

## 1. Pusher Configuration

**Installation:**
```bash
npm install pusher-js
```

**Setup in `main.ts`:**
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
      forceTLS: true,
    }),
  ],
});
```

**Backend (Laravel):**
```php
// config/broadcasting.php
'default' => env('BROADCAST_DRIVER', 'pusher'),

'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'useTLS' => true,
    ],
],
```

---

## 2. Socket.io Configuration (Self-hosted)

**Installation:**
```bash
npm install socket.io-client
```

**Setup in `main.ts`:**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLaravelEcho } from 'ngx-laravel-echo';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho({
      broadcaster: 'socket.io',
      host: 'http://localhost:6001',
      // Optional: Add custom socket.io options
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 500,
    }),
  ],
});
```

**Backend (Laravel):**
```php
// config/broadcasting.php
'default' => env('BROADCAST_DRIVER', 'socket.io'),

'socket.io' => [
    'driver' => 'socket.io',
    'host' => env('SOCKET_IO_HOST', 'http://localhost:6001'),
    'key' => env('SOCKET_IO_KEY'),
    'secret' => env('SOCKET_IO_SECRET'),
],
```

**Node.js Socket.io Server:**
```javascript
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

http.listen(6001, () => {
  console.log('Socket.io server running on port 6001');
});
```

---

## 3. Ably Configuration

**Installation:**
```bash
npm install ably
```

**Setup in `main.ts`:**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLaravelEcho } from 'ngx-laravel-echo';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho({
      broadcaster: 'ably',
      key: 'your-ably-key',
      // OR use a token for better security
      // token: 'your-ably-token',
    }),
  ],
});
```

**Backend (Laravel):**
```php
// config/broadcasting.php
'default' => env('BROADCAST_DRIVER', 'ably'),

'ably' => [
    'driver' => 'ably',
    'key' => env('ABLY_KEY'),
],
```

---

## 4. Laravel Reverb Configuration (Official)

**Installation:**
```bash
npm install pusher-js
```

**Setup in `main.ts`:**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLaravelEcho } from 'ngx-laravel-echo';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho({
      broadcaster: 'reverb',
      key: 'your-reverb-key',
      wsHost: 'localhost',
      wsPort: 8080,
      wssPort: 443,
      forceTLS: false, // Set to true in production
    }),
  ],
});
```

**Backend (Laravel):**
```php
// config/broadcasting.php
'default' => env('BROADCAST_DRIVER', 'reverb'),

'reverb' => [
    'driver' => 'reverb',
    'key' => env('REVERB_APP_KEY'),
    'secret' => env('REVERB_APP_SECRET'),
    'app_id' => env('REVERB_APP_ID'),
    'options' => [
        'host' => env('REVERB_HOST', 'localhost'),
        'port' => env('REVERB_PORT', 8080),
        'scheme' => env('REVERB_SCHEME', 'http'),
    ],
],
```

---

## 5. Environment-based Configuration

Create environment-specific configurations:

**environment.ts (Development):**
```typescript
export const environment = {
  production: false,
  broadcast: {
    driver: 'socket.io',
    host: 'http://localhost:6001',
  }
};
```

**environment.prod.ts (Production):**
```typescript
export const environment = {
  production: true,
  broadcast: {
    driver: 'pusher',
    key: 'your-pusher-key',
    cluster: 'mt1',
    encrypted: true,
  }
};
```

**main.ts:**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideLaravelEcho } from 'ngx-laravel-echo';
import { environment } from './environments/environment';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideLaravelEcho(environment.broadcast),
  ],
});
```

---

## 6. Using Different Drivers in Components

The API remains the same regardless of driver:

```typescript
import { Component, OnInit } from '@angular/core';
import { LaravelEcho } from 'ngx-laravel-echo';

@Component({
  selector: 'app-messaging',
  template: `
    <div>
      <h2>Messages</h2>
      <div *ngFor="let message of messages">
        {{ message.user }}: {{ message.text }}
      </div>
    </div>
  `,
})
export class MessagingComponent implements OnInit {
  messages: any[] = [];

  constructor(private echo: LaravelEcho) {}

  ngOnInit() {
    // This works with ANY broadcaster
    this.echo.channel('chat')
      .listen('MessageSent', (event) => {
        this.messages.push(event.message);
      });

    this.echo.privateChannel(`notifications.${this.userId}`)
      .listen('NotificationSent', (event) => {
        console.log('Notification:', event);
      });

    this.echo.presenceChannel('team-room')
      .here((users) => {
        console.log('Users in room:', users);
      })
      .joining((user) => {
        console.log('User joined:', user);
      })
      .leaving((user) => {
        console.log('User left:', user);
      });
  }

  get userId(): number {
    return 1; // Get from auth service
  }
}
```

---

## 7. Switching Drivers at Runtime

For testing or dynamic configuration:

```typescript
import { Component } from '@angular/core';
import { provideLaravelEcho } from 'ngx-laravel-echo';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  template: `...`,
})
export class AppComponent {
  constructor() {
    // Configuration happens at bootstrap time
    // To switch drivers, you would need to restart the app
    // or implement custom logic in your provider
  }
}
```

---

## 8. Debugging Connection Issues

### Check Connection Status

```typescript
import { Component } from '@angular/core';
import { LaravelEcho } from 'ngx-laravel-echo';

@Component({
  selector: 'app-debug',
  template: `
    <div>
      <p>Socket ID: {{ socketId }}</p>
      <button (click)="checkConnection()">Check Connection</button>
    </div>
  `,
})
export class DebugComponent {
  socketId: string | undefined;

  constructor(private echo: LaravelEcho) {
    // Access underlying connector for debugging
    // Note: This requires exposing the connector in LaravelEcho service
  }

  checkConnection() {
    console.log('Checking connection status...');
    // Add custom debugging logic
  }
}
```

### Browser Console Debugging

```javascript
// In browser console
// Check Laravel Echo instance
window.Echo.connector.socket // For Socket.io
window.Echo.connector.pusher // For Pusher

// Listen for all events
window.Echo.channel('debug').listen('.', (event) => {
  console.log('Event:', event);
});
```

---

## 9. Performance Tips by Driver

### Pusher
- Use encrypted channels when handling sensitive data
- Configure reconnection options for reliability
- Monitor message rate to stay within plan limits

### Socket.io (Self-hosted)
- Use Redis adapter for multiple server instances: `npm install @socket.io/redis-adapter`
- Configure sticky sessions for load balancing
- Monitor memory usage on server

### Ably
- Leverage edge network for global reliability
- Use token authentication for better security
- Configure fallback options

### Reverb
- Use horizontal scaling with Redis
- Configure proper CORS settings
- Monitor WebSocket connections

---

## 10. Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Broadcaster not found" | Driver package not installed | Install the correct package (pusher-js, socket.io-client, ably) |
| Connection timeout | Invalid host/credentials | Check configuration and network connectivity |
| Unauthorized errors | Private channel auth not set up | Configure Laravel broadcast authentication |
| CORS errors | Cross-origin request blocked | Configure CORS in server |
| Missing events | Wrong channel name | Verify channel names match backend |

---

## Next Steps

1. Choose your broadcaster based on your needs
2. Install required dependencies
3. Configure in `main.ts` with environment settings
4. Test connection with browser DevTools
5. Implement custom error handling if needed

For more information, see the [Laravel Broadcasting Documentation](https://laravel.com/docs/broadcasting).
