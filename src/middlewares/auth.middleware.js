import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { jwt } from "json-web-token";
const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }
    const decodedInfo = await jwt.verify(token, process.env.ACCESS_WEB_TOKEN);
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
