import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("refresh-token").post(refreshToken);

router.route("/who-am-i").get(verifyJWT, getCurrentUser);
export default router;
