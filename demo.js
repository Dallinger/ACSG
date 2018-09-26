var util = require('util')
var css = require('dom-css')
var grid = require('./index')
var parse = require('parse-color')
var position = require('mouse-position')
var mousetrap = require('mousetrap')
var gaussian = require('gaussian')
var Rands = require('rands')

var r = new Rands()

var ROWS = 25
var COLUMNS = 25

NUM_PLAYERS = 100
NUM_FOOD = 3
VISIBILITY = 50
BOT_MOTION_RATE = 6
BLOCK_SIZE = 10
BLOCK_PADDING = 1

BLUE = [0.50, 0.86, 1.00]
YELLOW = [1.00, 0.86, 0.50]
GREEN = [0.51, 0.95, 0.61]

playersColors = [
  BLUE,
  YELLOW
]

food = []
players = []

var data = []
var background = []
for (var i = 0; i < ROWS; i++) {
  for (var j = 0; j < COLUMNS; j++) {
    data.push([0, 0, 0])
    background.push([0, 0, 0])
  }
}

var pixels = grid(data, {
  root: document.body,
  rows: ROWS,
  columns: COLUMNS,
  size: BLOCK_SIZE,
  padding: BLOCK_PADDING,
  background: [0.1, 0.1, 0.1],
  formatted: true
})

function randomPosition () {
  empty = false
  while (!empty) {
    position = [
      Math.floor(Math.random() * ROWS),
      Math.floor(Math.random() * COLUMNS)
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

Player.prototype.proceed = function (strategy) {
  actions = ['up', 'down', 'left', 'right']
  direction = actions[Math.floor(Math.random() * actions.length)]
  this.move(direction)
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
      if (this.position[0] < ROWS - 1) {
        newPosition[0] += 1
      }
      break

    case 'left':
      if (this.position[1] > 0) {
        newPosition[1] -= 1
      }
      break

    case 'right':
      if (this.position[1] < COLUMNS - 1) {
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

// Create the bots.
for (var i = 0; i < NUM_PLAYERS - 1; i++) {
  players.push(
    new Player({
      id: 1 + i,
      bot: true,
      position: randomPosition(),
      color: playersColors[Math.floor(Math.random() * playersColors.length)],
      motion: {
        speed: 8,
        nextMove: r.exponential(BOT_MOTION_RATE)
      },
      score: 0
    }),
  )
}

self = players[0]

Food = function (settings) {
  if (!(this instanceof Food)) {
    return new Food()
  }
  this.id = settings.id
  this.position = settings.position
  this.color = settings.color
  return this
}

for (var i = 0; i < NUM_FOOD; i++) {
  spawnFood()
}

function spawnFood () {
  food.push(
    new Food({
      id: i,
      position: randomPosition(),
      color: GREEN
    }),
  )
}

function updateScoreboard () {
  document.getElementById('score').innerHTML = players[0].score
}

start = Date.now()

pixels.frame(function () {
  now = Date.now()

  // Move the bots.
  for (var i = 1; i < players.length; i++) {
    if ((now - start) / 1000 > players[i].motion.nextMove) {
      players[i].motion.nextMove += r.exponential(BOT_MOTION_RATE)
      players[i].proceed()
    }
  }

  // Update the background.
  for (var i = 0; i < data.length; i++) {
    rand = Math.random() * 0.02
    background[i] = [
      background[i][0] * 0.95 + rand,
      background[i][1] * 0.95 + rand,
      background[i][2] * 0.95 + rand
    ]
  }
  data = background

  // Players consume the food.
  for (var j = 0; j < players.length; j++) {
    for (var i = 0; i < food.length; i++) {
      if (arraysEqual(players[j].position, food[i].position)) {
        food.splice(i, 1)
        spawnFood()
        players[j].score++
        updateScoreboard()
        break
      }
    }
  }

  // Draw the players.
  players.forEach(function (p) {
    data[(p.position[0]) * COLUMNS + p.position[1]] = p.color
  })
  food.forEach(function (f) {
    data[(f.position[0]) * COLUMNS + f.position[1]] = f.color
  })

  // Add the Gaussian mask.
  var g = gaussian(0, Math.pow(VISIBILITY, 2))
  rescaling = 1 / g.pdf(0)
  x = self.position[0]
  y = self.position[1]
  for (var i = 0; i < COLUMNS; i++) {
    for (var j = 0; j < ROWS; j++) {
      dimness = g.pdf(distance(x, y, i, j)) * rescaling
      idx = (i * COLUMNS + j)
      data[idx] = [
        data[idx][0] * dimness,
        data[idx][1] * dimness,
        data[idx][2] * dimness
      ]
    }
  }
  pixels.update(data)
})

//
// Key bindings
//
directions = ['up', 'down', 'left', 'right']
lock = false
directions.forEach(function (direction) {
  Mousetrap.bind(direction, function () {
    if (!lock) {
      players[0].move(direction)
    }
    lock = true
    return false
  })
  Mousetrap.bind(direction, function () {
    lock = false
    return false
  }, 'keyup')
})

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
