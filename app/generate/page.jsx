'use client';
import React, { useState } from "react";

const Page = () => {
  const [imgSrc, setImgSrc] = useState("");
  const [character, setCharacter] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!character) return;
    setLoading(true);
    setImgSrc(""); // clear previous image
    try {
      const response = await fetch("https://handwriting-styles-model.onrender.com/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate image");
      }
  
      const data = await response.json();
      setImgSrc(`data:image/png;base64,${data.image_base64}`);
    } catch (error) {
      alert("Error: " + error.message); // show user-friendly error
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <input
        type="text"
        maxLength={1}
        placeholder="Enter a character"
        value={character}
        onChange={(e) => setCharacter(e.target.value)}
        className="mb-4 px-2 py-1 border border-gray-300 rounded"
      />
      <button
        onClick={handleGenerate}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Generated Handwriting"
          className="mt-4 border rounded"
        />
      )}
    </div>
  );
};

export default Page;
