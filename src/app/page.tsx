import { ThemeProvider } from "@/components/ThemeProvider";
import Studio from "@/components/Studio";

export default function Home() {
  return (
    <ThemeProvider>
      <Studio />
    </ThemeProvider>
  );
}
