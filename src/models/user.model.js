import { mongoose, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    fullName: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    phone: { type: String, required: true, unique: true },
    refreshToken: { type: String, required: true },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next;
  this.password = bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(this.password, password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_WEB_TOKEN,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};
export const User = models.User || model("User", userSchema);
