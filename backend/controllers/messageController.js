import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import {io,userSocketMap} from "../server.js"

//get all users except the logged in user

export const getUsersForSidebar = async (req,res)=>{
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne:userId}}).select("-password");

        //count no of messages not seen
        const unseenMessages ={}
        const promises = filteredUsers.map(async(user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false})
            if(messages.length>0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filteredUsers,unseenMessages});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//Get all messages for selected user

export const getMessages = async(req,res)=>{
    try {
        const {id:selectedUserId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},

            ],
        }).sort({createdAt:1}); //sort by oldest -> newest

        //Mark messages from selected user as seen

        await Message.updateMany({senderId:selectedUserId,receiverId:myId,seen:false},
        {$set:{seen:true}});
        res.json({success:true,messages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

//api to mark message as seen using message Id

export const markMessageAsSeen = async(req,res)=>{
    try {
        const {id}= req.params;
        await Message.findByIdAndUpdate(id,{$set:{seen:true}});
        res.json({success:true});
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

//Send message to selected user

export const sendMessage = async(req,res)=>{
    try {
        const {text,image}= req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;



        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })
        
        //Emit new message to the reciever's socket
        const recieverSocketId = userSocketMap[receiverId];
        if(recieverSocketId){
            io.to(recieverSocketId).emit("newMessage",newMessage)
        }

        res.json({success:true,newMessage});
        
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message});
    }
}



// Delete a message (only sender can delete it)
export const deleteMessage = async (req, res) => {
    try {
      const { id } = req.params;       // messageId
      const userId = req.user._id;     // logged-in user
  
      const message = await Message.findById(id);
  
      if (!message) {
        return res.status(404).json({ success: false, message: "Message not found" });
      }
  
      // only sender can delete the message
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized to delete this message" });
      }
  
      // if message had an image → delete from cloudinary too
      if (message.image) {
        const publicId = message.image.split("/").pop().split(".")[0]; 
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err.message);
        }
      }
  
      await Message.findByIdAndDelete(id);
  
      res.json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  