import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filepath) => {
  try {
    if (!filepath) return null;
    const response = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });
    console.log("File uploaded successfully");
    console.log("response url from cloudnairy.js", response.url, response);
    fs.unlinkSync(filepath);
    return response;
  } catch (error) {
    fs.unlinkSync(filepath);
    console.log("Error on uploading files:", error);
    return null;
  }
};

export default uploadOnCloudinary;
