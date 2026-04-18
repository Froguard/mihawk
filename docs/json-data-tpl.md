# JSON Data Template (json.tpl)

When a mock JSON data file does not exist, mihawk will automatically create it. By default, a fixed `initData` is used. You can customize the initialization content by placing a `json.tpl` file under `$mockDir/template/`.

## How It Works

```mermaid
graph LR
    A[Request] --> B{mihawk}
    B --> C{JSON file exists?}
    C -- Yes --> D[Return data directly]
    C -- No --> E{Remote data available?}
    E -- Yes --> F[Use remote data]
    E -- No --> G{json.tpl exists?}
    G -- Yes --> H[Render template with EJS]
    G -- No --> I[Use default initData]
    F --> J[Create JSON file & return]
    H --> J
    I --> J

    style A fill:#333,stroke:#fff,color:#fff
    style B fill:#09c,stroke:#fff,color:#fff
    style C fill:#777,stroke:#fff,color:#fff
    style D fill:#888,stroke:#fff,color:#fff
    style E fill:#777,stroke:#fff,color:#fff
    style F fill:#999,stroke:#fff,color:#fff
    style G fill:#777,stroke:#fff,color:#fff
    style H fill:#999,stroke:#fff,color:#fff
    style I fill:#999,stroke:#fff,color:#fff
    style J fill:#bbb,stroke:#fff,color:#fff
```

## Template Location

```
$mockDir/
  template/
    json.tpl    <-- EJS template file
  data/
    ...
```

The default `$mockDir` is `./mocks` in your project root.

## Available Variables

| Variable       | Type     | Description                                                      |
| -------------- | -------- | ---------------------------------------------------------------- |
| `jsonPath`     | `string` | Relative path of the JSON file, e.g. `GET/api/user.json`         |
| `jsonPath4log` | `string` | Path used for logging, e.g. `mocks/data/GET/api/user.json`       |
| `routePath`    | `string` | Route path, e.g. `GET /api/user`                                 |
| `mockRelPath`  | `string` | Mock relative path (without extension), e.g. `GET/api/user`      |
| `method`       | `string` | HTTP method, e.g. `GET`, `POST`                                  |
| `url`          | `string` | Full request URL (including query string), e.g. `/api/user?id=1` |

## Example

Create `mocks/template/json.tpl`:

```ejs
{
  "code": 200,
  "data": {},
  "msg": "Auto init file: <%= jsonPath4log %>",
  "_meta": {
    "route": "<%= routePath %>",
    "method": "<%= method %>",
    "url": "<%= url %>"
  }
}
```

When a request for `GET /api/user` is received and `mocks/data/GET/api/user.json` does not exist, mihawk will render the template and create the JSON file with the following content:

```json
{
  "code": 200,
  "data": {},
  "msg": "Auto init file: mocks/data/GET/api/user.json",
  "_meta": {
    "route": "GET /api/user",
    "method": "GET",
    "url": "/api/user"
  }
}
```

## Fallback Priority

When the JSON file does not exist, the initialization source is determined in the following order:

1. **Remote data** — If `setJsonByRemote.enable` is `true` and the remote request succeeds
2. **Template rendering** — If `mocks/template/json.tpl` exists
3. **Default initData** — Hard-coded fallback `{ code: 200, data: 'Empty data!', msg: '...' }`

## Notes

- The template file must be valid JSON after EJS rendering, otherwise it falls back to the default `initData`
- Template rendering errors are logged as warnings but do not block the request
- The template path is resolved once at startup and cached; changes require a server restart to take effect
