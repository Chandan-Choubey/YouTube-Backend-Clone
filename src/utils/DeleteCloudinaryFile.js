import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const deleteCloudinary = (publicId) => {
  cloudinary.uploader.destroy(publicId, (error, result) => {
    if (error) {
      console.error("Error deleting old avatar:", error);
    } else {
      console.log("Old avatar deleted successfully:", result);
    }
  });
};
