var ACSG = require('./acsg')

game = ACSG({
  INCLUDE_HUMAN: true,
  NUM_PLAYERS: 3,
  DURATION: 60,
  ROWS: 25,
  COLUMNS: 25,
  NUM_FOOD: 8,
  VISIBILITY: 500,
  BOT_MOTION_RATE: 4,
  BLOCK_SIZE: 12,
  BLOCK_PADDING: 1,
  SEED: '19145822646'
},
function () { console.log('Finished.') })

game.run()
