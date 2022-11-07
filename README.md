[<img style="background-color: 'black'; padding: 5px;" src=https://travelxchange.com/_next/static/media/travelx-logo.29530026.svg>](https://www.travelx.io)
# Algo Builder Scaffolding


## 📄 Description

This repo contains the scaffolding to start algorand related project using Algo Builder. 
It's based on the best practices of algo-builder repo examples and, also, 
includes typescript and testing.

### Based in
[<img src="https://algobuilder.dev/media/logo-website.png" width="120"/>](https://algobuilder.dev/)

## 🚀 Set up

##### Requirements

### Requirements

- Algorand Sandbox. [readme](https://github.com/algorand/sandbox)
- NodeJS 14+ + yarn
- Python 3.10+ + Pipenv. [doc](https://pipenv.pypa.io/en/latest/#install-pipenv-today)

#### 1) Initialize pipenv
```bash
❯ pipenv install 

# For M1 chip with official python installation (through brew or pyenv is not required)
❯ pipenv install --python=/usr/local/bin/python3-intel64
```
#### 2) Yarn install
```bash
❯ yarn install
```

#### 3) Setup environment
_Just configure the algob file `algob.config.js` and setup master account using yarn script._

__IMPORTANT__: Start sandbox environment before setup _master_ account
```
❯ sandbox up
❯ yarn sandbox:account:master:config:env
```


#### Recommendations
- Install _algob_ globally: `yarn global add @algo-builder/web @algo-builder/runtime @algo-builder/algob`. This allow to run algob scripts without yarn before on the command.

- Put sandbox on the `$PATH`. _Edit you `.bashrc`/`.zshrc` adding `PATH=$PATH:/my/algorand/sandbox/location`_. This allow to run sandbox commands everywhere.

## ⌨️ Commands
---

- `❯ yarn build`: Build ts code into scripts folder
- `❯ yarn build:watch`: Start daemon to which watch changes on ts file and trigger a build
- `❯ yarn test`: Run test with mocha into `test` folder
- `❯ yarn algob {command}`: Run algob command
    - `deploy`: Run all deploy scripts
    - `run scripts/{files}.ts`: Run specific script
    - `shell`: Start an interactive shell with all algob context and utilites


## 📁 Resources
---

### Algo Builder
[<img src="https://algobuilder.dev/media/logo-website.png" width="120"/>](https://algobuilder.dev/)
- AlgoBuilder User Guide [[link](https://algobuilder.dev/guide/README)]
- AlgoBuilder Smart Contract Examples [[link](https://github.com/scale-it/algo-builder/tree/master/examples)]