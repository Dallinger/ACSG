var util = require('util')
var css = require('dom-css')
var grid = require('./pixels')
var parse = require('parse-color')
var position = require('mouse-position')
var mousetrap = require('mousetrap')
var gaussian = require('gaussian')
var Rands = require('rands')
var seedrandom = require('seedrandom')

function ACSG (opts, callback) {
  if (!(this instanceof ACSG)) return new ACSG(opts, callback)
  var self = this
  opts = opts || {}
  callback = callback || function () { console.log('Done.') }
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
  opts.SEED = opts.SEED || Date.now()

  // Seed event RNG.
  Math.seedrandom(opts.SEED)
  var r = new Rands()

  // Seed background animation RNG.
  var backgroundRngFunc = seedrandom(Date.now())
  var rBackground = new Rands(backgroundRngFunc)

  if (opts.INCLUDE_HUMAN) {
    opts._NUM_BOTS = opts.NUM_PLAYERS - 1
  } else {
    opts._NUM_BOTS = opts.NUM_PLAYERS
  }

  BLUE = [0.50, 0.86, 1.00]
  YELLOW = [1.00, 0.86, 0.50]
  GREEN = [0.51, 0.95, 0.61]

  playersColors = [
    BLUE,
    YELLOW
  ]

  food = []
  players = []
  scheduledHumanMoves = []
  self.events = []

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

  Player = function (settings) {
    if (!(this instanceof Player)) {
      return new Player()
    }
    this.id = settings.id
    this.position = settings.position
    this.color = settings.color
    this.motion = settings.motion
    this.score = settings.score
    this.bot = settings.bot
    return this
  }

  Player.prototype.strategy = function () {
    actions = ['up', 'down', 'left', 'right']
    direction = actions[Math.floor(Math.random() * actions.length)]
    return direction
  }

  Player.prototype.move = function (direction) {
    if (direction == undefined) {
      direction = this.strategy()
    }
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

  if (opts.INCLUDE_HUMAN) {
    // Create the ego player.
    players.push(
      new Player({
        id: 0,
        bot: false,
        position: randomPosition(),
        color: playersColors[Math.floor(Math.random() * playersColors.length)],
        motion: {
          speed: 8,
          nextMove: null
        },
        score: 0
      }),
    )
  }

  // Create the bots.
  for (var i = 0; i < opts._NUM_BOTS; i++) {
    players.push(
      new Player({
        id: 1 + i,
        bot: true,
        position: randomPosition(),
        color: playersColors[Math.floor(Math.random() * playersColors.length)],
        motion: {
          speed: 8,
          nextMove: r.exponential(opts.BOT_MOTION_RATE)
        },
        score: 0
      }),
    )
  }

  ego = players[0]

  Food = function (settings) {
    if (!(this instanceof Food)) {
      return new Food()
    }
    this.id = settings.id
    this.position = settings.position
    this.color = settings.color
    return this
  }

  for (var i = 0; i < opts.NUM_FOOD; i++) {
    spawnFood()
  }

  function spawnFood () {
    pos = randomPosition()
    food.push(
      new Food({
        id: i,
        position: pos,
        color: GREEN
      }),
    )
  }

  function updateScoreboard () {
    document.getElementById('score').innerHTML = players[0].score
  }

  this.run = function () {
    start = Date.now()

    // Pregenerate bot motion events, sans direction.
    motionTimestamps = []
    whichBotMoves = []
    t = 0
    humanOffset = opts.INCLUDE_HUMAN ? 1 : 0
    while (t < opts.DURATION) {
      waitTime = r.exponential(opts.BOT_MOTION_RATE * opts._NUM_BOTS)
      t += waitTime
      motionTimestamps.push(t)
      idx = Math.floor(Math.random() * opts._NUM_BOTS) + humanOffset
      whichBotMoves.push(idx)
    }
    lastIdx = -1
    lastTimestamp = 0

    completed = false
    pixels.frame(function () {
      now = Date.now()

      elapsedTime = (now - start) / 1000

      // Move the bots to reflect the last state before elapsedTime.
      while (lastTimestamp < elapsedTime) {
        lastIdx += 1
        lastTimestamp = motionTimestamps[lastIdx]
        currentBot = players[whichBotMoves[lastIdx]]
        currentBot.move()
        currentBot.consume()
      }

      // Move the human to reflect all moves registered before lastTimestamp.
      if (opts.INCLUDE_HUMAN) {
        while (scheduledHumanMoves.length > 0) {
          nextMove = scheduledHumanMoves.shift()
          players[0].move(nextMove)
          self.events.push([elapsedTime, nextMove])
          players[0].consume()
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

      // When game is done, execute callback.
      if (lastIdx < whichBotMoves.length) {
        pixels.update(data)
      } else if (!completed) {
        completed = true
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
        if (!lock) {
          scheduledHumanMoves.push(direction)
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
