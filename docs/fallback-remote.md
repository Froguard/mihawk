# init json data file by remote

```mermaid
graph LR
    A[Request] --> B(devServer)
    B --> C[mihawk]
    C --> D{Is JSON data initialized?}
    D -- Initialized --> E[Return data directly]
    D -- Not initialized --> F[Fetch data from remote service]
    F --> G[Remote Service]
    G --> H[Initialize JSON file and return data]

    style A fill:#333,stroke:#fff,color:#fff
    style B fill:#555,stroke:#fff,color:#fff
    style C fill:#09c,stroke:#fff,color:#fff
    style D fill:#777,stroke:#fff,color:#fff
    style E fill:#888,stroke:#fff,color:#fff
    style F fill:#999,stroke:#fff,color:#fff
    style G fill:#7a6da2,stroke:#fff,color:#fff
    style H fill:#bbb,stroke:#fff,color:#fff

    classDef step fill:#555,stroke:#fff,color:#fff;
    classDef decision fill:#777,stroke:#fff,color:#fff;

    class A,F,G,H step
    class D decision
```

## 1. Function Triggers

- When no local mock rule matches
- `setJsonByRemote.enable` is true in config
- `setJsonByRemote.target` was setted in config, by a valid url

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
  setJsonByRemote: {
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
