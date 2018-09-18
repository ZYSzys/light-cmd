const { EventEmitter } = require('events')
const { basename } = require('path')
const { inherits } = require('util')

const Option = require('./option')

inherits(LightCMD, EventEmitter)

function LightCMD (name) {
  this.commands = []
  this.options = []
  this._execs = {}
  this._allowUnknownOption = false
  this._args = []
  this._name = name || ''
}

LightCMD.prototype.version = function (str, flags) {
  if (arguments.length === 0) return this._version
  this._version = str
  flags = flags || '-v, --version'
  var versionOption = new Option(flags, 'output the version number')
  this._versionOptionName = versionOption.long.substr(2) || 'version'
  this.options.push(versionOption)
  this.on('option:' + this._versionOptionName, function () {
    process.stdout.write(str + '\n')
    process.exit(0)
  })
  return this
}

LightCMD.prototype.parse = function (argv) {
  // implicit help
  if (this.executables) this.addImplicitHelpCommand()

  // store raw args
  this.rawArgs = argv

  // guess name
  this._name = this._name || basename(argv[1], '.js')

  // github-style sub-commands with no sub-command
  if (this.executables && argv.length < 3 && !this.defaultExecutable) {
    // this user needs help
    argv.push('--help')
  }

  // process argv
  var parsed = this.parseOptions(this.normalize(argv.slice(2)))
  var args = this.args = parsed.args

  var result = this.parseArgs(this.args, parsed.unknown)

  // executable sub-commands
  var name = result.args[0]

  var aliasCommand = null
  // check alias of sub commands
  if (name) {
    aliasCommand = this.commands.filter(function (command) {
      return command.alias() === name
    })[0]
  }

  if (this._execs[name] && typeof this._execs[name] !== 'function') {
    return this.executeSubCommand(argv, args, parsed.unknown)
  } else if (aliasCommand) {
    // is alias of a subCommand
    args[0] = aliasCommand._name
    return this.executeSubCommand(argv, args, parsed.unknown)
  } else if (this.defaultExecutable) {
    // use the default subcommand
    args.unshift(this.defaultExecutable)
    return this.executeSubCommand(argv, args, parsed.unknown)
  }

  return result
}

LightCMD.prototype.addImplicitHelpCommand = function () {
  this.command('help [cmd]', 'display help for [cmd]')
}

LightCMD.prototype.normalize = function (args) {
  var ret = []
  var arg
  var lastOpt
  var index

  for (var i = 0, len = args.length; i < len; ++i) {
    arg = args[i]
    if (i > 0) {
      lastOpt = this.optionFor(args[i - 1])
    }

    if (arg === '--') {
      // Honor option terminator
      ret = ret.concat(args.slice(i))
      break
    } else if (lastOpt && lastOpt.required) {
      ret.push(arg)
    } else if (arg.length > 1 && arg[0] === '-' && arg[1] !== '-') {
      arg.slice(1).split('').forEach(function (c) {
        ret.push('-' + c)
      })
    } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
      ret.push(arg.slice(0, index), arg.slice(index + 1))
    } else {
      ret.push(arg)
    }
  }

  return ret
}

LightCMD.prototype.optionFor = function (arg) {
  for (var i = 0, len = this.options.length; i < len; ++i) {
    if (this.options[i].is(arg)) {
      return this.options[i]
    }
  }
}

LightCMD.prototype.parseOptions = function (argv) {
  var args = []
  var len = argv.length
  var literal
  var option
  var arg

  var unknownOptions = []

  // parse options
  for (var i = 0; i < len; ++i) {
    arg = argv[i]

    // literal args after --
    if (literal) {
      args.push(arg)
      continue
    }

    if (arg === '--') {
      literal = true
      continue
    }

    // find matching Option
    option = this.optionFor(arg)

    // option is defined
    if (option) {
      // requires arg
      if (option.required) {
        arg = argv[++i]
        if (arg == null) return this.optionMissingArgument(option)
        this.emit('option:' + option.name(), arg)
      // optional arg
      } else if (option.optional) {
        arg = argv[i + 1]
        if (arg == null || (arg[0] === '-' && arg !== '-')) {
          arg = null
        } else {
          ++i
        }
        this.emit('option:' + option.name(), arg)
      // bool
      } else {
        this.emit('option:' + option.name())
      }
      continue
    }

    // looks like an option
    if (arg.length > 1 && arg[0] === '-') {
      unknownOptions.push(arg)

      // If the next argument looks like it might be
      // an argument for this option, we pass it on.
      // If it isn't, then it'll simply be ignored
      if ((i + 1) < argv.length && argv[i + 1][0] !== '-') {
        unknownOptions.push(argv[++i])
      }
      continue
    }

    // arg
    args.push(arg)
  }

  return { args: args, unknown: unknownOptions }
}

LightCMD.prototype.command = function (name, desc, opts) {
  if (typeof desc === 'object' && desc !== null) {
    opts = desc
    desc = null
  }
  opts = opts || {}
  var args = name.split(/ +/)
  var cmd = new LightCMD(args.shift())

  if (desc) {
    cmd.description(desc)
    this.executables = true
    this._execs[cmd._name] = true
    if (opts.isDefault) this.defaultExecutable = cmd._name
  }
  cmd._noHelp = !!opts.noHelp
  this.commands.push(cmd)
  cmd.parseExpectedArgs(args)
  cmd.parent = this

  if (desc) return this
  return cmd
}

LightCMD.prototype.parseArgs = function (args, unknown) {
  var name

  if (args.length) {
    name = args[0]
    if (this.listeners('command:' + name).length) {
      this.emit('command:' + args.shift(), args, unknown)
    } else {
      this.emit('command:*', args)
    }
  } else {
    // outputHelpIfNecessary(this, unknown)

    // If there were no args and we have unknown options,
    // then they are extraneous and we need to error.
    if (unknown.length > 0) {
      this.unknownOption(unknown[0])
    }
    if (this.commands.length === 0 &&
        this._args.filter(function (a) { return a.required }).length === 0) {
      this.emit('command:*')
    }
  }

  return this
}

LightCMD.prototype.parseExpectedArgs = function (args) {
  if (!args.length) return
  var self = this
  args.forEach(function (arg) {
    var argDetails = {
      required: false,
      name: '',
      variadic: false
    }

    if (arg[0] === '<') {
      argDetails.required = true
    }
    argDetails.name = arg.slice(1, -1)

    if (argDetails.name.length > 3 && argDetails.name.slice(-3) === '...') {
      argDetails.variadic = true
      argDetails.name = argDetails.name.slice(0, -3)
    }
    if (argDetails.name) {
      self._args.push(argDetails)
    }
  })
  return this
}

module.exports = LightCMD
