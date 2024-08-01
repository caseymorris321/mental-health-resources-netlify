import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
    const { logout, isAuthenticated } = useAuth0();
    
    const handleLogout = () => {
        logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    };

    return (
        isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-danger">Sign Out</button>
        )
    );
};

export default LogoutButton;