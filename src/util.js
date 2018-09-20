const pad = (str, width) => {
  const len = Math.max(0, width - str.length)
  return str + Array(len + 1).join(' ')
}

const isNullOrUndefined = (obj) => {
  return obj === null || obj === undefined
}

module.exports = {
  pad,
  isNullOrUndefined
}
