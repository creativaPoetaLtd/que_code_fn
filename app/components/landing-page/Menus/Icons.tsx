import React from 'react'
import { FaXTwitter } from "react-icons/fa6";
import { FaFacebookF } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { AiOutlineMail } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa6";

const SocialMediaIcons = () => {
  return (
    <div className=" bottom-0 right-0 social-media-icons space-x-3 flex bg-[] md:px-2 px-1 md:py-4 py-2 rounded-md text-white font-bold md:text-xl text-md">
        <p className="text-white font-sm text-sm flex my-auto">Follow Us</p>
    <div className="small-circle-div bg-[#FF8A1A] cursor-pointer hover:bg-orange-500 h-8 w-8 rounded-full flex justify-center items-center">
      <FaXTwitter />
    </div>
    <div className="small-circle-div bg-[#FF8A1A] cursor-pointer hover:bg-orange-500 h-8 w-8 rounded-full flex justify-center items-center">
      <FaFacebookF />
    </div>
    <div className="small-circle-div bg-[#FF8A1A] cursor-pointer hover:bg-orange-500 h-8 w-8 rounded-full flex justify-center items-center">
      <FaInstagram />
    </div>
    <div className="small-circle-div bg-[#FF8A1A] cursor-pointer hover:bg-orange-500 h-8 w-8 rounded-full flex justify-center items-center">
      <FaTiktok />
    </div>
    <div className="small-circle-div bg-[#FF8A1A] cursor-pointer hover:bg-orange-500 h-8 w-8 rounded-full flex justify-center items-center">
      <FaLinkedinIn />
    </div>
    <div className="small-circle-div bg-[#FF8A1A] cursor-pointer hover:bg-orange-500 h-8 w-8 rounded-full flex justify-center items-center">
      <AiOutlineMail />
    </div>
  </div>
  )
}
export default SocialMediaIcons
 