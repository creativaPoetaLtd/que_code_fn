import React from "react";
import Link from "next/link";
const ProductOfTheDay = () => {

  return (
    <div className='bunner flex flex-col  w-full  h-[70%] '>
      <div className={`mainPage  flex md:flex-row flex-col justify-between bg-blue-700  h-full relative md:px-20 px-6 pt-6`}>
        <div className='mainPageContent md:w-[60%] w-full h-full md:p-12 p-1 my-auto justify-center flex flex-col'>
          <div className='flex'>
            <p className='text-[#FFFFFF] text-sm md:ml-1 my-auto font-thin justify-center'>Product of day</p>
          </div>
          <p className='lg:text-4xl md:text-3xl text-2xl md:mt-6 mt-5 text-white'>
            X ray emiter
          </p>
          <p className='text-[#FFFFFF] text-sm mt-2 font-thin '>
            This is a sample description to show to clients and people who are very interested to buy this product. This is a sample description to show to clients and people who are very interested to buy this product.
          </p>
          <Link href={''} className="flex space-x-2 p-2 px-4 rounded w-fit h-fit text-sm mt-2 bg-[#EDB62E]">
            <p className="">View more</p>
          </Link>
        </div>
        <div className="image md:w-[60%] w-full h-full pt-4 pbm-12">
          <div className="w-full h-[70%] ">
            <img src={"/med13.jpg"} height={998} width={500} alt="" className=" w-full h-[30rem]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductOfTheDay;