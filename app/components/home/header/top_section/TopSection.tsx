'use client'
import { useRouter } from "next/navigation";
// import { useTranslations } from "next-intl";
export function TopSection() {
    const router = useRouter();
    const handleNavigate = (() => {
        router.push("/auth/signin")
    })
    // const t = useTranslations("subNav");
    return (
        <div className="hidden px-5 lg:block w-full bg-[#1185ea]">
            <div className="w-full">
                <div className="text-gray-100 py-2 font-sans text-xs font-medium border-b flex justify-between items-center">
                    <span className="flex items-center">
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg> We are open! Mon-Fri, 8:00-7:00
                        <a href="tel:+2500000000" className="font-bold text-black ml-1">+2500000000</a>
                    </span>
                    <div className="lg:text-right flex items-center navBar">
                        <div>
                            <a className="font-medium hover:text-emerald-600" href="#about-us">About us</a>
                            <span className="mx-2">|</span>
                        </div>
                        <div>
                            <a className="font-medium hover:text-emerald-600" href="#contact-us">Contact us</a>
                            <span className="mx-2">|</span>
                        </div>
                        <button className="font-medium hover:text-emerald-600" >My account</button>
                        <span className="mx-2">|</span>
                        <button className="flex items-center font-medium hover:text-emerald-600" onClick={handleNavigate}>
                            <span className="mr-1">
                                <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </span>
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
