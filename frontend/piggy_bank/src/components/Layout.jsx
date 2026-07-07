const Layout = ({children}) => {
    return (
        <div className="app-shell">
            <div className="app-body">
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Layout;