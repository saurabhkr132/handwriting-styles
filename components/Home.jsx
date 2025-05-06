"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CanvasDraw from "@/components/CanvasDraw";
import Leaderboard from "@/components/Leaderboard";
import { Loader2 } from "lucide-react";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import { HelpCircle } from "lucide-react";
import { Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaRegHandPointRight } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { SiWikibooks } from "react-icons/si";

export default function Home() {
  const imageCache = useRef({}); // Ref to persists without triggering re-renders

  const [activeTab, setActiveTab] = useState("generate");
  const [trainText, setTrainText] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("HANDWRITING");
  const [imageDataList, setImageDataList] = useState([]);

  const [character, setCharacter] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'success'
  const [penSize, setPenSize] = useState(20);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const canvasRef = useRef(null);
  const router = useRouter();
  const [showTrainHelp, setShowTrainHelp] = useState(false);

  const [imgSrc, setImgSrc] = useState("");

  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCharacterChange = (e) => {
    const input = e.target.value;
    // if (input.length <= 1) {
    setTrainText(input);
    // }
  };

  const handleGenerate = async () => {
    if (!inputText) return;
    setLoading(true);
    setImageDataList([]);

    const images = [];

    try {
      for (const char of inputText) {
        if (char === " ") {
          images.push(null);
          continue;
        }

        if (imageCache.current[char]) {
          images.push(imageCache.current[char]);
          continue;
        }

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ character: char }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || `Failed to generate for '${char}'`);
        }

        const data = await response.json();
        const base64Img = `data:image/png;base64,${data.image_base64}`;
        imageCache.current[char] = base64Img; // Cache it
        images.push(base64Img);
      }

      setImageDataList(images);
    } catch (error) {
      alert("Error: " + error.message);
      console.error("Error generating word:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (!trainText) {
      alert("Please enter a character first");
      return;
    }

    setIsTraining(true);
    try {
      // 1. Check if the canvas ref is properly initialized
      if (!canvasRef.current) {
        throw new Error("Canvas not properly initialized");
      }

      // 2. Get image data using the exposed method
      let imageData;
      try {
        imageData = canvasRef.current.getDataURL();
        if (!imageData.startsWith("data:image/png")) {
          throw new Error("Canvas returned invalid data");
        }
      } catch (error) {
        throw new Error(`Failed to get canvas data: ${error.message}`);
      }

      // 3. Make the API call
      const response = await fetch("/api/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainText,
          image: imageData,
          username: user.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      const result = await response.json();
      // alert(`Success! View at: ${result.url}`);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 1000); // Revert after 2 seconds
      canvasRef.current.clear();
      setIsCanvasEmpty(true);
    } catch (error) {
      console.error("Training error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const downloadAllImages = () => {
    if (imageDataList.length === 0) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const imageWidth = 20; // Width of each image
    const imageHeight = 20; // Height of each image

    const rows = Math.ceil(imageDataList.length / 5); // Images per row
    const cols = 20; // Number of images per row

    // Set canvas width and height
    canvas.width = cols * imageWidth;
    canvas.height = rows * imageHeight;

    // Draw each image onto the canvas
    imageDataList.forEach((imgData, index) => {
      const img = new Image();
      img.src = imgData;

      img.onload = () => {
        const x = (index % cols) * imageWidth;
        const y = Math.floor(index / cols) * imageHeight;
        ctx.drawImage(img, x, y, imageWidth, imageHeight);

        // If all images are drawn, trigger the download
        if (index === imageDataList.length - 1) {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = "generated_styles.png"; // Name of the file to download
          link.click();
        }
      };
    });
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        {user ? (
          <div className="text-gray-700 font-semibold">
            👋 Logged in as{" "}
            <span className="text-blue-600">{user.username}</span>
            <Button onClick={handleLogout} className="ml-4">
              Logout
            </Button>
          </div>
        ) : (
          <AuthForm />
        )}
      </div>
      {user && (
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={activeTab === "generate" ? "default" : "outline"}
            onClick={() => setActiveTab("generate")}
            // onClick={() => alert("Model not yet trained!")}
            // className="cursor-not-allowed opacity-50"
          >
            Generate Handwriting
          </Button>
          <Button
            variant={activeTab === "train" ? "default" : "outline"}
            onClick={() => setActiveTab("train")}
          >
            Train Model
          </Button>
          <div className="flex justify-end px-4 pt-2">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className="text-blue-500 hover:text-blue-700"
            >
              <Trophy className="w-6 h-6" />
            </button>
          </div>
          <div className="flex justify-end px-4 pt-2">
            <button
              onClick={() => setShowTrainHelp(true)}
              className="text-blue-500 hover:text-blue-700"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>

          <Dialog open={showTrainHelp} onOpenChange={setShowTrainHelp}>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <SiWikibooks className="text-lg" />
                  <DialogTitle>How to Contribute</DialogTitle>
                </div>
              </DialogHeader>
              <ul className="pl-4 space-y-3 text-[15px] text-gray-800 leading-relaxed">
                <li className="flex items-start gap-3 pl-1">
                  <FaRegHandPointRight className="mt-1 text-gray-700 text-4xl" />
                  <span>
                    Enter a single character (a–z, A–Z, 0–9, or basic
                    punctuation). For special characters, multiple-character
                    labels are allowed.
                  </span>
                </li>

                <li className="flex items-start gap-3 pl-1">
                  <FaRegHandPointRight className="mt-1 text-gray-700 text-4xl" />
                  <span>
                    Draw the character in your natural handwriting using the
                    canvas below, preferably using a stylus or a writing pad.
                  </span>
                </li>
                <li className="flex items-start gap-3 pl-1">
                  <FaRegHandPointRight className="mt-1 text-gray-700 text-2xl" />
                  <span>
                    Make sure the character fills most of the canvas—avoid
                    writing full words or phrases.
                  </span>
                </li>
                <li className="flex items-start gap-3 pl-1">
                  <FaRegHandPointRight className="mt-1 text-gray-700 text-lg" />
                  <span>
                    Click "Save Drawing" to submit your handwriting sample.
                  </span>
                </li>
                <li className="flex items-start gap-3 pl-1">
                  <FaRegHandPointRight className="mt-1 text-gray-700 text-3xl" />
                  <span>
                    You can contribute multiple samples per character.{" "}
                    <span className="text-gray-600 italic">
                      (10–20 samples recommended for best results)
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3 pl-1">
                  <FaRegHandPointRight className="mt-1 text-gray-700 text-2xl" />
                  <span>
                    Keep your strokes consistent and clear to help improve model
                    accuracy.
                  </span>
                </li>
              </ul>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {user && (
        <div className="flex justify-center">
          <div className="w-full max-w-lg">
            {activeTab === "generate" && (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Generate Handwriting
                  </h1>
                  <p className="text-gray-600">
                    Enter text to generate realistic handwriting samples
                  </p>
                </div>

                <div className="flex flex-col space-y-4 justify-center items-center">
                  <Input
                    placeholder="Enter text to generate..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !inputText}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                  <div className="relative mt-4 z-50 flex justify-center">
                    <div className="flex gap-4 justify-center items-center">
                      {imageDataList.length > 0 && (
                        <div className="w-screen px-4 mt-4 flex flex-wrap justify-center z-50">
                          {imageDataList.map((src, idx) =>
                            src ? (
                              <img
                                key={idx}
                                src={src}
                                alt={`char-${idx}`}
                                className="w-16 h-16 object-contain"
                              />
                            ) : (
                              <div key={idx} className="w-8" /> // space character
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={downloadAllImages}
                    className="mt-4 px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg transform transition-transform hover:scale-105 hover:from-indigo-600 hover:to-blue-500 active:scale-95 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                    disabled={imageDataList.length === 0}
                  >
                    <div className="flex items-center space-x-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-5 h-5 animate-bounce"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8l-8 8-8-8"
                        />
                      </svg>
                      <span>Download Text</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "train" && (
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Train Model
                  </h1>
                  <p className="text-gray-600">
                    Draw the character below to contribute to the dataset
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <Input
                      placeholder="Enter character"
                      value={trainText}
                      onChange={handleCharacterChange}
                      // maxLength={1}
                      className="text-center text-2xl font-mono h-12"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-600">
                      Pen Size:
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="26"
                      value={penSize}
                      onChange={(e) => setPenSize(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-8 text-right">{penSize}</span>
                  </div>

                  <Card className="p-4 space-y-4">
                    <div className="aspect-square w-full bg-white rounded border border-gray-200">
                      <CanvasDraw
                        ref={canvasRef}
                        penSize={penSize}
                        onDrawChange={(hasContent) =>
                          setIsCanvasEmpty(!hasContent)
                        }
                      />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        canvasRef.current?.clear();
                        setIsCanvasEmpty(true);
                      }}
                      className="w-full text-gray-600"
                    >
                      Clear Canvas
                    </Button>
                  </Card>

                  <Button
                    onClick={handleTrain}
                    disabled={isTraining || !trainText || isCanvasEmpty}
                    variant="secondary"
                    className="w-full bg-blue-700 text-white"
                  >
                    {isTraining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saveStatus === "success" ? (
                      "Saved Successfully"
                    ) : (
                      "Save Drawing"
                    )}
                  </Button>

                  {trainText && (
                    <p className="text-center text-gray-500">
                      Drawing samples for:{" "}
                      <span className="font-bold">{trainText}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            <div hidden={activeTab !== "leaderboard"}>
              <Leaderboard />
            </div>
          </div>
        </div>
      )}
      <footer className="w-full py-4 flex flex-col justify-center items-center text-gray-600 text-sm border-t mt-10">
        <a
          href="https://github.com/saurabhkr132/handwriting-styles"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-black transition"
        >
          <FaGithub className="w-5 h-5" />
          View Repository
        </a>
        <span className="text-xs text-gray-400 mt-1">v0.1.2</span>
        <div className="container mx-auto text-center mt-2">
          <p className="text-sm">
            This is a part of the AV490 - Computer Vision course project (IIST,
            Thiruvananthapuram).
            <br />
            Project members are:
            <br />
            <span className="font-semibold">Saurabh Kumar (SC22B146)</span>
            <br />
            <span className="font-semibold">Vansh Shah (SC22B034)</span>
          </p>
        </div>
      </footer>
    </div>
  );
}