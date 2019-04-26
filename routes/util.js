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

/**
 * Helper function that applies updates to a group of documents
 * if and only if all of the referenced documents exist.
 * 
 * See the comments below for details on the options.
 * 
 * @param {Object} options see comments below
 */
const modifyAllOrNone = async options => {
  const noop = () => ({});
  const {
    // Array of ids to validate
    documentIds,
    // Model to search over
    model: Model,
    // Given a document, return an object containing updated fields
    updateFn = noop,
    /*
      If true, the returned object will contain a function
      called 'execUpdates', which will run the updates once called.

      Optionally, you can pass an update function to execUpdates.
    */
    deferUpdates = false,
  } = options;

  // Aggregate all updates before committing any of them
  const updateArr = [];

  for (let id of documentIds) {
    const document = await Model.findById(id);
    if (document) {
      const updates = updateFn(document);
      updateArr.push([document, updates]);
    } else {
      return {success: false, missingDocumentId: id};
    }
  }

  const execUpdates = (deferredUpdateFn = noop) => Promise.all(updateArr.map(([document, updates]) => {
    let updateObj = updates;
    
    if (deferUpdates && !options.updateFn) {
      updateObj = deferredUpdateFn(document);
    }

    Object.entries(updateObj)
      .forEach(([key, value]) => document[key] = value);
    return document.save();
  }));

  if (deferUpdates) {
    return { success: true, execUpdates };
  } else {
    await execUpdates();
    return { success: true };
  }
};

/**
 * Middleware that intercepts requests with an 'id' param and returns
 * a 404 if no corresponding document exists with that id.
 * 
 * Usage:
 *  const wrapNotFound = notFoundMiddleware(Book);
 * 
 *  booksRouter.asyncRoute('/:id')
 *    .get(wrapNotFound(getHandler))
 *    .put(wrapNotFound(putHandler));
 * 
 * The wrapped handler will receive the found document as its third argument.
 * 
 * @param {Model} Model Mongo collection to query over
 */
const notFoundMiddleware = (Model, idKey) => handler => async (req, res, ...rest) => {
  const { id } = req.params;
  const document = await (!idKey ? Model.findById(id) : Model.findOne({[idKey]: id}));
  
  if (!document) {
    res.status(404).end();
  } else {
    return handler(req, res, document, ...rest);
  }
};

const uniqueDocumentMiddleware = (Model, key, bodyKey) => handler => async (req, res, ...rest) => {
  let requestValue = req.body[bodyKey || key];
  const document = await Model.findOne({[key]: requestValue});
  if (document) {
    res.status(400).json({
      errorType: 'DUPLICATE_DOCUMENT',
      message: `A document with key ${key}=${requestValue} already exists.`
    });
  } else {
    return handler(req, res, ...rest);
  }
};

module.exports = {
  modifyAllOrNone,
  notFoundMiddleware,
  registerAsyncHandlers,
  uniqueDocumentMiddleware,
};