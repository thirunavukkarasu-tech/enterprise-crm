/**
 * Wraps an async Express route handler so any rejected promise is
 * forwarded to next(), where the centralized errorHandler deals with it.
 * Avoids repeating try/catch in every single controller function.
 *
 * Usage: router.get('/', asyncHandler(controllerFn));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
