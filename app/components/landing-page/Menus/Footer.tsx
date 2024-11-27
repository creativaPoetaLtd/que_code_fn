
import React from 'react';
import { AiOutlineEnter } from "react-icons/ai";
import SocialMediaIcons from './Icons';


const Footer: React.FC = () => {
  return (
    <footer className="bg-blue-800 px-4 w-full" id='contact-us'>
      <div className="w-full py-12  lg:py-16 ">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
          <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  RWAMED
                </h4>
                <p className="mt-4 text-base leading-6 text-gray-300">
                  Our mission is to provide the best comparison service for our customers, helping them make informed decisions and save money.
                </p>
              </div>
              <div className="mt-12 md:mt-0">
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  Useful Links
                </h4>
                <ul className="mt-4">
                  <li>
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      About Us
                    </a>
                  </li>
                  <li className="mt-4">
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      Contact Us
                    </a>
                  </li>
                  <li className="mt-4">
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      Privacy Policy
                    </a>
                  </li>
                  <li className="mt-4">
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  My Account
                </h4>
                <ul className="mt-4">
                  <li>
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      My Profile
                    </a>
                  </li>
                  <li className="mt-4">
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      My Orders
                    </a>
                  </li>
                  <li className="mt-4">
                    <a href="#" className="text-base leading-6 text-gray-300 hover:text-white">
                      My Wishlist
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
                  Subscription
                </h4>
                <p className="mt-4 text-base leading-6 text-gray-300">
                  Subscribe for getting the latest news and updates.
                </p>
                <form className="mt-4 sm:flex">
                  <div className="mt-3 shadow sm:mt-0 flex   bg-white rounded-md border border-gray-300 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue">
                  <input aria-label="Email address" type="email" required className="appearance-none w-full px-5 rounded-md py-3 sm:max-w-xs text-base leading-6 text-gray-700 outline-none transition duration-150 ease-in-out" placeholder="Enter your email" />
                    <button type="submit" className='p-1'>
                    <AiOutlineEnter className='text-gray-600 flex my-auto font-bold' />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-12 xl:mt-0">
            <h4 className="text-sm leading-5 font-semibold tracking-wider text-gray-400 uppercase">
              Mission
            </h4>
            <p className="mt-4 text-base leading-6 text-gray-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisi quis bibendum bibendum, velit sapien bibendum ipsum, euismod bibendum sapien vel sapien. Sed euismod, nisi quis bibendum bibendum, velit sapien bibendum ipsum, euismod bibendum sapien vel sapien.
            </p>
            <SocialMediaIcons />
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8 md:pb-2 pb-8">
          <p className="text-base leading-6 text-gray-400 xl:text-center">
            &copy; 2024 RWAMED. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;