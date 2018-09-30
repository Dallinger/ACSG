var ACSG = require('./acsg')

game = ACSG({
  NUM_PLAYERS: 9,
  DURATION: 6,
  INCLUDE_HUMAN: true,
  BOT_STRATEGY: 'random',
  ROWS: 25,
  COLUMNS: 25,
  NUM_FOOD: 8,
  VISIBILITY: 50,
  BOT_MOTION_RATE: 4,
  BLOCK_SIZE: 12,
  BLOCK_PADDING: 1,
  SEED: '19145822646'
})

game.run(function () { console.log(game.serialize()) })
