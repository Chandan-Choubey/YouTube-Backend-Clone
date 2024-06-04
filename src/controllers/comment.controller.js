import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/videos.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is required or invalid");
  }
  let { page = 1, limit = 10 } = req.query;
  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(limit) ? 10 : Number(limit);
  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    page = 10;
  }
  // const comments = await Comment.find({ video: videoId })
  //   .skip((page - 1) * limit)
  //   .limit(parseInt(limit));
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);
  if (comments.length < 0) {
    throw new ApiError(404, "No comments found");
  }
  res.status(200).json(new ApiResponse(200, comments, "All comments on video"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is required or invalid");
  }

  const content = req.body?.content?.trim();
  if (!content) {
    throw new ApiError(400, "Comment text is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found to comment");
  }

  if (!video) {
    throw new ApiError(400, "Video not found to comment");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  res.status(200).json(new ApiResponse(200, comment, "added comment"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { commentId } = req.params;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  const user = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );
  if (!user) {
    throw new ApiError(404, "Comment not found");
  }
  res.status(200).json(new ApiResponse(200, user, "updated comment"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, comment, "deleted comment successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
