import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadCloudinary from "../utils/cloudinaryUpload.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
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
  const avatarPath = await uploadCloudinary(avatar);
  const coverImagePath = await uploadCloudinary(coverImage);
  const user = await User.create({
    fullName,
    email,
    username,
    avatar: avatarPath.url,
    coverImage: coverImagePath?.url || "",
    password,
  });
  const userWithoutSensitiveInfo = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "User Registered Successfully",
        userWithoutSensitiveInfo
      )
    );
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or password is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("-password -refreshToken");
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = { ...user };
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {});
export { registerUser, loginUser, logoutUser };
