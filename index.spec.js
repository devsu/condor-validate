const proxyquire = require('proxyquire');
const Spy = require('jasmine-spy');

describe('validate()', () => {
  let validate, ValidatorStub, middleware;

  beforeEach(() => {
    middleware = Spy.create();
    ValidatorStub = class {
      static getMiddleware() {
        return middleware;
      }
    };
    validate = proxyquire('./index', {'./lib/condor-validator': ValidatorStub});
  });

  it('must return middleware method', () => {
    expect(validate()).toEqual(middleware);
  });
});
