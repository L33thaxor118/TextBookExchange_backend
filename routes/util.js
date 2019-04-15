const catchAsyncErrors = fn => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

const registerAsyncHandlers = router => {
  router.asyncRoute = (...args) => {
    const asyncRouter = router.route(...args);
    
    return ['get', 'put', 'post', 'delete'].reduce((acc, method) => {
      acc[method] = handler => {
        asyncRouter[method](catchAsyncErrors(handler));
        // Need to return acc to allow for chaining
        return acc;
      };

      return acc;
    }, {});
  };
};

module.exports = {
  registerAsyncHandlers
};