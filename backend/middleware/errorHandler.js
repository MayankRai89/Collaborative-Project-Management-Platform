const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ message: "Duplicate value: that record already exists" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid id" });
  }

  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
};

module.exports = errorHandler;
