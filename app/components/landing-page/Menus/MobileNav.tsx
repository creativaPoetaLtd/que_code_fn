import React from 'react';
import { BsFillCartPlusFill } from 'react-icons/bs';
import { FaHome } from 'react-icons/fa';
import { HiBars3BottomLeft } from "react-icons/hi2";
import { CgProfile } from "react-icons/cg";



interface MobileNavProps {
  onClick: () => void;
}

const MobileNav = ({ onClick }: MobileNavProps) => {
  return (
    <div className='md:hidden inline-block bottom-0 p-4 bg-orange-600 z-10 flex-col fixed w-full'>
      <div className='flex justify-between text-white'>
        <button className='flex items-center' onClick={onClick}>
          <HiBars3BottomLeft className='text-2xl' />
        </button>
        <a href='#home' className='flex items-center'>
          <FaHome className='text-2xl' />
        </a>
        <button className='flex items-center'>
          <CgProfile className='text-2xl' />
        </button>
        <button className='flex items-center'>
          <BsFillCartPlusFill className='text-2xl' />
        </button>
      </div>
    </div>
  );
}

export default MobileNav;