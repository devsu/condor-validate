const grpc = require('grpc');
const Spy = require('jasmine-spy');
const CondorValidator = require('./condor-validator');
const Validator = require('koa-validate').Validator;

describe('CondorValidator', () => {
  let ctx, next, nextResult, middleware;

  beforeEach(() => {
    ctx = {'status': grpc.status};
    nextResult = 'whatever';
    next = Spy.resolve(nextResult);
  });

  describe('static', () => {
    describe('getMiddleware()', () => {
      it('should return a middleware method', () => {
        expect(CondorValidator.getMiddleware()).toEqual(jasmine.any(Function));
      });
    });

    describe('getValue()', () => {
      let obj, key, value;

      beforeEach(() => {
        value = 'my value';
        obj = {};
      });

      it('should return simple values', () => {
        key = 'myKey';
        obj[key] = value;
        const actual = CondorValidator.getValue(obj, key);
        expect(actual).toEqual(value);
      });

      it('should return nested values', () => {
        key = 'my.other.field';
        obj.my = {'other': {'field': value}};
        const actual = CondorValidator.getValue(obj, key);
        expect(actual).toEqual(value);
      });

      it('should return array values (integers index)', () => {
        key = 'my.other[1].field';
        obj.my = {'other': [{}, {'field': value}]};
        const actual = CondorValidator.getValue(obj, key);
        expect(actual).toEqual(value);
      });

      it('should work with json-path', () => {
        key = '$.my.field';
        obj.my = {'field': value};
        const actual = CondorValidator.getValue(obj, key);
        expect(actual).toEqual([value]);
      });
    });

    describe('hasKey()', () => {
      let obj, key;

      beforeEach(() => {
        obj = {};
      });

      describe('simple keys, ', () => {
        describe('has the key', () => {
          it('should return true', () => {
            key = 'myKey';
            obj[key] = null;
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(true);
          });
        });
        describe('does not have the key', () => {
          it('should return false', () => {
            key = 'myKey';
            obj = {};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(false);
          });
        });
      });

      describe('nested keys, ', () => {
        describe('has the key', () => {
          it('should return true', () => {
            key = 'my.other.field';
            obj.my = {'other': {'field': null}};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(true);
          });
        });
        describe('does not have the key', () => {
          it('should return false', () => {
            key = 'my.other.field';
            obj.my = {'other': {}};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(false);
          });
        });
      });

      describe('keys with arrays, ', () => {
        describe('has the key', () => {
          it('should return true', () => {
            key = 'my.other[1].field';
            obj.my = {'other': [{}, {'field': null}]};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(true);
          });
        });
        describe('does not have the key', () => {
          it('should return false', () => {
            key = 'my.other[1].field';
            obj.my = {'other': [{}]};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(false);
          });
        });
      });

      describe('jsonpath keys, ', () => {
        describe('has the key', () => {
          it('should return true', () => {
            key = '$.my.field';
            obj.my = {'field': null};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(true);
          });
        });

        describe('does not have the key', () => {
          it('should return false', () => {
            key = '$.my.field';
            obj.my = {};
            const actual = CondorValidator.hasKey(obj, key);
            expect(actual).toEqual(false);
          });
        });
      });
    });
  });

  describe('middleware', () => {
    beforeEach(() => {
      middleware = CondorValidator.getMiddleware();
    });

    it('should add the checkRequest() method to the context', () => {
      middleware(ctx, next);
      expect(ctx.checkRequest).toEqual(jasmine.any(Function));
    });

    it('should add the checkMetadata() method to the context', () => {
      middleware(ctx, next);
      expect(ctx.checkMetadata).toEqual(jasmine.any(Function));
    });

    it('should add the validate() method to the context', () => {
      middleware(ctx, next);
      expect(ctx.validate).toEqual(jasmine.any(Function));
    });

    it('should return next()', (done) => {
      const middlewareResult = middleware(ctx, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
      middlewareResult.then((result) => {
        expect(result).toEqual(nextResult);
      }).then(done).catch(done.fail);
    });
  });

  describe('ctx.checkRequest()', () => {
    let key, value;

    beforeEach((done) => {
      key = 'some.field';
      value = 'whatever';
      ctx.req = {'some': {'field': value}};
      middleware = CondorValidator.getMiddleware();
      middleware(ctx, next).then(done).catch(done.fail);
    });

    it('should return a Validator', () => {
      const actual = ctx.checkRequest(key);
      expect(actual instanceof Validator).toBeTruthy();
    });

    it('should create the validator with the right arguments', () => {
      const actual = ctx.checkRequest(key);
      expect(actual.context).toEqual(ctx);
      expect(actual.key).toEqual(key);
      expect(actual.value).toEqual(value);
      expect(actual.exists).toEqual(true);
      expect(actual.params).toEqual(ctx.req);
    });

    describe('invalid key', () => {
      beforeEach((done) => {
        key = 'some.field';
        ctx.req = {};
        middleware = CondorValidator.getMiddleware();
        middleware(ctx, next).then(done).catch(done.fail);
      });

      it('should not throw error', () => {
        ctx.checkRequest(key);
      });
    });
  });

  describe('ctx.checkMetadata()', () => {
    let key, value1, value2, requestedIndex;

    beforeEach((done) => {
      key = 'authorization';
      value1 = 'foo';
      value2 = 'bar';
      requestedIndex = 0;
      ctx.meta = new grpc.Metadata();
      ctx.meta.add(key, value1);
      ctx.meta.add(key, value2);
      middleware = CondorValidator.getMiddleware();
      middleware(ctx, next).then(done).catch(done.fail);
    });

    it('should return a Validator', () => {
      const actual = ctx.checkMetadata(key, requestedIndex);
      expect(actual instanceof Validator).toBeTruthy();
    });

    it('should create the validator with the right arguments', () => {
      const actual = ctx.checkMetadata(key, requestedIndex);
      expect(actual.context).toEqual(ctx);
      expect(actual.key).toEqual(key);
      expect(actual.value).toEqual(value1);
      expect(actual.exists).toEqual(true);
    });

    describe('invalid key', () => {
      beforeEach((done) => {
        key = 'another';
        middleware = CondorValidator.getMiddleware();
        middleware(ctx, next).then(done).catch(done.fail);
      });

      it('should not throw error', () => {
        ctx.checkMetadata(key, requestedIndex);
      });

      it('should set exists = false', () => {
        const actual = ctx.checkMetadata(key, requestedIndex);
        expect(actual.exists).toEqual(false);
      });
    });

    describe('no index', () => {
      it('should call with index 0', () => {
        const actual = ctx.checkMetadata(key);
        expect(actual.value).toEqual(value1);
      });
    });

    describe('invalid index', () => {
      it('should not throw error', () => {
        ctx.checkMetadata(key, 2);
      });

      it('should set exists = false', () => {
        const actual = ctx.checkMetadata(key, 5);
        expect(actual.exists).toEqual(false);
      });
    });
  });

  describe('validate()', () => {
    beforeEach((done) => {
      middleware = CondorValidator.getMiddleware();
      middleware(ctx, next).then(done).catch(done.fail);
    });

    describe('when there are ctx.errors', () => {
      beforeEach(() => {
        ctx.errors = [{'foo': 'bar'}];
      });

      it('should throw an error', () => {
        expect(() => {
          ctx.validate();
        }).toThrow({
          'code': grpc.status.INVALID_ARGUMENT,
          'details': JSON.stringify(ctx.errors),
        });
      });

      describe('with custom code', () => {
        it('should throw an error with the custom code', () => {
          expect(() => {
            ctx.validate(5);
          }).toThrow({
            'code': 5,
            'details': JSON.stringify(ctx.errors),
          });
        });
      });

      describe('with custom code and message', () => {
        it('should throw an error with the custom code', () => {
          expect(() => {
            ctx.validate(5, 'Something went wrong');
          }).toThrow({
            'code': 5,
            'details': 'Something went wrong',
          });
        });
      });
    });

    describe('when no ctx.errors defined', () => {
      beforeEach(() => {
        delete ctx.errors;
      });

      it('should not throw an error', () => {
        ctx.validate();
      });
    });

    describe('when ctx.errors is an empty array', () => {
      beforeEach(() => {
        ctx.errors = [];
      });

      it('should not throw an error', () => {
        ctx.validate();
      });
    });
  });
});
