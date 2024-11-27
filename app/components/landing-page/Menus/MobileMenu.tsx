import React from 'react';
import { FaHome } from "react-icons/fa";
import { TbArrowRoundaboutRight } from "react-icons/tb";
import { CiGift } from "react-icons/ci";
import { IoBagCheckOutline } from "react-icons/io5";
import { FaQuestion } from "react-icons/fa";
import { MdContactPhone } from "react-icons/md";
import { MdOutlinePrivacyTip } from "react-icons/md";
import { FaFileAudio } from "react-icons/fa";
import { MdErrorOutline } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { MdShoppingBag } from "react-icons/md";
import { IoSettings } from "react-icons/io5";
import { CiLogout } from "react-icons/ci";


interface Page {
  icon: React.ReactNode;
  title: string | JSX.Element;
  selected?: boolean;
}
interface MobileMenuProps {
  onClose: () => void;
}

const pages: Page[] = [
  { icon: <FaHome className="w-4 h-4 text-gray-800 flex my-auto" />, title: <a href="#home">Home page</a> },
  { icon: <TbArrowRoundaboutRight className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'About-us page' },
  { icon: <CiGift className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'Offers page' },
  { icon: <IoBagCheckOutline className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'Checkout page' },
  { icon: <FaQuestion className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'FAQ page' },
  { icon: <MdContactPhone className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'Contact-us page' },
  { icon: <MdOutlinePrivacyTip className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'Privacy page' },
  { icon: <FaFileAudio className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'Terms-and-Condition page' },
  { icon: <MdErrorOutline className="w-4 h-4 text-gray-800 flex my-auto" />, title: '404 page' },
];


const OtherPages: Page[] = [
  { icon: <CgProfile className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'My Account' },
  { icon: <MdShoppingBag className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'My Orders' },
  { icon: <IoSettings className="w-4 h-4 text-gray-800 flex my-auto" />, title: 'Settings' },
  { icon: <CiLogout className="w-4 h-4 text-gray-800 flex my-auto" />, title: <a href="/auth/signin">Logout</a> },
];


const MobileMenu = ({ onClose }: MobileMenuProps) => {
  return (
    <div className='w-full min-h-screen h-fit  bg-gray-50 flex flex-col'>
      <div className="flex justify-between w-full bg-white px-5 py-3">
        <h1 className="text-blue-700 font-medium">RWAMED</h1>
        <button className="flex items-center" onClick={onClose}>
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className='pages_k p-5 h-fit w-full flex flex-col justify-start items-start'>
        <div className='heading_o w-full flex justify-start items-start py-2 border-b'>
          <h1 className='text-gray-800 font-medium'>All Pages</h1>
        </div>
        <div className='category_o  mt-2 w-full h-fit flex flex-col justify-start items-start'>
          {pages.map((page, index) => (
            <div key={index} className='w-full space-x-2 flex justify-start items-start px-1 py-3 shadow-md' onClick={onClose}>
              {page.icon}
              <p className='text-gray-800 text-sm'>{page.title}</p>
            </div>
          ))}
          <div className='heading w-full flex justify-start items-start py-2 border-b mt-9'>
            <h1 className='text-gray-800 font-medium'>Choose Language</h1>
          </div>
          <div className='heading w-full flex justify-start items-start py-2 border-b mt-9'>
            <h1 className='text-gray-800 font-medium'>Services</h1>
          </div>
          <div className='heading w-full flex justify-start items-start py-2 border-b mt-9'>
            <h1 className='text-gray-800 font-medium'>Other Pages</h1>
          </div>
          <div className='category mt-2 w-full h-fit flex flex-col justify-start items-start'>
            {OtherPages.map((page, index) => (
              <div key={index} className='w-full space-x-2 flex justify-start items-start py-3 shadow-md' onClick={onClose}>
                {page.icon}
                <p className='text-gray-800 text-sm'>{page.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8 md:pb-2 pb-8">
            <p className="text-base leading-6 text-gray-400 xl:text-center">
              &copy; 2024 RWAMED. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MobileMenu;
