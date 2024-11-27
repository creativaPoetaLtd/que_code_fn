"use client";
import CategoriesDummyData from "../data/dummy-data/CategoriesDummyData";
import React from "react";
import { RxCaretRight } from "react-icons/rx";
import Image from "next/image";
const CategorySection = () => {
  return (
    <div className="w-full  mx-auto  flex flex-col ">
      <div className="productsTitle w-full flex flex-col 2xl:p-12 xl:p-12 lg:p-12 md:p-12 p-6 md:items-center items-start md:justify-center justify-center">
        <h1 className="md:text-3xl text-2xl font-bold">Our Categories</h1>
        <p className="text-gray-700  leading-relaxed">See Our Categories below. Choose your daily needs from here</p>
        <p className='text-gray-700  leading-relaxed'>and get a special discount with free shipping.</p>
      </div>
      <div className="categoryList w-full grid 2xl:grid-cols-6 xl:grid-cols-6 lg:grid-cols-6 md:grid-cols-4 grid-cols-2 gap-2">
        {CategoriesDummyData.map((category, index) => (
          <div key={index+1} className="categoryItem flex space-x-4 p-3 shadow-lg rounded-md">
            <div className="categoryImage rounded-lg w-16 h-16 block items-center justify-center">
            <Image height={100} width={100}
                src={category.image}
                alt=""
                className="rounded-lg w-16 h-16 object-cover cursor-pointe"
              />
            </div>
            <div className="categoryName w-full flex flex-col">
              <h1 className="text-sm font-bold">{category.name}</h1>
              <div className="subCategories w-full flex flex-col">
                {category.sub_categories.map((subCategory, index) => (
                  <div key={index+1} className="text-xs flex items-center my-auto">
                    <RxCaretRight className="text-xs font-medium" />
                    <span className="ml-2">{subCategory.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          // </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;