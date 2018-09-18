/**
 * For option like `-v` or `--version`
 *
 * @param {String} flags
 * @param {String} description
 * @api public
 */

function Option (flags, description) {
  this.flags = flags
  this.required = flags.indexOf('<') >= 0
  this.optional = flags.indexOf('[') >= 0
  flags = flags.split(/[ ,|]+/)
  if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift()
  this.long = flags.shift()
  this.description = description || ''
}

/**
 * Return option name.
 *
 * @return {String}
 * @api private
 */

Option.prototype.name = function () {
  return this.long.replace('--', '')
}

/**
 * Return option name, in a camelcase format that can be used
 * as a object attribute key.
 *
 * @return {String}
 * @api private
 */

Option.prototype.attributeName = function () {
  return camelcase(this.name())
}

/**
 * Check if `arg` matches the short or long flag.
 *
 * @param {String} arg
 * @return {Boolean}
 * @api private
 */

Option.prototype.is = function (arg) {
  return this.short === arg || this.long === arg
}

/**
 * Camel-case the given `flag`
 *
 * @param {String} flag
 * @return {String}
 * @api private
 */

function camelcase (flag) {
  return flag.split('-').reduce(function (str, word) {
    return str + word[0].toUpperCase() + word.slice(1)
  })
}

module.exports = Option
