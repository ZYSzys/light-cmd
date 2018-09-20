import test from 'ava'
import cmd from '.'

cmd
  .version('0.0.1')
  .option('-n, --name', 'show the name', () => console.log('His name is ZYSzys.'))
  .option('-a, --age-now', 'show the age', () => console.log('His age is 20.'))

cmd
  .command('init [hello]')
  .option('-t, --timeout', 'wait a while', () => console.log('wait'))
  .description('init repo')
  .action(function (hello) {
    console.log(`init ${hello} okkkkkk ! !`)
  })

test('help', t => {
  t.is(typeof cmd._events.help, 'object')
})

test('version', t => {
  t.is(cmd._version, '0.0.1')
})

test('option name', t => {
  t.is(typeof cmd._events.name, 'function')
})

test('option age camelcase', t => {
  t.is(typeof cmd._events['age-now'], 'function')
})

test('command init', t => {
  t.is(cmd.commands[0].name, 'init')
})
