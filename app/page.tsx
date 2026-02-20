import AnalyzerForm from "./components/AnalyzerForm"; // Adjust the path if you didn't use a components folder

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="mb-8 text-3xl font-bold">Protein Tracker</h1>
      <AnalyzerForm />
    </main>
  );
}