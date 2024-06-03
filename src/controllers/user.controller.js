import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    console.log(user);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  // console.log("req.body", req.body);
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "Email or username already exists");
  }
  // console.log("req.files", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required from cloudinary");
  }

  const user = await User.create({
    fullname,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  console.log(username, password, email);
  if (!(username || email)) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findOne(user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn SuccessFully"
      )
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshTooken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshTooken) {
    throw new ApiError(400, "Refresh token is required");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshTooken,
      process.env.REFRESH_ACCESS_TOKEN
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (incomingRefreshTooken !== user?.refreshToken) {
      throw new ApiError(404, "Refresh token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookies("accessToken", accessToken, options)
      .cookies("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken: accessToken,
            refreshToken: newrefreshToken,
          },
          "Access Token Refreshed "
        )
      );
  } catch (error) {
    throw new ApiError(error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshToken };
