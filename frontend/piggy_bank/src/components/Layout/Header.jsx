import brand from "../../assets/piggybank.png"
import { Link } from 'react-router-dom'

const Header = () => {
    return (
        <>
            <header class="w-full bg-white/90 backdrop-blur-sm brand-header  border-gray-200/70 shadow-sm transition-all duration-200">
                <nav class="px-0 py-2 md:px-0 md:py-2 flex items-center justify-start">
                    <Link to="/">
                    <div class="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 hover:text-indigo-600 transition-colors duration-200 cursor-default flex items-center">
                        <img src={brand} className="w-30" alt="logo" />
                        <span class="bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">PiggyBank</span>
                    </div>
                    </Link>
                </nav>
            </header>
        </>
    )
}

export default Header;