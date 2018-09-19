import test from 'ava'
import lightCmd from '.'

test('version', t => {
  lightCmd.version('0.0.1')
  t.is(lightCmd._version, '0.0.1')
})
