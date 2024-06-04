import { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = {},
    sortBy = "createdAt",
    sortType = "asc",
    userId,
  } = req.query;

  try {
    // Parse and convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Validate sortType and convert it to the appropriate format for Mongoose
    const sortOrder = sortType.toLowerCase() === "desc" ? -1 : 1;

    // Add userId to query if provided
    const queryObject = { ...query };
    if (userId && isValidObjectId(userId)) {
      queryObject.owner = userId;
    }

    // Build the sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder;

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * limitNumber;

    // Execute the query with pagination and sorting
    const videos = await Video.find(queryObject)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNumber)
      .exec();

    // Optionally, get the total count of videos matching the query (for pagination metadata)
    const totalVideos = await Video.countDocuments(queryObject);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          videos,
          totalVideos,
          totalPages: Math.ceil(totalVideos / limitNumber),
          currentPage: pageNumber,
        },
        "Videos fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching videos:", error);
    throw new ApiError(401, "Error getting videos", error);
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  console.log(req.files);
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  console.log(thumbnailLocalPath, videoLocalPath);

  const videoOnCloudinary = await uploadOnCloudinary(videoLocalPath);
  const thumbnailOnColudinary = await uploadOnCloudinary(thumbnailLocalPath);
  console.log(videoOnCloudinary, "cloudinary uploaded video");

  if (!videoOnCloudinary || !thumbnailOnColudinary) {
    throw new ApiError(400, "Video and Thumbnail file is required");
  }

  const videos = await Video.create({
    videoFile: videoOnCloudinary.url,
    thumbnail: thumbnailOnColudinary.url,
    title,
    description,
    duration: videoOnCloudinary.duration,
    owner: req.user._id,
  });

  console.log(videos);

  const videoFetchById = await Video.find({ owner: req.user._id });

  if (!videoFetchById) {
    throw new ApiError(400, "Video not uploaded");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoFetchById, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoFromCloudinary = await Video.findById(videoId);
  if (!videoFromCloudinary) {
    throw new ApiError(400, "Video not found");
  }

  console.log(videoFromCloudinary);
  return res
    .status(200)
    .json(new ApiResponse(200, videoFromCloudinary.videoFile, "Video Fetched"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;
  console.log(videoId, title, description, thumbnailLocalPath);
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  if (!title || !description || !thumbnailLocalPath) {
    throw new ApiError(400, "All fields are required");
  }
  //title description
  video.title = title;
  video.description = description;
  //upload thumbnail
  const thumbnailOnColudinary = await uploadOnCloudinary(thumbnailLocalPath);
  video.thumbnail = thumbnailOnColudinary.url;
  video.save();
  res.status(200).json(new ApiResponse(200, video, "Updated"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findByIdAndDelete(videoId);
  res.status(200).json(new ApiResponse(200, video, "deleted video"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  video.isPublished = !video.isPublished;
  video.save();
  res.status(200).json(new ApiResponse(200, video, "successfully toggle"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
