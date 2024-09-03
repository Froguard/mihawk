# Development of this pacakge

> For developer: development of this package

## prepare

> ensure you have installed frogagu, then you are able to commit your code

```sh
npm i -g frogagu
```

> frogagu@>=0.0.1-sigma

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

## Generate Exports code

```sh
yarn gen:exports
```

## Test

```sh
yarn test
yarn test:cover
```

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

## warning

### 关于 bin scripts

bin 目录下所有文件都必须是 LF 换行，不能使用 CRLF，否则会导致如下报错

```sh
env: node\r: No such file or directory
error Command failed with exit code 127.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

解决办法：更该当前文件的换行符为 LF

```sh
sed -i '' 's/\r$//' ./bin/*
```

> 或者使用额外工具包 dos2unix，本工程并未采用

其他补充：设置全局 git 配置，设置 core.autocrlf 为 false

```sh
git config --global core.autocrlf false
```

**注意**: `.eslintrc.js` 和 `.prettierrc.js`, `tsconfig.json` 中，对于 `newLine` 都需要设置成 `lf`，以便于确保打包产物的换行符为 LF

### allow versions

> 在正式版本 1.0.0 发布之前，采用 24 个希腊字母作为临时版本号

> Before the release of version 0.0.1, there were 24 Greek letters representing versions that could be used as temporary versions

- [ ] Alpha (Α, α)
- [ ] Beta (Β, β)
- [ ] Gamma (Γ, γ)
- [ ] Delta (Δ, δ)
- [ ] Epsilon (Ε, ε)
- [ ] Zeta (Ζ, ζ)
- [ ] Eta (Η, η)
- [ ] Theta (Θ, θ)
- [ ] Iota (Ι, ι)
- [ ] Kappa (Κ, κ)
- [ ] Lambda (Λ, λ)
- [ ] Mu (Μ, μ)
- [ ] Nu (Ν, ν)
- [ ] Xi (Ξ, ξ)
- [ ] Omicron (Ο, ο)
- [ ] Pi (Π, π)
- [ ] Rho (Ρ, ρ)
- [ ] Sigma (Σ, σ/ς)
- [ ] Tau (Τ, τ)
- [ ] Upsilon (Υ, υ)
- [ ] Phi (Φ, φ)
- [ ] Chi (Χ, χ)
- [ ] Psi (Ψ, ψ)
- [ ] Omega (Ω, ω)

others:

- [ ] 0.0.0-a
- [ ] 0.0.0-b
- [ ] 0.0.0-c
- [ ] 0.0.0-d
- [ ] 0.0.0-e
- [ ] 0.0.0-f
- [ ] 0.0.0-g
- [ ] 0.0.0-h
- [ ] 0.0.0-i
- [ ] 0.0.0-j
- [ ] 0.0.0-k
- [ ] 0.0.0-l
- [ ] 0.0.0-m
- [ ] 0.0.0-n
- [ ] 0.0.0-o
- [ ] 0.0.0-p
- [ ] 0.0.0-q
- [ ] 0.0.0-r
- [ ] 0.0.0-s
- [ ] 0.0.0-t
- [ ] 0.0.0-u
- [ ] 0.0.0-v
- [ ] 0.0.0-w
- [ ] 0.0.0-x
- [ ] 0.0.0-y
- [ ] 0.0.0-z

### others

- 本工程不使用 tslint，因为其在2019年已经废弃，停止更新，且tslint官方团队也推荐搭建使用eslint
- 本工程宗旨，一切为了效率，如果涉及到的工具库，社区有就用社区的，避免自己从0到1手撸（节约时间）
