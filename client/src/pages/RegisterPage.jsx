import { useState } from "react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function register(ev) {
    try {
      ev.preventDefault();
      const response = await fetch(
        "https://mern-blog-9uge.onrender.com/register",
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
          headers: { "Content-type": "application/json" },
        }
      );

      if (response.ok) {
        // Registration successful
        const userDoc = await response.json();
        alert("Registration Sucessful");
        console.log("User registered:", userDoc);
      } else {
        // Registration failed
        const errorData = await response.json();
        if (errorData.error.includes("Username is already taken.")) {
          alert("Username is already taken");
        } else {
          console.log("Registration error:", errorData);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <form className="register" onSubmit={register}>
      <h1>Register</h1>
      <input
        type="text"
        placeholder="username"
        value={username}
        onChange={(ev) => setUsername(ev.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(ev) => setPassword(ev.target.value)}
      />
      <button>Register</button>
    </form>
  );
}
