import React from 'react'
import Image from 'next/image'

const AdsSection = () => {
    return (
        <div className='h-[80vh] mt-5 w-full flex '>
            <div className='xl:w-[30%] xl:flex md:w-[40%] md:flex hidden  h-full'>
                <Image height={100} width={500} src='/Ad1.webp' alt='ad' className='w-full h-full object-cover' />
            </div>
            <div className='flex xl:w-[40%] md:w-[60%] w-full h-full justify-center flex-col items-center p-3'>
                <h1 className='flex 2xl:text-4xl xl:text-4xl lg:text-4xl md:text-3xl text-xl text-center font-bold'>Get Your Daily Needs From Our RWAMED Store</h1>
                <p className='flex text-gray-700 text-center  leading-relaxed mt-4'>RWAMED is a platform that allows you to buy and sell products online. We offer a wide range of products from different categories. We also offer a wide range of services that you can use to make your life easier. We have a team of experts who are always ready to help you with any questions or concerns you may have. If you need any assistance, please feel free to contact us at any time.</p>
                <button className='flex mt-5 bg-blue-600 text-white px-8 py-2 rounded-md'>Get In Touch With Us</button>
            </div>
            <div className='xl:w-30% xl:flex md:hidden hidden h-full'>
                <Image height={100} width={500} src='/Ad2.webp' alt='ad' className='w-full h-full object-cover' />
            </div>
        </div>
    )
}

export default AdsSection