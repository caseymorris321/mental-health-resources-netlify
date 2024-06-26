import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
    const { logout, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout({
            returnTo: window.location.origin,
            onRedirectCallback: (appState) => {
                navigate('/');
            },
        });
    };

    return (
        isAuthenticated && (
            <button onClick={handleLogout} className="btn btn-outline-danger">
                Sign Out
            </button>
        )
    );
};

export default LogoutButton;