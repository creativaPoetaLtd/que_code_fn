import React from "react";
import Image from "next/image";
import { PiQuotesFill } from "react-icons/pi";
import { MdArrowOutward } from "react-icons/md";


interface Testimonial {
  id: number;
  name: string;
  role: string;
  message: string;
  rating: number;
  avatar: string;
  bgColor: string; 
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Mike Torello",
    role: "CEO of Initech",
    message: `I like getting the SMS & knowing the jobs done. I often refer to it, “hope you get a ping today!” because my product.`,
    rating: 5,
    avatar: "/avatar1.png",
    bgColor: "bg-white",
  },
  {
    id: 2,
    name: "Richards Hawkins",
    role: "Marketing Manager of Upnow",
    message: `We have successfully sold digital product and have happy with the results & look forward to using it again this.`,
    rating: 5,
    avatar: "/avatar2.png",
    bgColor: "bg-[#004852] text-white",
  },
  {
    id: 3,
    name: "Thomas Magnum",
    role: "Barellon NSW",
    message: `Design Monks offers producers a cost-effective selling tool. Having the ability to post prices that you want on an exchange visible.`,
    rating: 5,
    avatar: "/avatar3.png",
    bgColor: "bg-white",
  },
];

const Testimonials: React.FC = () => {
  return (
    <section className="bg-[#F6F9F8] py-12 min-h-screen items-center flex ">
      <div className="max-w-6xl mx-auto px-6">
        {/* Badge & Heading */}
        <div className="text-center mb-12">
          <div className="bg-green-100 inline-block px-4 py-2 rounded-full text-green-800 font-semibold text-sm mb-4">
            🔥 TESTIMONIAL
          </div>
          <h2 className="text-4xl font-semibold text-black">
            Get To Know Our Clients
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-black ">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`p-6 rounded-lg shadow-lg ${testimonial.bgColor}`}
            >
              {/* Quote Icon */}
              <div className="text-3xl text-green-600 mb-4">
                <PiQuotesFill />
              </div>

              {/* Testimonial Message */}
              <p className="text-lg mb-6">{testimonial.message}</p>

              {/* User Info */}
              <div className="flex items-center space-x-4">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4">
                {Array(testimonial.rating)
                  .fill(0)
                  .map((_, index) => (
                    <span key={index} className="text-green-500 text-lg">
                      ★
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-16 w-full items-center flex justify-center ">
        <div className="relative flex items-center">
          <button className="bg-white border border-[#00B512] hover:bg-[#e7e5e5] text-black font-semibold py-4 px-8 rounded-full flex items-center justify-between space-x-4 transition duration-300 ease-in-out">
            <span>View More</span>
            <div className="w-6 h-6 bg-[#00B512] text-white rounded-full flex items-center justify-center transform rotate-150 transition duration-300 ease-in-out">
              <MdArrowOutward className="text-xl" />
            </div>
          </button>
        </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
