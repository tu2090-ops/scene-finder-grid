import "./globals.css";

export const metadata = {
  title: "Scene Finder",
  description: "A quiet grid of trailer moments. Each card is one second found by the tool chain.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
