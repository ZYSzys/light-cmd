# light-cmd

[![Build Status](https://travis-ci.com/ZYSzys/light-cmd.svg?token=hDbx4fFbLLvMJQybMquv&branch=master)](https://travis-ci.com/ZYSzys/light-cmd)
[![codecov](https://codecov.io/gh/ZYSzys/light-cmd/branch/master/graph/badge.svg?token=rXrUK6SUcO)](https://codecov.io/gh/ZYSzys/light-cmd)
[![NPM version](https://img.shields.io/npm/v/light-cmd.svg?style=flat)](https://npmjs.com/package/light-cmd)
[![NPM downloads](https://img.shields.io/npm/dm/light-cmd.svg?style=flat)](https://npmjs.com/package/light-cmd)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![license](https://img.shields.io/github/license/ZYSzys/light-cmd.svg)](https://github.com/ZYSzys/light-cmd/blob/master/LICENSE)

> Light command line for Node.js.


## Install

```
$ npm install light-cmd
```


## Usage

```js
const cmd = require('light-cmd')

cmd
  .version('0.0.1')
  .option('-a, --age', 'show the age', () => console.log('Age: 100'))

cmd
  .parse(process.argv)

```


## API

See [examples](/examples/) for how to using.

### cmd.version(input)

#### input

Type: `string`

The semver version.

### cmd.option(flags, descrition, fn)

#### flags

Type: `string`

#### descrition

Type: `string`

#### fn

Type: `function`

### cmd.command(flags)

#### flags

Type: `string`

### cmd.action(fn)

#### fn

Type: `function`

### cmd.parse(argv)

#### argv

Type: `Array`
Usually using `process.argv`


## License

MIT © [ZYSzys](http://zyszys.top)
