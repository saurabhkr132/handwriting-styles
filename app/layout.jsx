import "@/styles/globals.css";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Handwriting Styles",
  description: "Generate and train handwriting styles with GAN",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <div className="min-h-screen flex flex-col items-center">
          <div className="w-full max-w-4xl px-4 py-8">
            <ToastProvider>
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
