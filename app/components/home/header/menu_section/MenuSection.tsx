"use client"
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import Link from 'next/link';
import { RiArrowDropDownLine } from "react-icons/ri";
export function MenuSection() {

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <Link href={`/delivery/services/bank`}>
          Delivery
        </Link>
      ),
    },
  ];

  return (
    <div className="bg-white w-full sticky top-0 z-20">
      <div className="w-full">
        <div className="top-bar h-16 lg:h-auto flex items-center justify-between py-4 mx-auto">
          <a className="mr-3 lg:mr-12 xl:mr-12 hidden md:hidden lg:block" href="/">
            <div className="flex font-extrabold text-xl w-24 h-10 text-blue-700 ">
              RWAMED
            </div>
          </a>
          <div className="w-full transition-all duration-200 ease-in-out lg:flex lg:max-w-[520px] xl:max-w-[750px] 2xl:max-w-[900px] md:mx-12 lg:mx-4 xl:mx-0">
            <div className="w-full flex flex-col justify-center flex-shrink-0 relative z-30">
              <div className="flex flex-col mx-auto w-full">
                <form className="relative pr-12 md:pr-14 bg-white overflow-hidden shadow-sm rounded-full w-full border">
                  <label className="flex items-center py-0.5">
                    <input
                      className="form-input w-full pl-5 appearance-none transition ease-in-out border text-dinput text-sm font-sans rounded-md min-h-10 h-10 duration-200 bg-white focus:ring-0 outline-none border-none focus:outline-none placeholder-gray-500 placeholder-opacity-75"
                      placeholder="Search for products (e.g. syringes, catheters, etc)"
                      // value=""
                      type="text"
                    />
                  </label>
                  <button
                    type="submit"
                    className="outline-none text-xl text-[#1185ea] absolute top-0 right-0 end-0 w-12 md:w-14 h-full flex items-center justify-center transition duration-200 ease-in-out hover:text-heading focus:outline-none "
                  >
                    <svg
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="0"
                      viewBox="0 0 512 512"
                      height="1em"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fill="none" strokeMiterlimit="10" strokeWidth="32" d="M221.09 64a157.09 157.09 0 10157.09 157.09A157.1 157.1 0 00221.09 64z"></path>
                      <path fill="none" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="32" d="M338.29 338.29L448 448"></path>
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="hidden md:hidden md:items-center lg:flex xl:block absolute inset-y-0 right-0 pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button className="pr-5 text-[#1185ea] text-2xl font-bold">
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 drop-shadow-xl"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <a href="/viewCart">
            <button className="relative px-5 text-[#1185ea] text-2xl font-bold">
              <span className="absolute z-10 top-0 right-0 inline-flex items-center justify-center p-1 h-5 w-5 text-xs font-medium leading-none text-red-100 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">36</span>
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 drop-shadow-xl"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
            </a>
            <button className="pl-5 text-[#1185ea] text-2xl font-bold">
              <span>
                <svg
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 drop-shadow-xl"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:block xl:block  w-full border-b">
        <div className="w-full h-12 flex justify-between items-center">
          <div className="inline-flex">
            <div className="relative">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center md:justify-start md:space-x-10">
                  <nav className="md:flex space-x-10 items-center">
                    <div className="relative font-serif">
                    <div >
                        <a>
                          <Space>
                          Categories
                            <RiArrowDropDownLine size={30} />
                          </Space>
                        </a>
                      </div>
                    </div>
                    <a className="font-serif mx-4 py-2 text-sm font-medium hover:text-emerald-600" href="#about-us">
                    About
                    </a>
                    <a className="font-serif mx-4 py-2 text-sm font-medium hover:text-emerald-600" href="#contact-us">
                    Contact
                    </a>
                    <div className="relative font-serif">
                      <button
                        className="group inline-flex items-center py-2 text-sm font-medium hover:text-emerald-600 focus:outline-none"
                        type="button"
                        id="headlessui-popover-button-:rc:"
                      >
                      </button>
                      <Dropdown menu={{ items }}>
                        <a onClick={(e) => e.preventDefault()}>
                          <Space>
                          Services
                            <RiArrowDropDownLine size={30} />
                          </Space>
                        </a>
                      </Dropdown>
                      {/* Sub-menu */}
                      <div className="hidden absolute z-10 -ml-1 mt-1 transform w-screen max-w-xs bg-white opacity-100 translate-y-0" id="headlessui-popover-panel-:rh:">
                        <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-y-scroll flex-grow scrollbar-hide w-full h-full">
                          <div className="relative grid gap-2 px-6 py-6">
                            <span className="p-2  font-serif items-center rounded-md hover:bg-gray-50 w-full hover:text-emerald-600">
                              <div className="w-full flex">
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="my-auto" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                                  <rect x="2" y="7" width="20" height="5"></rect>
                                  <line x1="12" y1="22" x2="12" y2="7"></line>
                                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                                </svg>
                                <a className="relative inline-flex items-center font-serif ml-2 py-0 rounded text-sm font-semibold">Terms of Use</a>
                              </div>
                            </span>
                            <span className="p-2  font-serif items-center rounded-md hover:bg-gray-50 w-full hover:text-emerald-600">
                              <div className="w-full flex">
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="my-auto" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                                  <rect x="2" y="7" width="20" height="5"></rect>
                                  <line x1="12" y1="22" x2="12" y2="7"></line>
                                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                                </svg>
                                <a className="relative inline-flex items-center font-serif ml-2 py-0 rounded text-sm font-semibold">Privacy Policy</a>
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* <button className="font-serif mx-4 py-2 text-sm font-medium hover:text-emerald-600">
                      <CustomLink href="/auth/signin">Login</CustomLink>
                    </button> */}
                  </nav>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
