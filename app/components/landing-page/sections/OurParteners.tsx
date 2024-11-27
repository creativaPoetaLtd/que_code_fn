import React from 'react'
import partenersData from '../data/dummy-data/ourPartenersDumyData'
import Image from 'next/image'
const OurParteners = () => {
    return (
        <div className="OurServicesparteners min-h-screen px-3 h-fit py-12 bg-gray-200 w-full flex flex-col space-y-12">
            <div className='upperSection w-full flex flex-col space-y-16 justify-center items-center mx-auto md:px-12 px-1 pb-12 border-b-2  border-b-black'>
                <h1 className="xl:text-5xl md:text-4xl text-2xl  font-bold">Our partenrs</h1>
                <p className='text-gray-700 md:px-20 px-2 mt-2 text-center leading-relaxed'>We have a wide range of parteners who help us to provide the best services to our customers. We are always looking for new parteners who can help us to improve our services. If you are interested in becoming a partener, please feel free to contact us at any time.</p>
                <button className='bg-blue-600 text-white px-4 py-2 mt-4 rounded-md'>Become a Partener</button>
            </div>
            <div className='parternerCards grid md:grid-cols-3 grid-cols-1 w-full gap-6 h-it'>
                {partenersData.map((partener, idx) => (
                    <div key={idx} className='parternerCard flex space-x-2 h-40 rounded-md  border-orange-600 p-2 border'>
                        <div className='w-[30%] h-full  m-auto flex justify-center'>
                            <div className='h-20 border-b-2 border-b-blue-600 rounded-md w-28 flex justify-center m-auto p-2 shadow-md'>
                            <Image height={100} width={100} src={partener.image} alt='log' className='w-full h-full flex justify-center m-auto' />
                            </div>
                        </div>
                        <div className='w-[70%] text-sm h-full flex flex-col py-auto items-center justify-center space-y-3'>
                            <div className='heading w-full'>
                                <h1 className='companyName font-bold'>{partener.name}</h1>
                            </div>
                            <div className='heading w-full'>
                                <p className='description'>{partener.description}</p>
                            </div>
                        </div>
                    </div>
                ))
                }
            </div>


        </div>
    )
}

export default OurParteners