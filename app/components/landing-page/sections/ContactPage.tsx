import { useState } from "react";
import { BiPhone } from "react-icons/bi";
import { PiEnvelopeSimpleOpen } from "react-icons/pi";


const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, ] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
  };
  return (
    <div className="flex w-full flex-col h-fit">
      <div className="w-full px-3 bg-gray-200 h-fit justify-between  flex flex-col">
        <div className="w-full pb-5  flex flex-col h-full">
          <div className="flex lg:flex-row flex-col w-full  mt-16">
            <div className=" w-full flex flex-col space-y-6 ">
              <div className="felx flex-col space-y-2 lg:w-[262px]">
                <div className="flex m-auto items-start">
                  <div className="w-[40px] h-[40px] rounded-full flex bg-[#EDB62E]">
                    <BiPhone className="text-white text-xl m-auto justify-center items-center" />
                  </div>
                  <h1 className="text-xl font-bold flex my-auto justify-center ml-2">
                    Contact us
                  </h1>
                </div>
                <h1 className="text-sm">We are available 24/24 in week.</h1>
                <p className="text-sm">Phone: +250 784 534 678</p>
              </div>
              <div className="line w-[262px] h-[1px] bg-[#EDB62E]"></div>
              <div className="felx flex-col space-y-2 lg:w-[262px]">
                <div className="flex m-auto items-start">
                  <div className="w-[40px] h-[40px] rounded-full flex bg-[#EDB62E]">
                    <PiEnvelopeSimpleOpen className="text-white text-xl m-auto justify-center items-center" />
                  </div>
                  <h1 className="text-xl font-bold flex my-auto justify-center ml-2">
                    Send us a message
                  </h1>
                </div>
                <p className="text-sm">
                   Fill the form below to send us a message.
                </p>
                <p className="email text-sm">Email: rwamed@gmail.com</p>
                <p className="email text-sm">Email: support@rwamed.com</p>
              </div>
            </div>
            <div className="lg:w-[70%] w-full lg:p-0 lg:mt-0 mt-12 flex flex-col lg:shadow">
              <form
                onSubmit={handleSubmit}
                action=""
                className="flex flex-col md:w-[737px] w-full m-auto justify-center  h-full space-y-6">
                <div className="flex md:flex-row flex-col md:space-y-0 space-y-3 justify-between">
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text"
                    placeholder="Names *"
                    className="md:w-[235px] w-full h-[50px] bg-[#F5F5F5] rounded-md p-2"
                  />
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="text"
                    placeholder="Email *"
                    className="md:w-[235px] w-full h-[50px] bg-[#F5F5F5] rounded-md p-2"
                  />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="text"
                    placeholder="Phone number *"
                    className="md:w-[235px] w-full h-[50px] bg-[#F5F5F5] rounded-md p-2"
                  />
                </div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  cols={30}
                  rows={10}
                  placeholder="Message *"
                  className="w-full h-[200px] bg-[#F5F5F5] rounded-md p-2 mt-4"
                />
                <button className="bg-[#EDB62E] text-white px-4 py-3 w-fit float-right justify-end self-end rounded-md">
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
