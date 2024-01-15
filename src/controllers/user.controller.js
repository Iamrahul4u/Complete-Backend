import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadCloudinary from "../utils/cloudinaryUpload.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

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
    coverImage: coverImagePath?.url,
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
    throw new ApiError(500, error.message);
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("-refreshToken");
  const isPasswordCorrectOrNot = await user.isPasswordCorrect(password);
  if (!isPasswordCorrectOrNot) {
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

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const reqToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!reqToken) {
    throw new ApiError(401, "Please provide refresh token");
  }
  try {
    const decodedToken = jwt.verify(reqToken, process.env.REFRESH_WEB_TOKEN);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (reqToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const { refreshToken, accessToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { refreshToken, accessToken },
          "Successfully Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});
export { registerUser, loginUser, logoutUser, refreshAccessToken };
