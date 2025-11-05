# Advanced ngx-laravel-echo Usage Patterns

Advanced patterns and techniques for working with Laravel Echo in Angular applications.

## 1. Creating a Broadcast Service

Create a custom service that wraps LaravelEcho for consistent usage across your app:

```typescript
// src/app/services/broadcast.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { LaravelEcho } from 'ngx-laravel-echo';

@Injectable({
  providedIn: 'root',
})
export class BroadcastService {
  private messageSubject = new Subject<any>();
  public messages$ = this.messageSubject.asObservable();

  constructor(private echo: LaravelEcho) {
    this.initializeChannels();
  }

  private initializeChannels() {
    // Setup your channels here
    this.echo.channel('chat')
      .listen('MessageSent', (data) => {
        this.messageSubject.next(data);
      });
  }

  public broadcast(channel: string, event: string) {
    return this.echo.channel(channel);
  }

  public join(channel: string) {
    return this.echo.presenceChannel(channel);
  }

  public private(channel: string) {
    return this.echo.privateChannel(channel);
  }
}
```

**Usage in component:**
```typescript
@Component({
  selector: 'app-chat',
  template: `
    <div *ngFor="let message of messages$ | async">
      {{ message.text }}
    </div>
  `,
})
export class ChatComponent {
  messages$ = this.broadcastService.messages$;

  constructor(private broadcastService: BroadcastService) {}
}
```

---

## 2. Type-Safe Channel Subscriptions

Define interfaces for your channels and events:

```typescript
// src/app/types/broadcast.types.ts
export interface ChatMessage {
  id: number;
  user: string;
  text: string;
  timestamp: Date;
}

export interface NotificationEvent {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}

export interface UserPresence {
  id: number;
  name: string;
  email: string;
  status: 'online' | 'away' | 'offline';
}
```

**Type-safe service:**
```typescript
@Injectable({ providedIn: 'root' })
export class TypedBroadcastService {
  private chatMessages$ = new Subject<ChatMessage>();
  private notifications$ = new Subject<NotificationEvent>();
  private userPresence$ = new Subject<UserPresence[]>();

  constructor(private echo: LaravelEcho) {
    this.setupChannels();
  }

  private setupChannels() {
    this.echo.channel('chat')
      .listen('MessageSent', (event: { message: ChatMessage }) => {
        this.chatMessages$.next(event.message);
      });

    this.echo.privateChannel(`notifications.${this.userId}`)
      .listen('NotificationSent', (event: { notification: NotificationEvent }) => {
        this.notifications$.next(event.notification);
      });

    this.echo.presenceChannel('team-room')
      .here((users: UserPresence[]) => {
        this.userPresence$.next(users);
      });
  }

  get messages$(): Observable<ChatMessage> {
    return this.chatMessages$.asObservable();
  }

  get notifications$(): Observable<NotificationEvent> {
    return this.notifications$.asObservable();
  }

  get presence$(): Observable<UserPresence[]> {
    return this.userPresence$.asObservable();
  }

  private get userId(): number {
    // Get from auth service
    return 1;
  }
}
```

---

## 3. RxJS Integration

Combine Laravel Echo with RxJS for powerful data streams:

```typescript
import { Injectable } from '@angular/core';
import { Observable, Subject, merge } from 'rxjs';
import { map, scan, startWith } from 'rxjs/operators';
import { LaravelEcho } from 'ngx-laravel-echo';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private messageSubject = new Subject<ChatMessage>();

  constructor(private echo: LaravelEcho) {
    this.setupChannel();
  }

  private setupChannel() {
    this.echo.channel('chat')
      .listen('MessageSent', (event) => {
        this.messageSubject.next(event.message);
      });
  }

  // Get all messages with accumulation
  getMessages(): Observable<ChatMessage[]> {
    return this.messageSubject.asObservable().pipe(
      scan((messages, newMessage) => [...messages, newMessage], [] as ChatMessage[]),
      startWith([])
    );
  }

  // Filter messages by user
  getMessagesByUser(userId: number): Observable<ChatMessage[]> {
    return this.getMessages().pipe(
      map(messages => messages.filter(m => m.userId === userId))
    );
  }

  // Count messages
  getMessageCount(): Observable<number> {
    return this.getMessages().pipe(
      map(messages => messages.length)
    );
  }
}
```

---

## 4. Error Handling and Reconnection

Implement robust error handling:

```typescript
@Injectable({ providedIn: 'root' })
export class RobustBroadcastService {
  private connectionStatusSubject = new Subject<'connected' | 'disconnected' | 'error'>();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private errorSubject = new Subject<Error>();
  public errors$ = this.errorSubject.asObservable();

  constructor(private echo: LaravelEcho) {
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    try {
      this.echo.channel('debug')
        .listen('error', (error) => {
          console.error('Broadcast error:', error);
          this.errorSubject.next(new Error(error.message));
          this.connectionStatusSubject.next('error');

          // Attempt reconnection
          this.reconnect();
        });

      this.connectionStatusSubject.next('connected');
    } catch (error) {
      console.error('Failed to setup broadcast:', error);
      this.errorSubject.next(error as Error);
      this.connectionStatusSubject.next('error');
    }
  }

  private reconnect() {
    // Implement exponential backoff
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    const attemptReconnect = () => {
      if (retries < maxRetries) {
        const delay = baseDelay * Math.pow(2, retries);
        setTimeout(() => {
          try {
            this.setupErrorHandling();
            console.log('Reconnection successful');
          } catch (error) {
            console.error('Reconnection attempt', retries + 1, 'failed');
            retries++;
            attemptReconnect();
          }
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    attemptReconnect();
  }
}
```

---

## 5. Presence Tracking

Advanced presence management:

```typescript
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private usersPresenceSubject = new Subject<UserPresence[]>();
  public usersPresence$ = this.usersPresenceSubject.asObservable();

  private userJoinedSubject = new Subject<UserPresence>();
  public userJoined$ = this.userJoinedSubject.asObservable();

  private userLeftSubject = new Subject<UserPresence>();
  public userLeft$ = this.userLeftSubject.asObservable();

  constructor(private echo: LaravelEcho) {}

  joinRoom(roomId: string): Observable<UserPresence[]> {
    const presence = this.echo.presenceChannel(`presence-${roomId}`);

    presence.here((users) => {
      this.usersPresenceSubject.next(users);
    });

    presence.joining((user) => {
      this.userJoinedSubject.next(user);
    });

    presence.leaving((user) => {
      this.userLeftSubject.next(user);
    });

    return this.usersPresence$.asObservable();
  }

  leaveRoom(roomId: string) {
    this.echo.leaveChannel(`presence-${roomId}`);
  }

  broadcastUserStatus(roomId: string, status: string) {
    this.echo.presenceChannel(`presence-${roomId}`)
      .whisper('status', { status });
  }
}
```

**Usage:**
```typescript
@Component({
  selector: 'app-room',
  template: `
    <div class="users-list">
      <h3>Users in Room ({{ (usersPresence$ | async)?.length }})</h3>
      <div *ngFor="let user of usersPresence$ | async">
        <span>{{ user.name }}</span>
        <span class="status" [class]="user.status">{{ user.status }}</span>
      </div>
    </div>
  `,
})
export class RoomComponent implements OnInit {
  usersPresence$ = this.presenceService.usersPresence$;

  constructor(private presenceService: PresenceService) {}

  ngOnInit() {
    this.presenceService.joinRoom('room-1');
  }
}
```

---

## 6. Private Channel Authentication

Setup private channel authentication:

**Backend (Laravel):**
```php
// routes/channels.php
Broadcast::channel('notifications.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::privateChannel('team.{teamId}', function ($user, $teamId) {
    return $user->teams()->where('id', $teamId)->exists();
});
```

**Frontend:**
```typescript
@Injectable({ providedIn: 'root' })
export class PrivateChannelService {
  constructor(private echo: LaravelEcho, private authService: AuthService) {}

  subscribeToNotifications(userId: number): Observable<any> {
    const subject = new Subject<any>();

    this.echo.privateChannel(`notifications.${userId}`)
      .listen('NotificationSent', (event) => {
        subject.next(event);
      })
      .listen('NotificationRead', (event) => {
        subject.next(event);
      });

    return subject.asObservable();
  }

  subscribeToTeamUpdates(teamId: number): Observable<any> {
    const subject = new Subject<any>();

    this.echo.privateChannel(`team.${teamId}`)
      .listen('TeamUpdated', (event) => {
        subject.next(event);
      })
      .listen('MemberJoined', (event) => {
        subject.next(event);
      });

    return subject.asObservable();
  }
}
```

---

## 7. Performance Optimization

Optimize for large-scale applications:

```typescript
@Injectable({ providedIn: 'root' })
export class OptimizedBroadcastService {
  // Use Subject for hot observables
  private messageSubject = new Subject<ChatMessage>();
  private presenceSubject = new Subject<UserPresence>();

  // Debounce rapid updates
  public messages$ = this.messageSubject.asObservable().pipe(
    debounceTime(100),
    distinctUntilChanged((prev, curr) => 
      prev.id === curr.id && prev.text === curr.text
    )
  );

  // Cache presence data
  private presenceCache = new Map<number, UserPresence>();

  constructor(private echo: LaravelEcho) {
    this.setupOptimizedChannels();
  }

  private setupOptimizedChannels() {
    // Only subscribe once, share across multiple subscribers
    this.echo.channel('chat')
      .listen('MessageSent', (event) => {
        this.messageSubject.next(event.message);
      });
  }

  // Batch presence updates
  trackPresence(roomId: string): Observable<UserPresence[]> {
    return new Observable(subscriber => {
      const presence = this.echo.presenceChannel(`presence-${roomId}`);

      presence.here((users) => {
        this.updatePresenceCache(users);
        subscriber.next(Array.from(this.presenceCache.values()));
      });

      presence.joining((user) => {
        this.presenceCache.set(user.id, user);
        subscriber.next(Array.from(this.presenceCache.values()));
      });

      presence.leaving((user) => {
        this.presenceCache.delete(user.id);
        subscriber.next(Array.from(this.presenceCache.values()));
      });
    }).pipe(shareReplay(1));
  }

  private updatePresenceCache(users: UserPresence[]) {
    users.forEach(user => {
      this.presenceCache.set(user.id, user);
    });
  }
}
```

---

## 8. Testing Strategies

Test your broadcast implementation:

```typescript
// src/app/services/broadcast.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { LaravelEcho } from 'ngx-laravel-echo';
import { BroadcastService } from './broadcast.service';

describe('BroadcastService', () => {
  let service: BroadcastService;
  let echoSpy: jasmine.SpyObj<LaravelEcho>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('LaravelEcho', [
      'channel',
      'privateChannel',
      'presenceChannel',
    ]);

    TestBed.configureTestingModule({
      providers: [
        BroadcastService,
        { provide: LaravelEcho, useValue: spy },
      ],
    });

    service = TestBed.inject(BroadcastService);
    echoSpy = TestBed.inject(LaravelEcho) as jasmine.SpyObj<LaravelEcho>;
  });

  it('should subscribe to chat channel', () => {
    const channelSpy = jasmine.createSpyObj('Channel', ['listen']);
    echoSpy.channel.and.returnValue(channelSpy);

    service['initializeChannels']();

    expect(echoSpy.channel).toHaveBeenCalledWith('chat');
    expect(channelSpy.listen).toHaveBeenCalledWith('MessageSent', jasmine.any(Function));
  });

  it('should emit messages from broadcast', (done) => {
    const mockMessage = { text: 'Hello' };

    service.messages$.subscribe((message) => {
      expect(message).toEqual(mockMessage);
      done();
    });

    // Trigger the listener
    const callback = echoSpy.channel('chat').listen.calls.argsFor(0)[1];
    callback(mockMessage);
  });
});
```

---

## 9. Multi-Driver Support

Create a service that supports multiple drivers:

```typescript
@Injectable({ providedIn: 'root' })
export class MultiDriverBroadcastService {
  private driver: 'pusher' | 'socket.io' | 'ably' = 'pusher';
  private channels = new Map<string, any>();

  constructor(private echo: LaravelEcho) {
    this.detectDriver();
  }

  private detectDriver() {
    // Auto-detect based on global config
    if ((window as any).Pusher) this.driver = 'pusher';
    else if ((window as any).io) this.driver = 'socket.io';
    else if ((window as any).Ably) this.driver = 'ably';
  }

  subscribe(channel: string, event: string): Observable<any> {
    const subject = new Subject<any>();

    try {
      const chan = this.getChannel(channel);
      chan.listen(event, (data) => {
        subject.next(data);
      });
      this.channels.set(channel, chan);
    } catch (error) {
      subject.error(error);
    }

    return subject.asObservable();
  }

  private getChannel(name: string) {
    if (name.startsWith('presence-')) {
      return this.echo.presenceChannel(name);
    } else if (name.startsWith('private-')) {
      return this.echo.privateChannel(name);
    }
    return this.echo.channel(name);
  }

  unsubscribe(channel: string) {
    this.echo.leaveChannel(channel);
    this.channels.delete(channel);
  }

  getActiveDriver(): string {
    return this.driver;
  }
}
```

---

## Best Practices

1. **Use Services**: Always wrap LaravelEcho in services for consistency
2. **Type Safety**: Define interfaces for all events
3. **Error Handling**: Implement proper error handling and reconnection logic
4. **Memory Management**: Unsubscribe from channels when components are destroyed
5. **Performance**: Use RxJS operators for filtering and debouncing
6. **Testing**: Mock LaravelEcho in unit tests
7. **Security**: Always validate private channel access on backend
8. **Monitoring**: Track connection status and errors

---

## Resources

- [RxJS Documentation](https://rxjs.dev)
- [Laravel Echo](https://laravel.com/docs/broadcasting)
- [Angular Dependency Injection](https://angular.dev/guide/dependency-injection)
