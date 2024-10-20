"use client";

import { useState } from "react";
import { Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavigate = () => {
    router?.push("/auth/login");
  }

  return (
    <nav className="flex fixed top-0 left-0 w-full justify-between items-center h-16 py-4 px-6 lg:px-[16%] bg-[#013f47] text-white z-50">
      <div className="text-2xl font-bold">
        <img src="/logo.png" alt="Logo" />
      </div>

      <div className="hidden md:flex items-center space-x-8">
        <a href="#" className="hover:text-green-500">
          Home
        </a>
        <a href="#" className="hover:text-green-500">
          About
        </a>
        <a href="#" className="hover:text-green-500">
          Feature
        </a>
        <a href="#" className="hover:text-green-500">
          Services
        </a>
        <a href="#" className="hover:text-green-500">
          Help
        </a>
      </div>

      <div className="hidden md:flex">
        <Button onClick={handleNavigate} className="border-white text-white" ghost>
          Sign In
        </Button>
      </div>

      <div className="md:hidden">
        {menuOpen ? (
          <CloseOutlined
            className="text-2xl cursor-pointer"
            onClick={toggleMenu}
          />
        ) : (
          <MenuOutlined
            className="text-2xl cursor-pointer"
            onClick={toggleMenu}
          />
        )}
      </div>

      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#013f47] p-6 flex flex-col space-y-6 md:hidden ">
          <a href="#" className="hover:text-green-500">
            Home
          </a>
          <a href="#" className="hover:text-green-500">
            About
          </a>
          <a href="#" className="hover:text-green-500">
            Feature
          </a>
          <a href="#" className="hover:text-green-500">
            Services
          </a>
          <a href="#" className="hover:text-green-500">
            Help
          </a>
          <Button className="border-white text-white w-fit" ghost>
            Sign In
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
