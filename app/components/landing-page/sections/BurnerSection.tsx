import React, { useEffect, useState } from 'react'
import { VscChevronLeft, VscChevronRight } from 'react-icons/vsc'
import sliderImages from '../data/dummy-data/SliderImages'
import Image from 'next/image'
const BurnerSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const handlePrevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? sliderImages.length - 1 : prevSlide - 1));
  };
  const handleNextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === sliderImages.length - 1 ? 0 : prevSlide + 1));
  };
  useEffect(() => {
    const interval = setInterval(() => {
      handleNextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <div className="bg-gradient-to-l pt-2 rounded-md flex min-h-screen items-center flex-col h-screen space-y-12">
      <div className="w-full flex rounded-md h-[70%]">
        <div className="mainBunner h-full  flex 2xl:flex-row xl:flex-row lg:flex-row md:flex-row flex-col justify-center items-center m-auto bg-[#426D9C] w-full relative bg-no-repeat bg-cover bg-center bg-fixed bg-img">
          {sliderImages.map((image, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full rounded-md transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <Image height={100} width={800}
                src={image.url}
                alt={`Slider ${index}`}
                className="w-full h-full object-cover transition-transform duration-500"
              />
              <div className="absolute md:ml-10 ml-1 xl:px-56 lg:pr-28 2xl:left-[34%] 2xl:pr-96 md:px-24 px-12 top-1/2 xl:left-[25%] lg:left-[41%] md:left-[37%] left-[45%] w-full xl:font-bold font-bold text-black xl:text-xl md:text-lg text:xl my-auto text-start transform -translate-x-1/2 -translate-y-1/2  flex  leading-loosefont-bold">
                {image.text}
              </div>
            </div>
          ))}
          <button
            className="absolute  text-xs top-1/2 laptop:left-4 desktop:left-4 left-1 transform -translate-y-1/2 text-white font-bold bg-gray-800 px-[.5px] py-1 rounded-md opacity-70 hover:opacity-100"
            onClick={handlePrevSlide}
          >
            <VscChevronLeft />
          </button>
          <button
            className="absolute text-xs top-1/2 laptop:right-4 desktop:right-4 right-1 transform -translate-y-1/2 text-white font-bold bg-gray-800 px-[.5px] py-1 rounded-md opacity-70 hover:opacity-100"
            onClick={handleNextSlide}
          >
            <VscChevronRight />
          </button>
          <div className="flex justify-center mt-4 absolute bottom-[5%] left-[2%]">
            {sliderImages.map((image, index) => (
              <div
                key={index}
                className={`mx-2 overflow-hidden cursor-pointer ${index === currentSlide ? 'border-2 border-blue-500' : 'border border-gray-300'
                  }`}
                style={{ width: '30px', height: '20px' }}
                onClick={() => setCurrentSlide(index)}
              >
                <Image height={100} width={400}
                  src={image.url}
                  alt={`Thumbnail ${index}`}
                  className="w-full h-full object-cover transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="md:flex flex-col items-center justify-center w-[35%] space-y-1 h-full px-4 hidden">
          <div className='container1 relative flex h-1/2 w-full'>
            <Image height={100} width={400} src='/med5.jpg' alt='rwanda' className='himage w-full object-cover transform hover:scale-100 transition-transform duration-500' />
            <div className='middle backdrop-blur-sm  rounded-lg p-4 absolute top-3 left-1 space-y-3 flex-col text-white'>
              <h1 className='text-base font-bold'>SAVE 20%</h1>
              <h1 className='font-bold text-xl'>On Your First Order</h1>
              <button className='bg-blue-600 text-white px-4 py-2 rounded-md'>Order Now</button>
            </div>
          </div>
          <div className='container1 relative flex h-1/2'>
            <Image height={100} width={400} src='/med3.jpg' alt='rwanda' className='himage w-full object-cover transform hover:scale-100 transition-transform duration-500' />
            <div className='middle backdrop-blur-sm rounded-lg p-4 absolute top-3 left-1 space-y-3 flex-col text-white'>
              <h1 className='text-base font-medium'>SAVE 20%</h1>
              <h1 className='font-bold text-black text-xl'>On Your First Order</h1>
              <button className='bg-blue-600 text-white px-4 py-2 rounded-md'>Order Now</button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full px-4 bg-gradient-to-r from-blue-600 to-[#3991f5]  sm:px-10">
        <div className="discounts md:flex-row flex-col w-full rounded-md p-6 flex">
          <div className="leftDiv flex flex-col  w-full">
            <h1 className="w-full text-white md:text-3xl text-xl font-bold mb-4 leading-tight">100% Natural Quality Organic Product</h1>
            <p className="w-full flex text-gray-300 md:text-base text-sm">Explore our latest discounted products and enjoy special discounts on premium organic items.</p>
          </div>
          <div className="button md:w-[30%] w-full flex items-center justify-end">
            <button className="shopNowBtn bg-orange-600 text-white font-bold py-2 px-4 rounded-md">Shop Now</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BurnerSection