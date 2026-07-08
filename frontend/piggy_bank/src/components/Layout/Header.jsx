import brand from "../../assets/piggybank.png";
import { Link } from 'react-router-dom';
import { MdDashboard } from "react-icons/md";
import { useState } from 'react';

const Header = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className="w-full bg-white/95 backdrop-blur-sm border-b border-emerald-100/50 shadow-sm sticky top-0 z-50">
            <nav className="px-6 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center group">
                    <div className="rounded-xl ">
                        <img src={brand} className="w-25 object-contain" alt="logo" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
                        PiggyBank
                    </span>
                </Link>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Notification */}
                    <button className="relative p-2 rounded-xl hover:bg-emerald-50 transition-colors">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                            JD
                        </div>
                        <div className="hidden md:block">
                            <p className="text-xs font-medium text-gray-700">John Doe</p>
                            <p className="text-xs text-gray-400">Premium</p>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;