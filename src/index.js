import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log("listening on port " + process.env.PORT);
    });
  })
  .catch((err) => {
    console.log("Mongodb Connection Error:", err);
  });
