import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }
    const decodedInfo = jwt.verify(token, process.env.ACCESS_WEB_TOKEN);
    const user = await User.findOne({ _id: decodedInfo._id }).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "User Not Found");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError("401", error?.message || "Unauthorized");
  }
});

export { verifyJwt };
