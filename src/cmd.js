const { EventEmitter } = require('events')
const { basename } = require('path')
const { inherits } = require('util')

const Option = require('./option')

inherits(LightCMD, EventEmitter)

function LightCMD (name) {
  this.commands = []
  this.options = []
  this.args = []
  this.name = name || ''
}

LightCMD.prototype.command = function (name) {
  const args = name.split(/ +/)
  const cmd = new LightCMD(args.shift())
  this.commands.push(cmd)

  cmd.arg(args)
  cmd.parent = this
  return cmd
}

LightCMD.prototype.arg = function (args) {
  if (!args.length) {
    return
  }

  const self = this
  args.forEach(arg => {
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
  const self = this
  this.parent.on(this.name, function (args) {
    self.args.forEach((arg, i) => {
      if (args[i] === null) {
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
  const name = option.name

  this.options.push(option)
  this.on(name, val => {
    if (val !== null && fn) {
      val = fn(val)
    }
    self[name] = val === null ? option.bool : val
  })

  return this
}

LightCMD.prototype.parse = function (argv) {
  this.rawArgs = argv

  if (!this.name) {
    this.name = basename(argv[1])
  }

  this.option('-h, --help', 'output usage information')
  this.on('help', () => {
    process.stdout.write(this.helpInformation())
    process.exit(0)
  })

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
  var args = []

  argv = argv.slice(2)

  var len = argv.length

  var option

  var arg

  // parse options
  for (var i = 0; i < len; ++i) {
    arg = argv[i]
    option = this.optionFor(arg)

    // option is defined
    if (option) {
      // requires arg
      if (option.required) {
        arg = argv[++i]
        if (arg === null) return this.optionMissingArgument(option)
        if (arg[0] === '-') return this.optionMissingArgument(option, arg)
        this.emit(option.name(), arg)
      // optional arg
      } else if (option.optional) {
        if (arg === null || arg[0] === '-') {
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
  console.error()
  console.error("  error: missing required argument `%s'", name)
  console.error()
  process.exit(1)
}

LightCMD.prototype.optionMissingArgument = function (option, got) {
  console.error()
  if (got) {
    console.error("  error: option `%s' argument missing, got `%s'", option.flags, got)
  } else {
    console.error("  error: option `%s' argument missing", option.flags)
  }
  console.error()
  process.exit(1)
}

LightCMD.prototype.unknownOption = function (flag) {
  console.error()
  console.error("  error: unknown option `%s'", flag)
  console.error()
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
  return [
    '',
    '  Commands:',
    '',
    this.commands.map(function (cmd) {
      var args = cmd.args.map(function (arg) {
        return arg.required
          ? '<' + arg.name + '>'
          : '[' + arg.name + ']'
      }).join(' ')
      return cmd.name + ' ' + args + '\n' + cmd.description()
    }).join('\n\n').replace(/^/gm, '    '),
    ''
  ].join('\n')
}

LightCMD.prototype.helpInformation = function () {
  return [
    '',
    '  Usage: ' + this.name + ' ' + this.usage(),
    '' + this.commandHelp(),
    '  Options:',
    '',
    '' + this.optionHelp().replace(/^/gm, '    '),
    '',
    ''
  ].join('\n')
}

function pad (str, width) {
  var len = Math.max(0, width - str.length)
  return str + Array(len + 1).join(' ')
}

module.exports = LightCMD
