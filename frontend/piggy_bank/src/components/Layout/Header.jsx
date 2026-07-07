const Header = () => {
    return (
        <>
            <header class="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl brand-header border-b border-gray-200/70 shadow-sm transition-all duration-200">
                <nav class="px-6 py-4 md:px-8 md:py-5 flex items-center justify-start">
                    <div class="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 hover:text-indigo-600 transition-colors duration-200 cursor-default">
                        <span class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">PiggyBank</span>
                    </div>
                </nav>
            </header>
        </>
    )
}

export default Header;