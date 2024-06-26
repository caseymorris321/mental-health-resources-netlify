import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
    const { logout, isAuthenticated } = useAuth0();

    const handleLogout = () => {
        localStorage.setItem('redirectAfterLogout', '/');
        logout({ returnTo: window.location.origin });
    };

    return (
        isAuthenticated && (
            <button
                onClick={handleLogout}
                className="btn btn-outline-danger"
            >
                Sign Out
            </button>
        )
    );
};

export default LogoutButton;