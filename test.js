import test from 'ava'
import cmd from '.'

cmd
  .version('0.0.1')
  .option('-a, --age', 'show the age', () => console.log('His age is 20'))

cmd
  .command('init [hello]')
  .description('init repo')
  .action(function (hello) {
    console.log(`init ${hello} okkkkkk ! !`)
  })

cmd.parse('hello')

test('help', t => {
  t.is(typeof cmd._events.help, 'object')
})

test('version', t => {
  t.is(cmd._version, '0.0.1')
})

test('option age', t => {
  t.is(typeof cmd._events.age, 'function')
})

test('command init', t => {
  t.is(typeof cmd._events.init, 'function')
})
