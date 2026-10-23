const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript in the browser cannot read this cookie
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    // Same message for "no user" and "wrong password" so attackers can't tell which emails exist
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const token = signToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ user, token }); // token in the body too, so Postman/Bearer testing works
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "Logged out" });
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};
