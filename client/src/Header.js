import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function Header() {

    const { setUserInfo, userInfo } = useContext(UserContext);

    useEffect(() => {
        fetch('http://localhost:4000/profile', { credentials: 'include' })
            .then(response => {
                response.json().then(userInfo => {
                    setUserInfo(userInfo);
                })
            })
    }, [setUserInfo]);

    async function logout() {
        try {
            const response = await fetch('http://localhost:4000/logout', {
                credentials: 'include',
                method: 'POST'
            });

            if (response.ok) {
                // Logout successful on the server side
                alert('Logged out');
                setUserInfo(null);
            } else {
                // Handle other cases, e.g., response.status !== 200
                console.error('Logout failed');
            }
        } catch (error) {
            // Handle network or other errors
            console.error('Logout failed:', error);
        }
    }


    const username = userInfo?.username;

    return (
        <header>
            <Link to={"/"} href className="logo">My Blog</Link>
            <nav>
                {username && (
                    <>
                        <span>Hello, {username}</span>
                        <Link to={'/create'}>Create new Post</Link>
                        <Link onClick={logout}>Logout</Link>
                    </>
                )}
                {!username && (
                    <>
                        <Link to={"/login"} href>Login</Link>
                        <Link to={"/register"} href>Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}