import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  console.log(req.user._id);
  const content = req.body.content?.trim();
  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({ owner: req.user._id, content });

  if (!tweet) {
    throw new ApiError(400, "Tweet not created");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  console.log(tweets);

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const content = req.body?.content.trim();
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }
  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweets updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }
  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweets deleted successfully deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
