import express from "express";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage,deleteMessage  } from "../controllers/messageController.js";
import { protectRoute } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/users",protectRoute,getUsersForSidebar);
messageRouter.get("/:id",protectRoute,getMessages);
messageRouter.put("/mark/:id",protectRoute,markMessageAsSeen);
messageRouter.post("/send/:id",protectRoute,sendMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);

export default messageRouter;