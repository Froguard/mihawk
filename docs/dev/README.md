# Development of this pacakge

> For developer: development of this package

## prepare

> ensure you have installed frogagu, then you are able to commit your code

```sh
npm i -g frogagu
```

> frogagu@>=0.0.1-omega

then create a new root config file `.frogagurc.json`

```json
{
  "gitconfig": {
    "globalUserWhiteList": [], // optional
    "localUserWhiteList": [{ "name": "your_git_account_name", "email": "your_git_accout_email" }]
  }
}
```

## Install

```sh
yarn install --regitry=https://registry.npmmirror.com # install from npm mirror (china-mirror)
```

> yarn install --regitry=https://registry.npmjs.org

## Dev

### main:

```sh
yarn dev
```

### :bin:

```sh
yarn dev:bin
yarn dev:bin -h # yarn dev:bin --help
yarn dev:bin -v # yarn dev:bin --version
yarn dev:bin:init
```

````

## Test

```sh
yarn test
yarn test:cover
````

## Build

### build esm

> build esmodule files(\*.js without comment code) → `./dist/esm`

```sh
yarn build:esm
```

### build cjs

> build commonjs files(\*.js without comment code) → `./dist/cjs`

```sh
yarn build:cjs
```

### build types

> build types files (\*.d.ts with comment code) → `./dist/types`

```sh
yarn build:types
```

### build all

> build all files → `./dist`

```sh
yarn build
```

---

## problems

> See more detail → [problems.md](./problems.md)

## warning

### allow versions

> Before the release of stable version, there were 24 Greek letters representing versions that could be used as temporary versions
>
> 在正式版本 1.0.0 发布之前，采用 50 个代号（24 个希腊字母 + 26 个英文字母），作为临时版本号

Greek:

- [x] alpha (Α, α)
- [x] beta (Β, β)
- [x] gamma (Γ, γ)
- [x] delta (Δ, δ)
- [x] epsilon (Ε, ε)
- [x] zeta (Ζ, ζ)
- [x] eta (Η, η)
- [x] theta (Θ, θ)
- [x] iota (Ι, ι)
- [x] kappa (Κ, κ)
- [x] lambda (Λ, λ)
- [x] mu (Μ, μ)
- [x] nu (Ν, ν)
- [x] xi (Ξ, ξ)
- [x] omicron (Ο, ο)
- [x] pi (Π, π)
- [x] rho (Ρ, ρ)
- [x] sigma (Σ, σ/ς)
- [x] tau (Τ, τ)
- [x] upsilon (Υ, υ)
- [x] phi (Φ, φ)
- [x] chi (Χ, χ)
- [x] psi (Ψ, ψ)
- [x] omega (Ω, ω)

Others:

- [x] 0.1.0-a
- [x] 0.1.0-b
- [x] 0.1.0-c
- [x] 0.1.0-d
- [ ] 0.1.0-e
- [ ] 0.1.0-f
- [ ] 0.1.0-g
- [ ] 0.1.0-h
- [ ] 0.1.0-i
- [ ] 0.1.0-j
- [ ] 0.1.0-k
- [ ] 0.1.0-l
- [ ] 0.1.0-m
- [ ] 0.1.0-n
- [ ] 0.1.0-o
- [ ] 0.1.0-p
- [ ] 0.1.0-q
- [ ] 0.1.0-r
- [ ] 0.1.0-s
- [ ] 0.1.0-t
- [ ] 0.1.0-u
- [ ] 0.1.0-v
- [ ] 0.1.0-w
- [ ] 0.1.0-x
- [ ] 0.1.0-y
- [ ] 0.1.0-z
