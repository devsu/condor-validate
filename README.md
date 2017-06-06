# condor-validate

Validation middleware for [Condor GRPC Server](https://github.com/devsu/condor-framework). It provide helpers to validate requests and metadata.

[![Build Status](https://travis-ci.org/devsu/condor-validate.svg?branch=master)](https://travis-ci.org/devsu/condor-validate)
[![Coverage Status](https://coveralls.io/repos/github/devsu/condor-validate/badge.svg)](https://coveralls.io/github/devsu/condor-validate)

Built on top of [validator](https://github.com/chriso/validator.js) module, and inspired on [express-validator](https://github.com/ctavan/express-validator) and [koa-validate](https://github.com/RocksonZeta/koa-validate).

## Installation

```bash
npm i --save condor-validate
npm i --save condor-framework
```

## Usage

```js
const Condor = require('condor-framework');
const condorValidator = require('condor-validator');
const Greeter = require('./greeter');

const server = new Condor()
  .add('path/to/file.proto', 'GreeterService', new Greeter())
  .use(condorValidator(/* options */))
  .start();
```

And, then in your `Greeter` class:

```js
module.exports = class {
  sayHello(ctx) {
    ctx.check(ctx.req.name).notEmpty('Name cannot be empty');
    ctx.check(ctx.req.age).optional().isInt().gte(0, 'Age cannot be negative');
    ctx.check(ctx.req.other.email).optional().isEmail('Invalid email');
    ctx.check(ctx.meta.get('authorization')[0]).notEmpty();
    ctx.validate();
    return {'greeting': `Hello ${ctx.req.name}`};
  }
}
```

If there are one or more errors, `ctx.validate()` will throw an error with `INVALID_ARGUMENT` code, and the `ctx.errors` object in the detail, finishing the request. 

The user will receive an error like:

```json
{
  "code": 3,
  "details": "{\"request\": {\"name\": \"Name cannot be empty\", \"other.email\": \"Invalid email\"}}"
}
```

If you want to launch with another status code or with your own message, you can do it as well:

```js
// if there are errors, respond with cancelled status
ctx.validate(ctx.status.CANCELLED);

// if there are errors, respond with cancelled status and custom message
ctx.validate(ctx.status.CANCELLED, 'Request cancelled by the server');

// which is the same as
if (ctx.errors) {
  throw {
    'code': ctx.status.CANCELLED,
    'details': 'Request cancelled by server',
  };
}
```

## Arguments

### Options

## License and Credits

MIT License. Copyright 2017 

Built by the [GRPC experts](https://devsu.com) at Devsu.
