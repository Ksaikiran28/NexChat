import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

//Signup
export const signup=async(req,res)=>{
    const {fullName,email,password,bio}=req.body;

    try {
        if(!fullName || !email || !password ||!bio){
            return res.status(400).json({ success: false, message: "Missing details" });
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(409).json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser = await User.create({
            fullName,
            email,
            password:hashedPassword,
            bio,
        });

        const token = generateToken(newUser._id)

        const safeUser = { ...newUser._doc };
        delete safeUser.password;

        res.status(201).json({success:true,userData:safeUser,token,message:"Account created successfully"})
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false,message:error.message});
    }
};

//Controller for Login a user

export const login = async(req,res)=>{
    try {
        const {email,password}=req.body;
        const userData = await User.findOne({email})

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password,userData.password);

        if(!isPasswordCorrect){
            return res.status(401).json({success:false,message:"Invaild credentials"});
        }
        const token = generateToken(userData._id);
        const safeUser = { ...userData._doc };
        delete safeUser.password;
        res.json({success:true,userData:safeUser,token,message:"Login successful"});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({success:false,message:error.message})
    }
}

// controller to check if user is authenticated

export const  checkAuth =(req,res)=>{
    const safeUser = { ...req.user._doc };
    delete safeUser.password;

  res.json({ success: true, userData: safeUser });
}

//controller to update user profile details
export const updateProfile = async (req,res)=>{
    try {
        const {profilePic,bio,fullName}=req.body;
        const userId = req.user._id;
        let updatedUser;
        if(!profilePic){
            updatedUser =await User.findByIdAndUpdate(
                userId,
                {bio,fullName},
                {new:true}
            );
        }else{
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(
                userId,
                {profilePic:upload.secure_url,bio,fullName},
                {new:true}
            );
        }

        const safeUser = { ...updatedUser._doc };
        delete safeUser.password;

        res.json({success:true, userData:safeUser});
    } catch (error) {
        console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
    }
};