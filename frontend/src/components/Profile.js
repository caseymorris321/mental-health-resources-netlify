import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Profile = () => {
    const { user, isAuthenticated } = useAuth0();

    return (
        isAuthenticated && (
            <div className="d-flex align-items-center">
                {user?.picture && (
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="rounded-circle me-3"
                        width="50"
                        height="50"

                    />
                )}
                <span className="fw-bold">{user?.name}</span>
            </div>
        )
    );
}

export default Profile;