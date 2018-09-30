var util = require('util')
var css = require('dom-css')
var grid = require('./pixels')
var parse = require('parse-color')
var position = require('mouse-position')
var mousetrap = require('mousetrap')
var gaussian = require('gaussian')
var Rands = require('rands')
var seedrandom = require('seedrandom')
const uuidv4 = require('uuid/v4')

function ACSG (g) {
  if (!(this instanceof ACSG)) return new ACSG(g)
  var self = this

  // Check if this is a new game or a replay.
  if (g.id) {          // A replay.
    this.UUID = g.id
    actions = g.data.actions
    actionTimestamps = g.data.timestamps
    opts = g.config
    replay = true
  } else {             // A new game.
    opts = g.config || {}
    opts.NUM_PLAYERS = opts.NUM_PLAYERS || 10
    opts.INCLUDE_HUMAN = opts.INCLUDE_HUMAN || false
    opts.DURATION = opts.DURATION || 120
    opts.ROWS = opts.ROWS || 25
    opts.COLUMNS = opts.COLUMNS || 25
    opts.NUM_FOOD = opts.NUM_FOOD || 5
    opts.VISIBILITY = opts.VISIBILITY || 500
    opts.BOT_MOTION_RATE = opts.BOT_MOTION_RATE || 8
    opts.BLOCK_SIZE = opts.BLOCK_SIZE || 15
    opts.BLOCK_PADDING = opts.BLOCK_PADDING || 1
    opts.SEED = opts.SEED || performance.now()
    opts.BOT_STRATEGY = opts.BOT_STRATEGY || 'random'
    this.UUID = uuidv4()
    replay = false
    actions = []
    actionTimestamps = []
  }

  // Seed event RNG.
  Math.seedrandom(opts.SEED)
  var r = new Rands()

  // Seed background animation RNG.
  var backgroundRngFunc = seedrandom(performance.now())
  var rBackground = new Rands(backgroundRngFunc)

  if (opts.INCLUDE_HUMAN) {
    this._NUM_BOTS = opts.NUM_PLAYERS - 1
  } else {
    this._NUM_BOTS = opts.NUM_PLAYERS
  }

  GREEN = [0.51, 0.95, 0.61]

  teamColors = [
    [0.50, 0.86, 1.00], // Blue
    [1.00, 0.86, 0.50] // Yellow
  ]

  food = []
  players = []
  gameOver = false

  var data = []
  var background = []
  for (var i = 0; i < opts.ROWS; i++) {
    for (var j = 0; j < opts.COLUMNS; j++) {
      data.push([0, 0, 0])
      background.push([0, 0, 0])
    }
  }

  var pixels = grid(data, {
    root: document.body,
    rows: opts.ROWS,
    columns: opts.COLUMNS,
    size: opts.BLOCK_SIZE,
    padding: opts.BLOCK_PADDING,
    background: [0.1, 0.1, 0.1],
    formatted: true
  })

  this.serialize = function () {
    return JSON.stringify({
      'id': this.UUID,
      'data': {
        'actions': actions,
        'timestamps': actionTimestamps
      },
      'config': opts
    })
  }

  function randomPosition () {
    empty = false
    while (!empty) {
      position = [
        Math.floor(Math.random() * opts.ROWS),
        Math.floor(Math.random() * opts.COLUMNS)
      ]
      empty = isEmpty(position)
    }
    return position
  }

  function hasPlayer (position) {
    for (var i = 0; i < players.length; i++) {
      if (arraysEqual(players[i].position, position)) {
        return true
      }
    }
    return false
  }

  function hasFood (position) {
    for (var i = 0; i < food.length; i++) {
      if (food[i].position === position) {
        return true
      }
    }
    return false
  }

  function isEmpty (position) {
    return !hasPlayer(position) && !hasFood(position)
  }

  Player = function (config) {
    if (!(this instanceof Player)) {
      return new Player()
    }
    config = config || {}
    this.id = config.id || players.length
    this.position = config.position || randomPosition()
    this.teamIdx = Math.floor(Math.random() * teamColors.length)
    this.color = config.color || teamColors[this.teamIdx]
    this.score = config.score || 0
    this.bot = config.bot || false
    this.history = {
      'actions': [],
      'positions': [],
      'timestamps': []
    }
    this.history.positions.push(this.position)
    this.history.timestamps.push(0)
    this.history.actions.push(null)
    return this
  }

  Player.prototype.move = function (direction) {
    newPosition = this.position.slice()
    switch (direction) {
      case 'up':
        if (this.position[0] > 0) {
          newPosition[0] -= 1
        }
        break

      case 'down':
        if (this.position[0] < opts.ROWS - 1) {
          newPosition[0] += 1
        }
        break

      case 'left':
        if (this.position[1] > 0) {
          newPosition[1] -= 1
        }
        break

      case 'right':
        if (this.position[1] < opts.COLUMNS - 1) {
          newPosition[1] += 1
        }
        break

      default:
        console.log('Direction not recognized.')
    }
    if (!hasPlayer(newPosition)) {
      this.position = newPosition
    }
  }

  Player.prototype.consume = function (t) {
    for (var i = 0; i < food.length; i++) {
      if (arraysEqual(this.position, food[i].position)) {
        food.splice(i, 1)
        spawnFood()
        this.score++
        updateScoreboard()
        break
      }
    }
  }

  //
  // Bots.
  //

  Bot = function (config) {
    Player.call(this, config)
    this.bot = true
  }

  Bot.prototype = Object.create(Player.prototype)

  Bot.prototype.move = function () {
    if (opts.BOT_STRATEGY == 'random') {
      direction = this.strategy.random()
    }
    botActions.push(direction)
    this.history.actions.push(direction)
    Player.prototype.move.call(this, direction)
  }

  Bot.prototype.strategy = {}

  Bot.prototype.strategy.random = function () {
    dirs = ['up', 'down', 'left', 'right']
    return dirs[Math.floor(Math.random() * dirs.length)]
  }

  // Create the human.
  if (opts.INCLUDE_HUMAN) {
    players.push(new Player())
  }

  // Create the bots.
  for (var i = 0; i < this._NUM_BOTS; i++) {
    players.push(new Bot())
  }

  ego = players[0]

  Food = function (config) {
    if (!(this instanceof Food)) {
      return new Food()
    }
    config = config || {}
    this.position = config.position || randomPosition()
    this.color = config.color || GREEN
    return this
  }

  for (var i = 0; i < opts.NUM_FOOD; i++) {
    spawnFood()
  }

  function spawnFood () {
    food.push(new Food())
  }

  function updateScoreboard () {
    document.getElementById('score').innerHTML = players[0].score
  }

  this.run = function (callback) {
    callback = callback || function () { console.log('Game finished.') }
    start = performance.now()

    // Pregenerate bot motion timings, sans direction.
    botActionTimestamps = []
    botActions = []
    whichBotMoves = []
    t = 0
    humanOffset = opts.INCLUDE_HUMAN ? 1 : 0
    while (true) {
      waitTime = r.exponential(opts.BOT_MOTION_RATE * this._NUM_BOTS)
      if (t + waitTime > opts.DURATION) {
        break
      }
      t += waitTime
      botActionTimestamps.push(t)
      idx = Math.floor(Math.random() * this._NUM_BOTS) + humanOffset
      whichBotMoves.push(idx)
    }
    lastBotActionIdx = -1
    lastHumanActionIdx = -1
    lastBotActionTimestamp = 0
    lastHumanActionTimestamp = 0

    completed = false
    pixels.frame(function () {
      elapsedTime = (performance.now() - start) / 1000

      // If original game w/ human, register all moves.
      if (opts.INCLUDE_HUMAN && !replay) {
        numActionsToDo = actions.length - actionTimestamps.length
        for (var i = 0; i < numActionsToDo; i++) {
          actionTimestamps.push(elapsedTime)
        }
      }

      // Execute all unexecuted actions up to elapsedTime.
      while (true) {
        nextBotT = botActionTimestamps[lastBotActionIdx + 1] || Infinity
        nextHumanT = actionTimestamps[lastHumanActionIdx + 1] || Infinity

        if (nextBotT > elapsedTime && nextHumanT > elapsedTime) {
          break
        }

        if (nextBotT <= nextHumanT) {  // Break ties in favor of bots.
          // Carry out bot action.
          lastBotActionIdx += 1
          currentBot = players[whichBotMoves[lastBotActionIdx]]
          currentBot.move()
          currentBot.consume()
          currentBot.history.positions.push(currentBot.position)
          currentBot.history.timestamps.push(nextBotT)
        } else {
          // Carry out human action.
          lastHumanActionIdx += 1
          players[0].move(actions[lastHumanActionIdx])
          players[0].consume()
          players[0].history.positions.push(currentBot.position)
          players[0].history.timestamps.push(nextHumanT)
        }
      }

      // Update the background.
      for (var i = 0; i < data.length; i++) {
        rand = rBackground.uniform() * 0.02
        background[i] = [
          background[i][0] * 0.95 + rand,
          background[i][1] * 0.95 + rand,
          background[i][2] * 0.95 + rand
        ]
      }
      data = background

      // Draw the players.
      players.forEach(function (p) {
        data[(p.position[0]) * opts.COLUMNS + p.position[1]] = p.color
      })
      food.forEach(function (f) {
        data[(f.position[0]) * opts.COLUMNS + f.position[1]] = f.color
      })

      // Add the Gaussian mask.
      var g = gaussian(0, Math.pow(opts.VISIBILITY, 2))
      rescaling = 1 / g.pdf(0)
      x = ego.position[0]
      y = ego.position[1]
      for (var i = 0; i < opts.COLUMNS; i++) {
        for (var j = 0; j < opts.ROWS; j++) {
          dimness = g.pdf(distance(x, y, i, j)) * rescaling
          idx = (i * opts.COLUMNS + j)
          data[idx] = [
            data[idx][0] * dimness,
            data[idx][1] * dimness,
            data[idx][2] * dimness
          ]
        }
      }

      if (lastBotActionIdx < whichBotMoves.length - 1) {
        pixels.update(data)
      } else if (!gameOver) {
        gameOver = true
        callback()
      }
    })
  }

  //
  // Key bindings
  //
  if (opts.INCLUDE_HUMAN) {
    directions = ['up', 'down', 'left', 'right']
    lock = false
    directions.forEach(function (direction) {
      Mousetrap.bind(direction, function () {
        if (!lock && !gameOver) {
          actions.push(direction)
        }
        lock = true
        return false
      })
      Mousetrap.bind(direction, function () {
        lock = false
        return false
      }, 'keyup')
    })
  }

  function arraysEqual (arr1, arr2) {
    for (var i = arr1.length; i--;) {
      if (arr1[i] !== arr2[i]) {
        return false
      }
    }
    return true
  }

  function distance (x, y, xx, yy) {
    return Math.sqrt((xx - x) * (xx - x) + (yy - y) * (yy - y))
  }
}

module.exports = ACSG
