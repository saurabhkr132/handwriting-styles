"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CanvasDraw from "@/components/CanvasDraw";
import { Loader2 } from "lucide-react";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import { HelpCircle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("train");
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [character, setCharacter] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // 'idle' | 'success'
  const [penSize, setPenSize] = useState(20);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const canvasRef = useRef(null);
  const router = useRouter();
  const [showTrainHelp, setShowTrainHelp] = useState(false);

  const { user } = useAuth();

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (!user) {
  //       router.push("/login");
  //     } else {
  //       setLoading(false);
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out");
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  const handleCharacterChange = (e) => {
    const input = e.target.value;
    // if (input.length <= 1) {
    setCharacter(input);
    // }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Mock implementation
      const mockImages = Array(text.length).fill(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
      );
      setImages(mockImages);
    } catch (error) {
      console.error("Generation error:", error);
    }
    setLoading(false);
  };

  const handleTrain = async () => {
    if (!character) {
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
          character,
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
            // onClick={() => setActiveTab("generate")}
            onClick={() => alert("Model not yet trained!")}
            className="cursor-not-allowed opacity-50"
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

                <div className="flex flex-col space-y-4">
                  <Input
                    placeholder="Enter text to generate..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !text}
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
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((img, index) => (
                      <Card key={index} className="p-4">
                        <img
                          src={`data:image/png;base64,${img}`}
                          alt={`Generated ${index}`}
                          className="w-full h-auto rounded"
                        />
                      </Card>
                    ))}
                  </div>
                )}
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
                      value={character}
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
                    disabled={isTraining || !character || isCanvasEmpty}
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

                  {character && (
                    <p className="text-center text-gray-500">
                      Drawing samples for:{" "}
                      <span className="font-bold">{character}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <footer className="w-full py-4 flex justify-center items-center text-gray-600 text-sm border-t mt-10">
        <a
          href="https://github.com/saurabhkr132/handwriting-styles"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-black transition"
        >
          <FaGithub className="w-5 h-5" />
          View Repository
        </a>
      </footer>
    </div>
  );
}
