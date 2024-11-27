'use client'


import { FaMoneyBill } from "react-icons/fa";


interface DashboardCardWrapperProps {
}
export const DashboardCardWrapper = ({

}: DashboardCardWrapperProps) => {
    return (
        <div className="shadow-md text-sm border flex p-4 flex-col text-black border-[#003472]">
            <div className="flex justify-between">
                <p className="">Header 1</p>
                <FaMoneyBill className="flex my-auto" />
            </div>
            <p className="font-extrabold text-lg mt-4">$134353</p>
            <p className=" text-gray-700">+134353 per month</p>
        </div>
    )
}
