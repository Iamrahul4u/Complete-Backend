import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadCloudinary from "../utils/cloudinaryUpload.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, refreshToken } = req.body;
  if (
    [fullName, username, email, password].some((field) => {
      field.trim() === "";
    })
  ) {
    return new ApiError(400, "Fields are Missing");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    return new ApiError(409, "User Already Existed");
  }
  const avatar = req.files?.["avatar"][0]?.path;
  const coverImage = req.files?.["coverImage"][0]?.path;
  if (!avatarPath) {
    return new ApiError(400, "Avatar Missing");
  }
  const avatarPath = await uploadCloudinary(avatar);
  const coverImagePath = await uploadCloudinary(coverImage);
  const user = await User.create({
    fullName,
    email,
    username,
    avatar: avatarPath.url,
    coverImagePath: coverImagePath?.url || "",
  }).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, "User Registered Successfully", user));
});

export { registerUser };
