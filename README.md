# Project "Image Recognition"

## Prerequisites

* [NodeJS](https://nodejs.org/en/blog/release/v18.12.0) >= 18.12.0 < 19


## How to run

Ensure correct NodeJS version >= `v18.12.0`:
```
$ node -v
```

Fetch repo:
```
$ git clone git@github.com:pschulzk/img-recognition.git
```

Change directory:
```
$ cd img-recognition
```

Install dependencies:
```
$ npm ci
```

In another CLI instance, run frontend app for Single Image Recognition:
```
$ npm run serve-imgrec-ui
```

Run backend app for Image Recognition for Movies API:
```
$ npm run serve-movrec-api
```

In another CLI instance, run frontend app for Image Recognition for Movies:
```
$ npm run serve-movrec-ui
```
