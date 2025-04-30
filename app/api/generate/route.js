// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const character = body.character;

  if (!character) {
    return NextResponse.json({ detail: "No character provided" }, { status: 400 });
  }

  try {
    const response = await fetch("https://handwriting-styles-model.onrender.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ detail: error.detail || "Model server error" }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ detail: "Internal error" }, { status: 500 });
  }
}
