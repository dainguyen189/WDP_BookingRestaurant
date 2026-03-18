const errorMiddleware = ((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  console.log(err)
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    errors: err?.errors,
    stack: err.stack
  })
})

module.exports = errorMiddleware;
