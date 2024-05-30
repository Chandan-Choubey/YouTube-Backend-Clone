import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      "Mongo db Connection Success",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("Mongo db Connection Error", error);
    process.exit(1);
  }
};

export default connectDb;
