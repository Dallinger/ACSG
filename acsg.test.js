/* eslint-env jest */

const rewire = require('rewire')
const acsg = require('./acsg')
// Access private functions for unit tests
const acsgRewire = rewire('./acsg')
var outputData = ''
var storeLog = inputs => (outputData += inputs)
// eslint-disable-next-line no-console
console['log'] = jest.fn(storeLog)

// Random seed
beforeEach(() => {
  outputData = ''
})

// Generate basic world
function init_game(config) {
  var game_config = {SEED: 2, INCLUDE_HUMAN: true, IS_CLI: true}
  Object.assign(game_config, config)
  var game = acsg.Game({config: game_config})
  return game
}

test('sum function', () => {
  var sum = acsgRewire.__get__('sum')
  expect(sum([1, 2, 3])).toEqual(6)
  expect(sum([8, 9, 10])).toEqual(27)
  expect(sum([])).toEqual(0)
})

test('softmax function', () => {
  const softmax = acsgRewire.__get__('softmax')
  expect(softmax([1, 2, 3])).toEqual([1/6, 1/3, 1/2])
  expect(softmax([0, 0, 0])).toEqual([3, 3, 3])
  expect(softmax([1, 2, 3], 2)).toEqual([1/14, 2/7, 9/14])
})

test('player move changes position', () => {
  var game = init_game()
  // Create a player
  var player = game.world.players[0]
  // initial position is random, but deterministic based on seed
  expect(player.position).toEqual([9, 15])
  // move() returns direction
  expect(player.move('up')).toEqual('up')
  expect(player.position).toEqual([8, 15])
  player.move('down')
  expect(player.position).toEqual([9, 15])
  player.move('left')
  expect(player.position).toEqual([9, 14])
  player.move('right')
  expect(player.position).toEqual([9, 15])
  // Nonsense directions are logged, and do nothing
  player.move('nonsense')
  expect(outputData).toEqual('Direction not recognized.')
  expect(player.position).toEqual([9, 15])
})

test('calculate straight payoff', () => {
  var game = init_game({
    NUM_PLAYERS: 2,
    DOLLARS_PER_POINT: 0.05
  })
  var player = game.world.players[0]
  // Payoff is a simple multiple of our score
  player.score = 10
  expect(player.payoff).toEqual(0)
  game.computePayoffs()
  expect(player.payoff).toEqual(0.5)
  player.score = 20
  game.computePayoffs()
  expect(player.payoff).toEqual(1)
  player.score = 0
  game.computePayoffs()
  expect(player.payoff).toEqual(0)
  // Other player scores don't matter
  player.score = 20
  game.world.players[1].score = 50
  game.computePayoffs()
  expect(player.payoff).toEqual(1)
})

test('calculate intragroup payoff', () => {
  var game = init_game({
    NUM_PLAYERS: 2,
    DOLLARS_PER_POINT: 0.05,
    INTRAGROUP_COMPETITION: 2
  })
  var player = game.world.players[0]
  var bot1 = game.world.players[1]
  expect(player.teamIdx).toEqual(0)
  expect(bot1.teamIdx).toEqual(0)
  // We get all the payoff if we get all the points
  player.score = 20
  bot1.score = 0
  game.computePayoffs()
  expect(player.payoff).toEqual(1)
  // We get a payoff based on our portion of the in-group total
  bot1.score = 10
  game.computePayoffs()
  expect(player.payoff).toEqual(30 * 4/5 * 0.05)
})

test('calculate intergroup payoff', () => {
  var game = init_game({
    NUM_PLAYERS: 4,
    DOLLARS_PER_POINT: 0.1,
    INTERGROUP_COMPETITION: 2
  })
  var player = game.world.players[0]
  var bot1 = game.world.players[1]
  var bot2 = game.world.players[2]
  var bot3 = game.world.players[3]
  expect(player.teamIdx).toEqual(0)
  expect(bot1.teamIdx).toEqual(0)
  expect(bot2.teamIdx).toEqual(1)
  expect(bot3.teamIdx).toEqual(1)
  // Point distribution between groups determines payoff
  player.score = 20
  bot1.score = 0
  bot2.score = 20
  bot3.score = 40
  game.computePayoffs()
  expect(player.payoff).toEqual(80 * 1/10 * 0.1)
  // Point distribution within our group changes the payoff
  player.score = 10
  bot1.score = 10
  game.computePayoffs()
  expect(player.payoff).toEqual(80 * 1/10 * 0.1 * 0.5)
  // Point distribution in the out-group has no impact
  player.score = 20
  bot1.score = 0
  bot2.score = 10
  bot3.score = 50
  game.computePayoffs()
  expect(player.payoff).toEqual(80 * 1/10 * 0.1)
})
