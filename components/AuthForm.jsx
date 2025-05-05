"use client";

import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function AuthForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = `${username}@gmail.com`; // Append @gmail.com
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {    
      if (isRegistering) {
        if (err.code === "auth/email-already-in-use") {
          alert("This username is already taken. Please choose another.");
        } else if (err.code === "auth/invalid-email") {
          alert("Invalid username format.");
        } else if (err.code === "auth/weak-password") {
          alert("Password should be at least 6 characters.");
        } else {
          alert("Registration failed. " + err.message);
        }
      } else {
        if (err.code === "auth/invalid-credential") {
          alert("No account found with that username. Create an account first.");
        } else if (err.code === "auth/wrong-password") {
          alert("Incorrect password. Please try again.");
        } else if (err.code === "auth/invalid-email") {
          alert("Invalid username format.");
        } else {
          alert("Login failed. " + err.message);
        }
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto mt-10 p-6 border rounded-xl shadow-md bg-white">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        {isRegistering ? "Create an Account" : "Login"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          {isRegistering ? "Sign Up" : "Login"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <span className="text-sm text-gray-700">
          {isRegistering ? "Already have an account?" : "New here?"}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsRegistering(!isRegistering)}
          className="h-8 text-sm ml-2 text-gray-400"
        >
          {isRegistering ? "Login" : "Sign Up"}
        </Button>
      </div>
    </div>
  );
}
