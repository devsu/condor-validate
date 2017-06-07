const Validator = require('koa-validate').Validator;
const jp = require('jsonpath');

module.exports = class CondorValidator {

  static getValue(obj, key) {
    if (key.startsWith('$.')) {
      return jp.query(obj, key);
    }
    return key.split('.').reduce((obj, subkey) => {
      if (subkey.indexOf('[') < 0) {
        return obj[subkey];
      }
      const index = subkey.substring(subkey.indexOf('[') + 1, subkey.indexOf(']'));
      const arrayKey = subkey.substring(0, subkey.indexOf('['));
      return obj[arrayKey][index];
    }, obj);
  }

  static hasKey(obj, key) {
    if (key.startsWith('$.')) {
      return jp.query(obj, key).length > 0;
    }
    let hasKey = true;
    let objHolder = obj;
    key.split('.').forEach((subkey) => {
      if (!objHolder) {
        hasKey = false;
      }
      if (!hasKey) {
        return;
      }
      if (subkey.indexOf('[') > 0) {
        const index = subkey.substring(subkey.indexOf('[') + 1, subkey.indexOf(']'));
        const arrayKey = subkey.substring(0, subkey.indexOf('['));
        objHolder = objHolder[arrayKey][index];
        return;
      }
      if (subkey in objHolder) {
        objHolder = objHolder[subkey];
        return;
      }
      hasKey = false;
    });
    return hasKey;
  }

  static getMiddleware() {
    return (ctx, next) => {
      ctx.checkRequest = (key) => {
        const hasKey = CondorValidator.hasKey(ctx.req, key);
        let value = null;
        if (hasKey) {
          value = CondorValidator.getValue(ctx.req, key);
        }
        return new Validator(ctx, key, value, hasKey, ctx.req);
      };

      ctx.checkMetadata = (key, index) => {
        const value = ctx.meta.get(key);
        if (!index) {
          // eslint-disable-next-line no-param-reassign
          index = 0;
        }
        const exists = value.length > index;
        return new Validator(ctx, key, value[index], exists);
      };

      ctx.validate = (customCode, customMessage) => {
        if (ctx.errors && ctx.errors.length) {
          const code = customCode || ctx.status.INVALID_ARGUMENT;
          const details = customMessage || JSON.stringify(ctx.errors);
          throw {code, details};
        }
      };
      return next();
    };
  }
};
