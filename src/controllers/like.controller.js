import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/videos.model.js";
import { Comment, Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const isLikeAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  let isLiking;

  if (isLikeAlready) {
    await Like.findByIdAndDelete(isLikeAlready._id);
    isLiking = false;
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    isLiking = true;
  }

  const message = isLiking ? "Like video success" : "Unlike video success";
  z;
  res.status(200).json(ApiResponse(200, {}, message));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment Id is required");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const isLikeAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  let isLiking;
  if (isLikeAlready) {
    await Like.findByIdAndDelete(isLikeAlready._id);
    isLiking = false;
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    isLiking = true;
  }

  const message = isLiking ? "Like comment success" : "Unlike comment success";
  res.status(200).json(ApiResponse(200, {}, message));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet Id is required");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const isLikeAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  let isLiking;
  if (isLikeAlready) {
    await Like.findByIdAndDelete(isLikeAlready._id);
    isLiking = false;
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    isLiking = true;
  }
  const message = isLiking ? "Like tweet success" : "Unlike tweet success";
  res.status(200).json(ApiResponse(200, {}, message));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const videos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "likedBy",
        foreignField: "_id",
        as: "videos",
        pagination: [
          {
            $project: {
              title: 1,
              videoFile: 1,
              thumbnail: 1,
              views: 1,
            },
          },
        ],
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos, videosCount: videos.length },
        "Get liked videos success"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
