// pages/api/generate.js (client-side call)
export async function generateImage(character) {
  const response = await fetch("https://your-space-url.hf.space/run/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [character] })
  });
  const json = await response.json();
  return json.data[0]; // returns image URL or base64
}
