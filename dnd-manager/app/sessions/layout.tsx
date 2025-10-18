import Navbar from "@/components/layout/navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a1f] flex flex-col md:flex-row">
      <Navbar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
