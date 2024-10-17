import React from 'react'
import Image from 'next/image'

interface ImageSectionProps {
    url: string
}

const ImageSection = ({ url }: ImageSectionProps) => {
  return (
    <div className="w-1/2 bg-black relative lg:flex hidden">
        <Image
          src={url}
          alt="Artistic Flowers"
          layout="fill"
          objectFit="cover"
          className="rounded-md"
        />
      </div>
  )
}

export default ImageSection