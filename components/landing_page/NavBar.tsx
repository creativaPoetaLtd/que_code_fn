"use client";

import { useEffect, useState } from "react";
import { Button } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUserInfo } from "@/hooks/use-user-info";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthenticated, userId } = useUserInfo();

  // Prevent hydration mismatch by only showing auth-dependent content after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavigate = () => {
    if (isAuthenticated && userId) {
      router.push(`/home/${userId}`);
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <nav className="flex fixed top-0 left-0 w-full justify-between items-center h-16 py-4 px-6 lg:px-[16%] bg-[#013f47] text-white z-50">
      <div className="text-2xl font-bold">
        <Image
          src="/Images/qiewcode-logo.png"
          alt="QiewCode"
          width={180}
          height={65}
          priority
          className="h-10 w-auto cursor-pointer object-contain"
        />
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
        <Button
          onClick={handleNavigate}
          className="border-[#00B512] px-8 py-4 text-md text-white transition-colors duration-500 ease-in-out hover:bg-[#1fd331]"
          ghost
        >
          {mounted ? (isAuthenticated ? "Dashboard" : "Sign In") : "Sign In"}
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
          <Button onClick={handleNavigate} className="border-white text-white w-fit" ghost>
            {mounted ? (isAuthenticated ? "Dashboard" : "Sign In") : "Sign In"}
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
