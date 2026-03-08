import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "@/components/ui/toaster";
import { useUIStore } from "../../stores";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
