const { EventEmitter } = require('events')
const { basename } = require('path')

const Option = require('./option')
const { pad, isNullOrUndefined } = require('./util')

class LightCMD extends EventEmitter {
  constructor (name) {
    super()
    this.commands = []
    this.options = []
    this.args = []
    this.name = name

    // default options
    this.option('-h, --help', 'output usage information')
    this.on('help', function () {
      process.stdout.write(this.helpInformation())
      process.exit(0)
    })
  }

  command (name) {
    const args = name.split(/ +/)
    const cmd = new LightCMD(args.shift())
    this.commands.push(cmd)
    cmd.arg(args)
    cmd.parent = this
    return cmd
  }

  arg (args) {
    if (!args.length) return
    args.forEach((arg) => {
      const curr = { name: arg.slice(1, -1) }
      if (arg[0] === '<') {
        curr.required = true
      } else if (arg[0] === '[') {
        curr.required = false
      }
      this.args.push(curr)
    })
    return this
  }

  action (fn) {
    this.parent.on(this.name, (args) => {
      this.args.forEach((arg, i) => {
        if (isNullOrUndefined(args[i])) {
          this.missingArgument(arg.name)
        }
      })
      fn.apply(this, args)
    })
    return this
  }

  option (flags, desc, fn) {
    const option = new Option(flags, desc)
    const name = option.name()

    this.options.push(option)
    this.on(name, (val) => {
      // coercion
      if (fn) {
        fn(val)
      }

      // assign value
      this[name] = isNullOrUndefined(val) ? option.description : val
    })

    return this
  }

  parse (argv) {
    // store raw args
    this.rawArgs = argv

    // guess name
    if (!this.name) this.name = basename(argv[1])

    // process argv
    return this.parseArgs(this.parseOptions(argv))
  }

  parseArgs (args) {
    if (args.length) {
      this.emit('*', args)
      this.emit(args.shift(), args)
    }
    return this
  }

  optionFor (arg) {
    for (let i = 0; i < this.options.length; i++) {
      if (this.options[i].is(arg)) {
        return this.options[i]
      }
    }
  }

  parseOptions (argv) {
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
          if (isNullOrUndefined(arg)) return this.optionMissingArgument(option)
          if (arg[0] === '-') return this.optionMissingArgument(option, arg)
          this.emit(option.name(), arg)
          // optional arg
        } else if (option.optional) {
          if (isNullOrUndefined(arg) || arg[0] === '-') {
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

  missingArgument (name) {
    console.error(`
    error: missing required argument '${name}'
  `)
    process.exit(1)
  }

  optionMissingArgument (option, got) {
    console.error(`
    error: option '${option.flags}' argument missing
  `)
    process.exit(1)
  }

  unknownOption (flag) {
    console.error(`
    error: unknown option '${flag}'
  `)
    process.exit(1)
  }

  version (str) {
    if (arguments.length === 0) return this._version
    this._version = str
    this.option('-v, --version', 'output the version number')
    this.on('version', function () {
      console.log(str)
      process.exit(0)
    })
    return this
  }

  description (str) {
    if (!arguments.length) return this._description
    this._description = str
    return this
  }

  usage (str) {
    if (!arguments.length) return this._usage || '[options]'
    this._usage = str
    return this
  }

  largestOptionLength () {
    return this.options.reduce((max, option) => {
      return Math.max(max, option.flags.length)
    }, 0)
  }

  optionHelp () {
    const width = this.largestOptionLength()
    return this.options.map((option) => {
      return pad(option.flags, width) +
        '  ' + option.description
    }).join('\n')
  }

  commandHelp () {
    if (!this.commands.length) return ''
    return `
  Commands:\n\n` +
      this.commands.map((cmd) => {
        const args = cmd.args.map((arg) => {
          return arg.required
            ? '<' + arg.name + '>'
            : '[' + arg.name + ']'
        }).join(' ')
        return cmd.name + ' ' + args + '\t' + cmd.description() + '\n'
      }).join('\n\n').replace(/^/gm, '    ')
  }

  helpInformation () {
    return `
  Usage: ${this.name} ${this.usage()}
  ${this.commandHelp()}
  Options:\n\n` +
      `${this.optionHelp().replace(/^/gm, '    ')}

`
  }
}

module.exports = LightCMD
