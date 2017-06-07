const CondorValidator = require('./lib/condor-validator');

module.exports = () => {
  return CondorValidator.getMiddleware();
};
