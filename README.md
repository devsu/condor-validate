# condor-validate

Validation middleware for [Condor GRPC Server](https://github.com/devsu/condor-framework). It provide helpers to validate requests and metadata.

[![Build Status](https://travis-ci.org/devsu/condor-validate.svg?branch=master)](https://travis-ci.org/devsu/condor-validate)
[![Coverage Status](https://coveralls.io/repos/github/devsu/condor-validate/badge.svg)](https://coveralls.io/github/devsu/condor-validate)

## Installation

```bash
npm i --save condor-validate
npm i --save condor-framework
```

## Usage

```js
const Condor = require('condor-framework');
const validate = require('condor-validate');
const Greeter = require('./greeter');

const server = new Condor()
  .add('path/to/file.proto', 'GreeterService', new Greeter())
  .use(validate())
  .start();
```

And, then in your `Greeter` class:

```js
module.exports = class {
  sayHello(ctx) {
    // check the values of request
    ctx.checkRequest('name').notEmpty('Name cannot be empty');
    ctx.checkRequest('age').optional().isInt().gte(0, 'Age cannot be negative');
    ctx.checkRequest('other.email').optional().isEmail('Invalid email');
    
    // checks the value of ctx.metadata.get('authorization')[0]
    ctx.checkMetadata('authorization').notEmpty();
    
    // you can determine the index of metadata to check
    ctx.checkMetadata('authorization', 1).notEmpty();
    
    // You can also check using jsonpath (view https://github.com/dchester/jsonpath)
    ctx.checkRequest('$.store.book[*].author').first().notEmpty();
    
    // if any errors, finalizes the call
    ctx.validate();
    
    // this line will execute only if there aren't any errors
    return {'greeting': `Hello ${ctx.req.name}`};
  }
}
```

### API

- `checkRequest(field)`. Checks the field in the request. Field is an string that can be simple, nested, contain arrays, or be a [jsonpath](https://github.com/dchester/jsonpath):

  - `simple`: When the property you want to check is `ctx.req.simple`
  - `nested.field`: When the property you want to check is `ctx.req.nested.field`
  - `other[0].field`: When the property you want to check is `ctx.req.other[0].field`
  - `$.another[0].field`: When you want to use json path to access the property. See `[jsonpath](https://github.com/dchester/jsonpath)` documentation for more information.

- `checkMetadata(field, [index])`: Checks the filed in the authorization metadata. If no index provided, index 0 will be used.
- `validate([code], [message])`: Validates if there are any errors in `ctx.errors`.

If there are one or more errors, `ctx.validate()` will throw an error with `INVALID_ARGUMENT` code, and the `ctx.errors` object in the detail, finishing the request. 

The user will receive an error like:

```json
{
  "code": 3,
  "details": "{\"name\": \"Name cannot be empty\", \"other.email\": \"Invalid email\"}"
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

### Validators

`options`,`version` or `locale` please see [validator](https://github.com/chriso/validator.js)

- **optional()** - the param may not in the params.if the param not exists,it has no error,no matter whether have other checker or not.
- **empty([tip])** - the params can be a empty string.
- **notEmpty([tip])** - check if the param is not empty.
- **notBlank([tip])** - check if the param is not blank,use /^\s*$/gi reg to check.
- **match(pattern,[tip])** - pattern must be a RegExp instance ,eg. /abc/i
- **notMatch(pattern,[tip])** - pattern must be a RegExp instance ,eg. /xyz/i
- **ensure(assertion, [tip], [shouldBail])** if assertion is false,the asserting failed.
- **ensureNot(assertion, [tip], [shouldBail])** if assertion is true,the asserting failed.
- **isInt([tip],[options])** - check if the param is integer.
- **isFloat([tip],[options])** - check if the param is float.
- **isLength(min,[max],[tip])** - check the param length.
- **len(min,[max],[tip])** - the abbreviation of isLength.
- **isIn(arr,[tip])** - check if the param is in the array.
- **in(arr,[tip])** - the abbreviation of isIn.
- **eq(value,[tip])** - check if the param equal to the value.
- **neq(value,[tip])** - check if the param not equal to the value.
- **gt(num,[tip])** - check if the param great then the value.
- **lt(num,[tip])** - check if the param less then the value.
- **ge(num,[tip])** - check if the param great then or equal the value.
- **le(num,[tip])** - check if the param less then or equal the value.
- **contains(str,[tip])** - check if the param contains the str.
- **notContains(str,[tip])** - check if the param not contains the str.
- **isEmail([tip],[options])** - check if the param is an email.
- **isUrl([tip],[options])** - check if the param is an URL.
- **isIp([tip])** - check if the param is an IP (version 4 or 6).
- **isAlpha([tip],[locale])** - check if the param contains only letters (a-zA-Z).
- **isNumeric([tip])** - check if the param contains only numbers.
- **isAlphanumeric([tip],[locale])** - check if the param contains only letters and numbers.
- **isBase64([tip])** - check if a param is base64 encoded.
- **isHexadecimal([tip])** - check if the param is a hexadecimal number.
- **isHexColor([tip])** - check if the param is a hexadecimal color.
- **isLowercase([tip])** - check if the param is lowercase.
- **isUppercase([tip])** - check if the param is uppercase.
- **isDivisibleBy(num,[tip])** - check if the param is a number that's divisible by another.
- **isNull([tip])** - check if the param is null.
- **isByteLength(min,max,[tip])** - check if the param's length (in bytes) falls in a range.
- **byteLength(min,max,[tip])** - the abbreviation of isByteLength.
- **isUUID([tip],[version])** - check if the param is a UUID (version 3, 4 or 5).
- **isDate([tip])** - check if the param is a date.
- **isAfter(date,[tip])** - check if the param is a date that's after the specified date.
- **isBefore(date,[tip])** - check if the param is a date that's before the specified date.
- **isCreditCard([tip])** - check if the param is a credit card.
- **isISBN([tip],version)** - check if the param is an ISBN (version 10 or 13).
- **isJSON([tip])** - check if the param is valid JSON (note: uses JSON.parse).
- **isMultibyte([tip])** - check if the param contains one or more multibyte chars.
- **isAscii([tip])** - check if the param contains ASCII chars only.
- **isFullWidth([tip])** - check if the param contains any full-width chars.
- **isHalfWidth([tip])** - check if the param contains any half-width chars.
- **isVariableWidth([tip])** - check if the param contains a mixture of full and half-width chars
- **isSurrogatePair([tip])** - check if the param contains any surrogate pairs chars.
- **isCurrency([tip],[options])** - check if the param is a currency.
- **isDataURI([tip])** - check if the param is a data uri.
- **isMobilePhone([tip],[locale])** - check if the param is a mobile phone.
- **isISO8601([tip])** - check if the param is a ISO8601 string. eg.2004-05-03
- **isMACAddress([tip])** - check if the param is a MAC address.eg.C8:3A:35:CC:ED:80
- **isISIN([tip])** - check if the param is a ISIN.
- **isFQDN([tip],[options])** - check if the param is a fully qualified domain name. eg.www.google.com

### For json path:

- **check(fn,tip,scope)** - if fn return `false` then check failed.fn format `function(value,key,requestParams):boolean`
- **filter(fn,scope)** - filter the value if value is array.fn format `function(value,index,key,requestParams):boolean`
- **get(index)** - change the value to the specified index value
- **first()** - get the first value!

### Known issues

- Sanitizers haven't been tested, and should not work, except maybe for simple fields.
- json path options haven't been fully tested

## Under the hood

Built on top of `Validator` class of [koa-validate](https://github.com/RocksonZeta/koa-validate) module, which uses [validator](https://github.com/chriso/validator.js) module. Inspired on [express-validator](https://github.com/ctavan/express-validator) and [koa-validate](https://github.com/RocksonZeta/koa-validate).

In the future, we will use a differente `Validator` class in order to make sanitizers work.

## License and Credits

MIT License. Copyright 2017 

Built by the [GRPC experts](https://devsu.com) at Devsu.
