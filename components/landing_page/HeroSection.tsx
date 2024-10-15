import { MdArrowOutward } from "react-icons/md";

const HeroSection = () => {
  return (
    <section className="bg-[#013f47] text-white min-h-screen flex flex-col pt-16 md:pt-24"> 
      <div className="flex flex-col md:flex-row items-center justify-around w-full flex-grow px-[10%] py-5">
        <div className="flex flex-col space-y-6 max-w-lg">
          <span className="inline-block bg-[#2e565e] py-1 w-fit px-3 rounded-full text-center text-md">
            🔥 100% TRUSTED PLATFORM
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Finance With <br /> Security And <br />
            <span className="text-[#E2FF54]">Flexibility</span>
          </h1>
          <p className="text-base sm:text-lg">
            No-Fee Checking Account With Cash Back Rewards. Enjoy Fee-Free
            Banking And Earn Cash Back On Your Everyday Purchases.
          </p>
          <div className="relative flex items-center">
            <button className="bg-[#00B512] hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-between space-x-3 transition duration-300 ease-in-out">
              <span>Open Account</span>
              <div className="w-10 h-10 bg-white text-[#013f47] rounded-full flex items-center justify-center transform rotate-150 transition duration-300 ease-in-out">
                <MdArrowOutward className="text-lg" />
              </div>
            </button>
          </div>
        </div>

        <div className="mt-5 md:mt-0 lg:block h-[50vh] md:h-[70%] hidden">
          <img src="/homeImg.png" alt="Phone and Card" className="h-full" />
        </div>
      </div>

      <div className="w-full bg-[#04684C] py-8 px-[6%] md:px-[13%] ">
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6  px-4">
    <img src="/spherule.png" alt="Spherule" className="h-8 mx-auto" />
    <img src="/samsung.png" alt="Samsung Pay" className="h-8 mx-auto" />
    <img src="/visa.png" alt="Visa" className="h-8 mx-auto" />
    <img src="/amazon.png" alt="Amazon Pay" className="h-8 mx-auto" />
    <img src="/paypal.png" alt="PayPal" className="h-8 mx-auto" />
    <img src="/alipay.png" alt="Alipay" className="h-8 mx-auto" />
  </div>
</div>


    </section>
  );
};

export default HeroSection;
