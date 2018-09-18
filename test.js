import test from 'ava'
import lightCmd from '.'

test('title', t => {
  lightCmd.version('0.0.1')
  t.pass()
})
