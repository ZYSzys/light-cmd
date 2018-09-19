import test from 'ava'
import cmd from '.'

cmd
  .version('0.0.1')
  .parse('hello -v -h')

test('version', t => {
  t.is(cmd._version, '0.0.1')
})

test('help', t => {
  t.is(typeof cmd._events.help, 'function')
})
