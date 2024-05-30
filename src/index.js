import dotenv from "dotenv";
import connectDb from "./db/index.js";

dotenv.config({ path: "./env" });
connectDb();

// const app = express();
// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URL, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useFindAndModify: false,
//       useCreateIndex: true,
//     });
//     app.on("error", (error) => {
//       console.error(error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`Listening on port ${process.env.PORT}`);
//     });
//     console.log("Connected to MongoDB");
//   } catch (error) {
//     console.log(error);
//     process.exit(1);
//   }
// })();
