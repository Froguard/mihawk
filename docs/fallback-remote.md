# Fallback Remote Proxy

## 1. Function Triggers

- When no local mock rule matches
- `fallbackRemote.enable` is true in config
- `fallbackRemote.target` was setted in config, by a valid url

## 2. Configuration Parameters

```ts
interface {
  enable: boolean;
  /** Target server URL */
  target: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Path rewrite function */
  rewrite?: (path: string) => string;
}
```

## 3. Complete Configuration Example

```ts
// .mihawkrc.ts
export default {
  // ...
  fallbackRemote: {
    enable: true,
    target: 'https://api.example.com',
    timeout: 5000,
    rewrite: path => path.replace(/^\/api\/, '/'),
  },
  // ...
};
```

## 4. Request Forwarding Mechanism

1. Request interception -> 2. Local matching -> 3. Proxy forwarding -> 4. Response handling -> 5. Exception catching
