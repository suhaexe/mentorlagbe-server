export const verifyStudent = (req, res, next) => {
  if (req.user?.role !== "student") {
    return res.status(403).json({ message: "Access denied. Student role required." });
  }
  next();
};