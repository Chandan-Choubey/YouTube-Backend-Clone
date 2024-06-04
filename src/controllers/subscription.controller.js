import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/User.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel Id is required");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(400, "Channel not found");
  }

  const isSubscribed = await Subscription.findOne({
    channelId: channelId.trim(),
    subscriber: req.user._id,
  });

  let isSubscribing;
  if (!isSubscribed) {
    await Subscription.create({
      channel: channelId.trim(),
      subscriber: req.user?._id,
    });
    isSubscribing = true;
  } else {
    await Subscription.deleteOne({
      channel: channelId.trim(),
      subscriber: req.user?._id,
    });
    isSubscribing = false;
  }

  const message = isSubscribing
    ? "Susbcribe channel success"
    : "Unsubscribe channel success";

  res.status(200).json(new ApiResponse(200, {}, message));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(400, "Channel not found");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId.trim(),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullname: 1,
            },
          },
        ],
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, { subscribers }, "success"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId?.trim() || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "subscriberId is required");
  }
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: subscriberId.trim(),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullname: 1,
            },
          },
        ],
      },
    },
  ]);

  res.status(200).json(new ApiResponse(200, { channels }, "success"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
