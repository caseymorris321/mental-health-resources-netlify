import { useAuth0 } from "@auth0/auth0-react";

const LogoutButton = () => {
    const { logoutWithRedirect, isAuthenticated } = useAuth0();

    return (
        isAuthenticated && (
            <button
                onClick={() => logoutWithRedirect({ returnTo: window.location.origin })}
                className="btn btn-outline-danger"
            >
                Sign Out
            </button>
        )
    );
};

export default LogoutButton;