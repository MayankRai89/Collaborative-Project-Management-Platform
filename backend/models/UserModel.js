const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "project_manager", "team_member", "viewer"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: "team_member" },
    isActive: { type: Boolean, default: true }, // "deactivate" = set false, never delete
  },
  { timestamps: true },
);

// Hash the password only when it is new or changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Never send the password hash in API responses
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.ROLES = ROLES;

