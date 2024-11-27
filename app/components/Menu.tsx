
import Image from "next/image";
import Link from "next/link";
import { FaSignOutAlt, FaUser, FaUsers } from "react-icons/fa";
import { GiCompanionCube } from "react-icons/gi";
import { GrActions } from "react-icons/gr";
import { HiHome } from "react-icons/hi";
import { MdMoney } from "react-icons/md";
import { SlSettings } from "react-icons/sl";
const role = 'admin'
const menuItems = [
    {
        title: "MENU",
        items: [
            {
                icon: <HiHome />,
                label: "Dashboard",
                href: "/admin",
                visible: ["admin", "transimitter", "agent", "Financier", "Customer"],
            },
            {
                icon: <FaUsers />,
                label: "Users",
                href: "/admin/users",
                visible: ["admin", "agent"],
            },
            {
                icon: <GiCompanionCube />,
                label: "Facilities",
                href: "/admin/facilities",
                visible: ["admin"],
            },
            {
                icon: <GrActions />,
                label: "Actions",
                href: "/admin/products",
                visible: ["admin"],
            },
            {
                icon: <MdMoney />,
                label: "Transactions",
                href: "/admin/transactions",
                visible: ["admin"],
            },
        ]
    },
    {
        title: "OTHER",
        items: [
            {
                icon: <FaUser />,
                label: "Profile",
                href: "/profile",
                visible: ["admin", "teacher", "student", "parent"],
            },
            {
                icon: <SlSettings />,
                label: "Settings",
                href: "/settings",
                visible: ["admin", "teacher", "student", "parent"],
            },
            {
                icon: <FaSignOutAlt />,
                label: "Logout",
                href: "/auth/login",
                visible: ["admin", "teacher", "student", "parent"],
            },
        ],
    },
];

const Menu = () => {
    return (
        <div className="h-[96vh] flex flex-col justify-between ">
            <Link
                href="/"
                className="flex absolute top-2 items-center justify-center lg:justify-start gap-2"
            >
                <Image src="/logo.png" alt="logo" width={100} height={100} />
            </Link>
            <div className="mt-12 text-sm">
                {menuItems[0].items.map((item) => {
                    if (item.visible.includes(role)) {
                        return (
                            <Link
                                href={item.href}
                                key={item.label}
                                className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                            >
                                {typeof item.icon === "string" ? (
                                    <Image src={item.icon} alt={item.label} width={20} height={20} />
                                ) : (
                                    item.icon
                                )}
                                <span className="hidden lg:block">{item.label}</span>
                            </Link>
                        );
                    }
                })}
            </div>

            <div className="mt-4 text-sm  ">
                {menuItems[1].items.map((item) => {
                    if (item.visible.includes(role)) {
                        return (
                            <Link
                                href={item.href}
                                key={item.label}
                                className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                            >
                                {typeof item.icon === "string" ? (
                                    <Image src={item.icon} alt={item.label} width={20} height={20} />
                                ) : (
                                    item.icon
                                )}
                                <span className="hidden lg:block">{item.label}</span>
                            </Link>
                        );
                    }
                })}
            </div>
        </div>
    );
};

export default Menu;
