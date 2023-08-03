# Project "Image Recognition"

## Prerequisites

* [NodeJS](https://nodejs.org/en/blog/release/v18.12.0) >= 18.12.0 < 19


## How to install

Ensure correct NodeJS version >= `v18.12.0`:
```
node -v
```

Fetch repo:
```
git clone git@github.com:pschulzk/img-recognition.git
```

Change directory:
```
cd img-recognition
```

Install dependencies:
```
npm ci
```

## How tun run Image Recognition for Single Image

**Optional:** **If** you run this on a local *Apple Silicon M1* or other ARM-baed architecture you need to execute the following command before:
```
export DOCKER_DEFAULT_PLATFORM=linux/amd64
```

Run backend app for Image Recognition for Single Image API:
```
docker-compose up -d
```

In another CLI instance, run frontend app for Single Image Recognition:
```
npm run serve-imgrec-ui
```

## How tun run Image Recognition for Video

Run backend app for Image Recognition for Video API:
```
npm run serve-movrec-api
```

In another CLI instance, run frontend app for Image Recognition for Video:
```
npm run serve-movrec-ui
```
