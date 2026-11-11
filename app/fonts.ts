import localFont from "next/font/local";

export const switzer = localFont({
  src: [
    {
      path: "../public/fonts/Switzer-Variable.woff",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../public/fonts/Switzer-VariableItalic.woff",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-switzer",
  display: "swap",
});
