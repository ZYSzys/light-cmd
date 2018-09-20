const { EventEmitter } = require('events')
const { basename } = require('path')
const { inherits } = require('util')

const Option = require('./option')

function LightCMD (name) {
  this.commands = []
  this.options = []
  this.args = []
  this.name = name
}

inherits(LightCMD, EventEmitter)

LightCMD.prototype.command = function (name) {
  const args = name.split(/ +/)
  const cmd = new LightCMD(args.shift())
  this.commands.push(cmd)
  cmd.arg(args)
  cmd.parent = this
  return cmd
}

LightCMD.prototype.arg = function (args) {
  if (!args.length) return
  var self = this
  args.forEach(function (arg) {
    switch (arg[0]) {
      case '<':
        self.args.push({ required: true, name: arg.slice(1, -1) })
        break
      case '[':
        self.args.push({ required: false, name: arg.slice(1, -1) })
        break
    }
  })
  return this
}

LightCMD.prototype.action = function (fn) {
  var self = this
  this.parent.on(this.name, function (args) {
    self.args.forEach(function (arg, i) {
      if (args[i] === null || args[i] === undefined) {
        self.missingArgument(arg.name)
      }
    })
    fn.apply(this, args)
  })
  return this
}

LightCMD.prototype.option = function (flags, desc, fn) {
  const self = this
  const option = new Option(flags, desc)
  const name = option.name()

  this.options.push(option)
  this.on(name, function (val) {
    // coercion
    if (fn) {
      fn(val)
    }

    // assign value
    self[name] = val == null
      ? option.description
      : val
  })

  return this
}

LightCMD.prototype.parse = function (argv) {
  // store raw args
  this.rawArgs = argv

  // guess name
  if (!this.name) this.name = basename(argv[1])

  // default options
  this.option('-h, --help', 'output usage information')
  this.on('help', function () {
    process.stdout.write(this.helpInformation())
    process.exit(0)
  })

  // process argv
  return this.parseArgs(this.parseOptions(argv))
}

LightCMD.prototype.parseArgs = function (args) {
  if (args.length) {
    this.emit('*', args)
    this.emit(args.shift(), args)
  }
  return this
}

LightCMD.prototype.optionFor = function (arg) {
  for (let i = 0; i < this.options.length; i++) {
    if (this.options[i].is(arg)) {
      return this.options[i]
    }
  }
}

LightCMD.prototype.parseOptions = function (argv) {
  const args = []
  argv = argv.slice(2)

  const len = argv.length

  // parse options
  for (let i = 0; i < len; ++i) {
    let arg = argv[i]
    const option = this.optionFor(arg)

    // option is defined
    if (option) {
      // requires arg
      if (option.required) {
        arg = argv[++i]
        if (arg === null || arg === undefined) return this.optionMissingArgument(option)
        if (arg[0] === '-') return this.optionMissingArgument(option, arg)
        this.emit(option.name(), arg)
        // optional arg
      } else if (option.optional) {
        if (arg === undefined || arg === null || arg[0] === '-') {
          arg = null
        } else {
          ++i
        }
        this.emit(option.name(), arg)
      } else {
        this.emit(option.name())
      }
      continue
    }

    // looks like an option
    if (arg.length > 1 && arg[0] === '-') {
      this.unknownOption(arg)
    }

    // arg
    args.push(arg)
  }

  return args
}

LightCMD.prototype.missingArgument = function (name) {
  console.error(`
    error: missing required argument '${name}'
  `)
  process.exit(1)
}

LightCMD.prototype.optionMissingArgument = function (option, got) {
  console.error(`
    error: option '${option.flags}' argument missing
  `)
  process.exit(1)
}

LightCMD.prototype.unknownOption = function (flag) {
  console.error(`
    error: unknown option '${flag}'
  `)
  process.exit(1)
}

LightCMD.prototype.version = function (str) {
  if (arguments.length === 0) return this._version
  this._version = str
  this.option('-v, --version', 'output the version number')
  this.on('version', function () {
    console.log(str)
    process.exit(0)
  })
  return this
}

LightCMD.prototype.description = function (str) {
  if (arguments.length === 0) return this._description
  this._description = str
  return this
}

LightCMD.prototype.usage = function (str) {
  if (arguments.length === 0) return this._usage || '[options]'
  this._usage = str
  return this
}

LightCMD.prototype.largestOptionLength = function () {
  return this.options.reduce(function (max, option) {
    return Math.max(max, option.flags.length)
  }, 0)
}

LightCMD.prototype.optionHelp = function () {
  var width = this.largestOptionLength()
  return this.options.map(function (option) {
    return pad(option.flags, width) +
      '  ' + option.description
  }).join('\n')
}

LightCMD.prototype.commandHelp = function () {
  if (!this.commands.length) return ''
  return `
  Commands:\n\n` +
    this.commands.map(function (cmd) {
      var args = cmd.args.map(function (arg) {
        return arg.required
          ? '<' + arg.name + '>'
          : '[' + arg.name + ']'
      }).join(' ')
      return cmd.name + ' ' + args + '\t' + cmd.description() + '\n'
    }).join('\n\n').replace(/^/gm, '    ')
}

LightCMD.prototype.helpInformation = function () {
  return `
  Usage: ${this.name} ${this.usage()}
  ${this.commandHelp()}
  Options:\n\n` +
    `${this.optionHelp().replace(/^/gm, '    ')}

`
}

function pad (str, width) {
  var len = Math.max(0, width - str.length)
  return str + Array(len + 1).join(' ')
}

module.exports = LightCMD
