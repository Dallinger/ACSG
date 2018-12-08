var util = require('util')
var css = require('dom-css')
var fs = require('fs')
var grid = require('./pixels')
var parse = require('parse-color')
var position = require('mouse-position')
var mousetrap = require('mousetrap')
var gaussian = require('gaussian')
var Rands = require('rands')
var seedrandom = require('seedrandom')
var uuidv4 = require('uuid/v4')

var GREEN = [0.51, 0.95, 0.61]
var BLUE = [0.50, 0.86, 1.00]
var YELLOW = [1.00, 0.86, 0.50]
var BLACK = [0, 0, 0]
var GRAY = [0.1, 0.1, 0.1]

var teamColors = [BLUE, YELLOW]

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

function extend(obj, src) {
  for (var key in src) {
    if (src.hasOwnProperty(key)) obj[key] = src[key];
  }
  return obj
}

function filenameFrom(data) {
  var experimentID = data.id
  return experimentID + '-decompressed.json'
}

var acsg = {}  // Module namespace

acsg.Browser = (function () {

  var Browser = function (game, opts) {
      if (!(this instanceof Browser)) {
          return new Browser(game, opts)
      }
      this.game = game
      // Seed background animation RNG.
      var backgroundRngFunc = seedrandom(this.now())
      this.rBackground = new Rands(backgroundRngFunc)
      this.scoreboard = document.getElementById('score')
      this.clock = document.getElementById('clock')
      this.data = []
      this.background = []
      this.opts = opts

      for (var i = 0; i < opts.ROWS; i++) {
        for (var j = 0; j < opts.COLUMNS; j++) {
          this.data.push(BLACK)
          this.background.push(BLACK)
        }
      }

      this.pixels = grid(this.data, {
        root: document.body,
        rows: opts.ROWS,
        columns: opts.COLUMNS,
        size: opts.BLOCK_SIZE,
        padding: opts.BLOCK_PADDING,
        background: GRAY,
        formatted: true
      })

      if (this.opts.INCLUDE_HUMAN) {
        this._bindKeys()
      }
  }

  Browser.prototype.now = function () {
    return performance.now()
  }

  Browser.prototype.updateScoreboard = function (score) {
    this.scoreboard.innerHTML = score
  }

  Browser.prototype.updateClock = function (t) {
    this.clock.innerHTML = ((t > 0) ? t.toFixed(1) : '0.0')
  }

  Browser.prototype.draw = function (position, color) {
    // Covert x, y to linear index
    index = position[0] * this.opts.COLUMNS + position[1]
    this.data[index] = color
  }
  /**
   * If in real-time mode, for every screen refresh update,
   * call the callback function with the actual current timestamp.
   *
   * If we're not in real-time mode, return a timestamp that's later than
   * the end of the experiment being replayed, so it executes all actions
   * as fast as possible.
   *
   * See:
   * https://github.com/regl-project/regl/blob/gh-pages/API.md#per-frame-callbacks
   */
  Browser.prototype.eventStream = function (callback) {
    var self = this
    if (! this.opts.REAL_TIME) {
      // Jump to the end of the game, so we process all events immediately
      var afterGameOver = (this.now() + this.opts.DURATION + 1) * 1000
      this.pixels.frame(function (){ callback(afterGameOver) })
    } else {
      var self = this
      this.pixels.frame(function (){ callback(self.now()) })
    }
  }

  Browser.prototype.updateMask = function (ego) {
    var g = gaussian(0, Math.pow(this.opts.VISIBILITY, 2))
    var rescaling = 1 / g.pdf(0)
    var x = ego.position[0]
    var y = ego.position[1]
    var dimness, idx

    for (var i = 0; i < this.opts.COLUMNS; i++) {
      for (var j = 0; j < this.opts.ROWS; j++) {
        dimness = g.pdf(distance(x, y, i, j)) * rescaling
        idx = (i * this.opts.COLUMNS + j)
        this.data[idx] = [
          this.data[idx][0] * dimness,
          this.data[idx][1] * dimness,
          this.data[idx][2] * dimness
        ]
      }
    }
  }

  Browser.prototype.updateGrid = function (world) {
    this._updateBackground()
    world.drawTo(this)
    this.pixels.update(this.data)
  }

  Browser.prototype.exportFile = function (data, filename) {
      var blob = new Blob([JSON.stringify(data)], {type: 'application/json'})
      var url = URL.createObjectURL(blob)
      var el = document.createElement('a')
      el.style.display = 'none'
      el.id = 'downloadAnchorElem'
      el.href = url
      el.download = filename
      el.textContent = 'Download'
      document.body.appendChild(el)
      el.click()
  }

  Browser.prototype._updateBackground = function () {
    for (var i = 0; i < this.data.length; i++) {
      rand = this.rBackground.uniform() * 0.02
      this.background[i] = [
        this.background[i][0] * 0.95 + rand,
        this.background[i][1] * 0.95 + rand,
        this.background[i][2] * 0.95 + rand
      ]
    }
    this.data = this.background
  }

  Browser.prototype._bindKeys = function () {
    var self = this
    var directions = ['up', 'down', 'left', 'right']
    var lock = false

    directions.forEach(function (direction) {
      Mousetrap.bind(direction, function () {
        if (!lock) {
          self.game.playerMoved(direction)
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

  return Browser
}())


acsg.CLI = (function () {

  var CLI = function (opts) {
      if (!(this instanceof CLI)) {
          return new CLI(opts)
      }

      this.opts = opts
      this._performance = require('perf_hooks')
  }

  CLI.prototype.now = function () {
    return this._performance.performance.now()
  }

  CLI.prototype.draw = function (position, color) {
    // Noop
  }

  CLI.prototype.updateClock = function (t) {
    // Noop
  }

  CLI.prototype.updateGrid = function (world, elapsedTime) {
    // Noop
  }

  CLI.prototype.updateMask = function (ego) {
    // Noop
  }

  CLI.prototype.updateScoreboard = function (score) {
    // Noop
  }

  CLI.prototype.eventStream = function (callback) {
    var afterGameOver = (this.now() + this.opts.DURATION + 1) * 1000
    callback(afterGameOver)
  }

  CLI.prototype.exportFile = function (data, filename) {
    var content = JSON.stringify(data)
    fs.writeFileSync('data/' + filename, content, function (err) {
      if (err) throw err
    })
  }

  return CLI
}())


acsg.World = (function () {

  var World = function (settings) {
      if (!(this instanceof World)) {
          return new World(settings)
      }

      this.rows = settings.ROWS
      this.columns = settings.COLUMNS
      this.botStrategy = settings.BOT_STRATEGY
      this.food = []
      this.players = []
      this.states = []
  }

  World.prototype.drawTo = function (ui) {
    // Draw the players and food
    this.players.forEach(function (p) {
      ui.draw(p.position, p.color)
    })
    this.food.forEach(function (f) {
      ui.draw(f.position, f.color)
    })

    ui.updateMask(this.ego())
  }

  World.prototype.randomPosition = function () {
    empty = false
    while (!empty) {
      position = [
        Math.floor(Math.random() * this.rows),
        Math.floor(Math.random() * this.columns)
      ]
      empty = this.isEmpty(position)
    }
    return position
  }

  World.prototype.hasPlayer = function (position) {
    var numPlayers = this.players.length
    for (var i = 0; i < numPlayers; i++) {
      if (arraysEqual(this.players[i].position, position)) {
        return true
      }
    }
    return false
  }

  World.prototype.hasFood = function (position) {
    var numFood = this.food.length
    for (var i = 0; i < numFood; i++) {
      if (this.food[i].position === position) {
        return true
      }
    }
    return false
  }

  World.prototype.isEmpty = function (position) {
    return !this.hasPlayer(position) && !this.hasFood(position)
  }

  World.prototype.spawnFood = function () {
    this.food.push(new acsg.Food({'world': this}))
  }

  World.prototype.spawnPlayer = function () {
    this.players.push(new acsg.Player({'world': this}))
  }

  World.prototype.spawnBot = function () {
    this.players.push(new acsg.Bot({'world': this}))
  }

  World.prototype.ego = function () {
    return this.players[0]
  }

  World.prototype.recordStateAt = function (timestamp) {
    this.states.push(this.state(timestamp))
  }

  World.prototype.state = function (t) {
    s = {
      'timestamp': t,
      'players': this.players,
      'food': this.food
    }
    return acsg.State(s)
  }

  World.prototype.serialize = function () {
    var players = []
        ,food = []
        ,states = []

    for(var i = 0; i < this.players.length; i++) {
      players.push(this.players[i].serialize())
    }
    for(var i = 0; i < this.food.length; i++) {
      food.push(this.food[i].serialize())
    }
    for(var i = 0; i < this.states.length; i++) {
      states.push(this.states[i].serialize())
    }
    return {
      players: players,
      food: food,
      states: states
    }
  }

  return World
}())

acsg.State = (function () {
  State = function (config) {
    if (!(this instanceof State)) {
      return new State(config)
    }
    this.timestamp = config.timestamp
    // XXX Could we just store the serialized versions here?
    this.players = config.players
    this.food = config.food
  }

  State.prototype.serialize = function () {
    var players = []
        ,food = []

    for(var i = 0; i < this.players.length; i++) {
      players.push(this.players[i].serialize())
    }
    for(var i = 0; i < this.food.length; i++) {
      food.push(this.food[i].serialize())
    }

    return {
      timestamp: this.timestamp,
      players: players,
      food: food
    }
  }

  return State
}())

acsg.Player = (function () {

  Player = function (config) {
    if (!(this instanceof Player)) {
      return new Player(config)
    }
    this.world = config.world
    this.id = this.world.players.length
    this.position = this.world.randomPosition()
    this.teamIdx = Math.floor(Math.random() * teamColors.length)
    this.color = config.color || teamColors[this.teamIdx]
    this.score = config.score || 0

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
        if (this.position[0] < this.world.rows - 1) {
          newPosition[0] += 1
        }
        break

      case 'left':
        if (this.position[1] > 0) {
          newPosition[1] -= 1
        }
        break

      case 'right':
        if (this.position[1] < this.world.columns - 1) {
          newPosition[1] += 1
        }
        break

      default:
        console.log('Direction not recognized.')
    }
    if (!this.world.hasPlayer(newPosition)) {
      this.position = newPosition
    }
    return direction
  }

  Player.prototype.consume = function (t) {
    for (var i = 0; i < this.world.food.length; i++) {
      if (arraysEqual(this.position, this.world.food[i].position)) {
        this.world.food.splice(i, 1)
        this.world.spawnFood()
        this.score++
        break
      }
    }
    return this.score
  }

  Player.prototype.serialize = function () {
    return {
      id: this.id,
      position: this.position,
      teamIdx: this.teamIdx,
      color: this.color,
      score: this.score,
      bot: false
    }
  }
  return Player
}())

acsg.Bot = (function () {

  var Bot = function (config) {
      if (!(this instanceof Bot)) {
          return new Bot(config)
      }

      acsg.Player.call(this, config)
      this.strategyName = this.world.botStrategy
  }

  Bot.prototype = Object.create(Player.prototype)

  Bot.prototype.move = function () {
    var direction = this.strategy[this.strategyName]()
    Player.prototype.move.call(this, direction)
    return direction
  }

  Bot.prototype.strategy = {}

  Bot.prototype.strategy.random = function () {
    dirs = ['up', 'down', 'left', 'right']
    return dirs[Math.floor(Math.random() * dirs.length)]
  }

  Bot.prototype.serialize = function () {
    var data = acsg.Player.prototype.serialize.call(this)
    data.bot = true
    return data
  }

  return Bot
}())

acsg.Food = (function () {
  var Food = function (config) {
    if (!(this instanceof Food)) {
      return new Food(config)
    }
    this.world = config.world
    this.position = config.position || this.world.randomPosition()
    this.color = config.color || GREEN
    return this
  }

  Food.prototype.serialize = function () {
    return {
      position: this.position,
      color: this.color,
    }
  }
  return Food
}())


acsg.Game = (function () {

  var Game = function (g) {
    if (!(this instanceof Game)) return new Game(g)

    // Check if this is a new game or a replay.
    if (g.id) {          // A replay.
      this.UUID = g.id
      this.humanActions = g.data.actions
      this.humanActionTimestamps = g.data.timestamps
      this.opts = g.config
      this.replay = true
      this.opts.REAL_TIME = g.config.REAL_TIME || false
    } else {             // A new game.
      this.opts = opts = g.config || {}
      this.opts.REAL_TIME = true
      this.opts.NUM_PLAYERS = opts.NUM_PLAYERS || 10
      this.opts.INCLUDE_HUMAN = opts.INCLUDE_HUMAN || false
      this.opts.DURATION = opts.DURATION || 120
      this.opts.ROWS = opts.ROWS || 25
      this.opts.COLUMNS = opts.COLUMNS || 25
      this.opts.NUM_FOOD = opts.NUM_FOOD || 5
      this.opts.VISIBILITY = opts.VISIBILITY || 500
      this.opts.BOT_MOTION_RATE = opts.BOT_MOTION_RATE || 8
      this.opts.BLOCK_SIZE = opts.BLOCK_SIZE || 15
      this.opts.BLOCK_PADDING = opts.BLOCK_PADDING || 1
      this.opts.BOT_STRATEGY = opts.BOT_STRATEGY || 'random'
      this.UUID = uuidv4()
      this.replay = false
      this.humanActions = []
      this.humanActionTimestamps = []
    }
    if (this.opts.IS_CLI) {
      this.ui = acsg.CLI(this.opts)
    } else {
      this.ui = acsg.Browser(this, this.opts)
    }

    if (this.opts.INCLUDE_HUMAN) {
      this.numBots = this.opts.NUM_PLAYERS - 1
    } else {
      this.numBots = this.opts.NUM_PLAYERS
    }
    this.opts.SEED = this.opts.SEED || this.ui.now()

    // Seed event RNG.
    Math.seedrandom(this.opts.SEED)
    this.eventRandomizer = new Rands()

    this.gameOver = false
    this.world = acsg.World(this.opts)

    // Create the human.
    if (this.opts.INCLUDE_HUMAN) {
      this.world.spawnPlayer()
    }

    // Create the bots.
    for (var i = 0; i < this.numBots; i++) {
      this.world.spawnBot()
    }

    for (var i = 0; i < this.opts.NUM_FOOD; i++) {
      this.world.spawnFood()
    }
  }

  Game.prototype.playerMoved = function (direction) {
    if (!this.gameOver) {
      this.humanActions.push(direction)
    }
  }

  Game.prototype.serializeActions = function () {
    return JSON.stringify({
      'id': this.UUID,
      'data': {
        'actions': this.humanActions,
        'timestamps': this.humanActionTimestamps
      },
      'config': opts
    })
  }

  Game.prototype.serializeFullState = function () {
    var data = {
      'id': this.UUID,
      'data': {
        'actions': this.humanActions,
        'timestamps': this.humanActionTimestamps
      },
      'config': this.opts,
    }
    data = extend(data, this.world.serialize())
    return data
  }

  Game.prototype.pregenerateBotMotion = function () {
    // Pregenerate bot motion timings, sans direction. Since the timing and
    // direction of all bot movement is deterministic based on the seed
    // to the random number generator, we can pregenerate a sequence of
    // time+bot pairs to execute later.
    var motion = {timestamps: [], botIds: []}
        ,humanOffset = this.opts.INCLUDE_HUMAN ? 1 : 0
        ,t = 0
        ,waitTime
        ,idx

    while (true) {
      waitTime = this.eventRandomizer.exponential(this.opts.BOT_MOTION_RATE * this.numBots)
      if (t + waitTime > this.opts.DURATION) {
        break
      }
      t += waitTime
      motion.timestamps.push(t)
      idx = Math.floor(Math.random() * this.numBots) + humanOffset
      motion.botIds.push(idx)
    }
    return motion
  }

  Game.prototype.unbufferHumanMoves = function (timestamp) {
    // If original game w/ human player, register any human moves
    // added to the actions list with the current tick's timestamp
    // so they can be processed on the next update.
    var newActionCount

    if (this.opts.INCLUDE_HUMAN && !this.replay) {
      newActionCount = this.humanActions.length - this.humanActionTimestamps.length
      for (var i = 0; i < newActionCount; i++) {
        this.humanActionTimestamps.push(timestamp)
      }
    }
  }

  Game.prototype.run = function (callback) {
    var self = this
    var callback = callback || function () { console.log('Game finished.') }
    var start = this.ui.now()
    var botActions = []
    var lastBotActionIdx = -1
    var lastHumanActionIdx = -1
    var players = self.world.players
    var ego = self.world.ego()
    var botMotion = this.pregenerateBotMotion()

    this.world.recordStateAt(0)
    this.ui.eventStream(function (now) {
      elapsedTime = (now - start) / 1000
      self.unbufferHumanMoves(elapsedTime)

      // Execute all unexecuted actions up to elapsedTime.
      while (true) {
        nextBotT = botMotion.timestamps[lastBotActionIdx + 1] || Infinity
        nextHumanT = self.humanActionTimestamps[lastHumanActionIdx + 1] || Infinity

        if (nextBotT > elapsedTime && nextHumanT > elapsedTime) {
          break
        }

        if (nextBotT <= nextHumanT) {  // Break ties in favor of bots.
          // Carry out bot action.
          lastBotActionIdx += 1
          currentBot = players[botMotion.botIds[lastBotActionIdx]]
          botActions.push(currentBot.move())
          currentBot.consume()
          self.world.recordStateAt(nextBotT)
        } else {
          // Carry out human action.
          lastHumanActionIdx += 1
          ego.move(self.humanActions[lastHumanActionIdx])
          self.ui.updateScoreboard(ego.consume())
          self.world.recordStateAt(nextHumanT)
        }
      }

      self.ui.updateGrid(self.world)
      self.ui.updateClock(self.opts.DURATION - elapsedTime)

      if (lastBotActionIdx >= botMotion.botIds.length - 1) {
        if (!self.gameOver) {
          self.gameOver = true
          callback()
        }
      }
    })
  }

  // Download the serialized game as a JSON file.
  Game.prototype.exportFullGameData = function () {
    var data = this.serializeFullState(),
        filename = filenameFrom(data)

    this.ui.exportFile(data, filename)
    return filename
  }

  return Game
}())

module.exports = acsg
