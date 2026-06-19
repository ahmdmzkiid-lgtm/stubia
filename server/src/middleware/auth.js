const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const verifyToken = (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, error: "Access denied. No token provided." });
    }

    token = token.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token." });
  }
};

// Checks the actual role in DB — handles cases where role was updated after the JWT was issued
const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res
        .status(403)
        .json({ success: false, error: "Access denied. Admin role required." });
    }

    // Fast path: JWT already says admin (common case for accounts that logged in as admin)
    if (req.user.role === "admin") {
      return next();
    }

    // Slow path: role may have been updated in DB after token was issued — verify against DB
    const result = await pool.query("SELECT role FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (result.rows.length > 0 && result.rows[0].role === "admin") {
      // Update req.user so downstream handlers also see the correct role
      req.user.role = "admin";
      return next();
    }

    return res
      .status(403)
      .json({ success: false, error: "Access denied. Admin role required." });
  } catch (err) {
    console.error("verifyAdmin DB check error:", err.message);
    return res
      .status(403)
      .json({ success: false, error: "Access denied. Admin role required." });
  }
};

module.exports = { verifyToken, verifyAdmin };
