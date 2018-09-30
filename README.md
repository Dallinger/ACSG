# Adversarial collective sensing game

The adversarial collective-sensing game is implemented in JavaScript and can be installed via npm:

```
npm install acsg
```

To instantiate and run a game:

```
var ACSG = require('acsg')

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
  BLOCK_PADDING: 1
  SEED: '19145822646',
})

game.run(function () { console.log(game.serialize()) })

```

## Installing dev tools

Make sure you have Node.js >= version 6.

First [install `yarn`](https://yarnpkg.com/en/docs/install).
(`yarn` is similar to `npm`, but better,
and uses the same package repository.)

Next run `yarn` to install the dependencies:

    $ yarn

## Building bundle.js

To update bundle.js:

    $ yarn run bundle

## Managing dependencies

To add a new dependency, use the `yarn add` command:

    $ yarn add snargle-fraster

If it's a dependency only at build time, use `yarn add [pkg] --dev`.

This updates the `yarn.lock` file, which records the specific
releases which were used. Other developers will get those
releases when they run `yarn`. Updates to `yarn.lock`
should be committed to version control.
