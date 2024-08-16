import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
    const { logout, isAuthenticated } = useAuth0();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.setItem('redirectAfterLogout', '/');
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
