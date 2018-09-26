# Adversarial collective sensing game

The adversarial collective sensing game is implemented in JavaScript
and must be compiled to create bundle.js
before being served by a web server.

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

Note: Updates to the bundle should be committed to version control.

## Managing dependencies

To add a new dependency, use the `yarn add` command:

    $ yarn add snargle-fraster

If it's a dependency only at build time, use `yarn add [pkg] --dev`.

This updates the `yarn.lock` file, which records the specific
releases which were used. Other developers will get those
releases when they run `yarn`. Updates to `yarn.lock`
should be committed to version control.
