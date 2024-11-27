'use client'
import React from 'react'
import DummyProducts from '../data/dummy-data/DummyProducts';
import { BsFillCartPlusFill } from "react-icons/bs";
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const LatestDiscont = () => {
  const route=useRouter();
  const handleRedirect=(()=>{
      route.push("/product_details")
  })
  return (
    <div className="DiscountProducts w-full  flex flex-col " id='about-us'>
      <div className="productsTitle w-full flex flex-col 2xl:p-12 xl:p-12 lg:p-12 md:p-12 p-6 md:items-center items-start md:justify-center justify-center">
        <h1 className="md:text-3xl text-2xl font-bold">Latest Discounted Products</h1>
        <p className="text-gray-700  leading-relaxed">See Our latest discounted products below. Choose your daily needs from here</p>
        <p className='text-gray-700  leading-relaxed'>and get a special discount with free shipping.</p>
      </div>
      <div className="productsList w-full grid-cols-2 grid 2xl:grid-cols-6 xl:grid-cols-6 lg:grid-cols-6 md:grid-cols-4  sm:grid-cols-2 gap-2 ">
        {DummyProducts.slice(0,12).map((product, index) => (
          <div key={index+1} className="productItem shadow-md rounded-md md:p-5 p-3 flex flex-col space-y-2 items-center justify-center h-72" onClick={handleRedirect}>
          <div className='flex w-full mt-2 py-1'>
            <div className='flex w-full space-x-1'>
              <div className='stock'>
                <p className='text-sm font-normal text-blue-600'>Stock:</p>
              </div>
              <div className='price'>
                <p className='text-sm font-medium text-orange-600'>{product.stock}</p>
              </div>
            </div>
            <div className='offers flex text-xs space-x-1 bg-orange-600 text-white p-1 rounded-md'>
                <span>11.3</span><span>%</span><span>Off</span>
            </div>
            </div>
            <div className='image flex w-full'>
            <Image height={100} width={100} src={product.image} alt='product' className='w-full h-44 object-cove transform hover:scale-110 transition-transform duration-500' />
            </div>
            <div className='flex w-full'>
              <div className='name'>
                <p className='text-sm font-bold'>{product.name}</p>
              </div>
            </div>
            <div className='flex w-full justify-between'>
            <div className='flex w-full mt-2 pb-2'>
                <div className='price'>
                  <p className='text-sm font-bold'>{product.price}</p>
                </div>
                <div className='discount'>
                  <p className='text-sm font-bold line-through text-gray-400'>{product.discount}</p>
                </div>
              </div>
              <div className='flex w-full float-end justify-end'>
              <BsFillCartPlusFill className='bg text-blue-600 text-2xl -mt-2 flex cursor-pointer' />
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default LatestDiscont