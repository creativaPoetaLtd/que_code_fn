import Menu from "../components/Menu";
import Navbar from "../components/NavBar";
export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="container w-full min-h-screen h-full flex">
            <div className="sidebar w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 sticky top-0 h-screen">
                <Menu />
            </div>
            <div className="content w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-gray-200 h-[120vh]">
                <Navbar />
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
