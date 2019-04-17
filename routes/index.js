module.exports = {
  initRoutes: (app, router) => {
    const homeRoute = router.route('/');
    homeRoute.get((req, res) => res.send('Hello World v2\n'));

    app.use('/', router);
    require('./usersRoute')(app);
    require('./booksRoute')(app);
    require('./courseRoute')(app);

    /* Error handling middleware */
    // Any uncaught errors from any route will be processed here.
    app.use((err, req, res, next) => {
      if (err) {
        console.error(err);
  
        switch (err.name) {
          case 'ValidationError': {
            for (let path of Object.keys(err.errors)) {
              res.status(400).json({
                message: 'NOT OK',
                data: {
                  error: `Field '${path}' is missing or invalid`,
                }
              });
              break;
            }
            break;
          }
          case 'CastError': {
            if (err.kind === 'ObjectId') {
              res.status(400).json({
                message: 'NOT OK',
                data: {
                  error: `Received invalid id value: "${err.value}"`
                }
              });
              break;
            }
          }
          default: {
            res.status(500).json({
              message: 'Internal server error',
              data: {}
            });
          }
        }
      } else {
        next();
      }
    });
  }
};