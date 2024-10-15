import React from "react";
import Image from "next/image";
import { FaTwitter, FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-8 w-full px-5 md:px-[10%]">
      <div className="mx-auto flex flex-col items-center justify-center text-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <Image src="/logo.png" alt="QiewCode Logo" width={200} height={150} />
        </div>

        <div className="w-full flex flex-col md:flex-row justify-center items-center text-center md:text-left space-y-6 md:space-y-0">
          <ul className="flex flex-wrap justify-center items-center  md:justify-start space-x-4 md:space-x-6 text-gray-600 font-medium">
            <li>
              <a href="#personal-loan" className="hover:text-green-600">
                Personal Loan
              </a>
            </li>
            <li>
              <a href="#one-card" className="hover:text-green-600">
                One Card
              </a>
            </li>
            <li>
              <a href="#savings" className="hover:text-green-600">
                Savings
              </a>
            </li>
            <li>
              <a href="#checking" className="hover:text-green-600">
                Checking
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-green-600">
                Contact
              </a>
            </li>
            <li>
              <a href="#help" className="hover:text-green-600">
                Help
              </a>
            </li>
            <li>
              <a href="#support" className="hover:text-green-600">
                Support
              </a>
            </li>
          </ul>
        </div>

        <div className="flex space-x-4 text-white">
          <a
            href="https://twitter.com"
            className="bg-green-600 p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <FaTwitter />
          </a>
          <a
            href="https://facebook.com"
            className="bg-green-600 p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://instagram.com"
            className="bg-green-600 p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <FaInstagram />
          </a>
          <a
            href="https://linkedin.com"
            className="bg-green-600 p-2 rounded-full hover:bg-green-700 transition-colors"
          >
            <FaLinkedinIn />
          </a>
        </div>

        <div className="mt-8 w-full flex flex-col md:flex-row justify-center items-center text-center md:text-left space-y-6 md:space-y-0">
          <div className="text-gray-600 text-sm">
            Send Your Feedback:{" "}
            <a
              href="mailto:support@qiewcode.com"
              className="text-green-600 hover:underline"
            >
              support@qiewcode.com
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm w-full">
          <ul className="flex flex-col md:flex-row md:justify-center space-y-4 md:space-y-0 md:space-x-4">
            <li>
              <a href="#privacy-policy" className="hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>|</li>
            <li>
              <a href="#terms-conditions" className="hover:underline">
                Terms & Conditions
              </a>
            </li>
            <li>|</li>
            <li>
              <a href="#cookie-notice" className="hover:underline">
                Cookie Notice
              </a>
            </li>
            <li>|</li>
            <li>
              <a href="#copyright-policy" className="hover:underline">
                Copyright Policy
              </a>
            </li>
            <li>|</li>
            <li>
              <a href="#data-policy" className="hover:underline">
                Data Policy
              </a>
            </li>
          </ul>

          <p className="mt-4">© 2024 creativa poeta. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
