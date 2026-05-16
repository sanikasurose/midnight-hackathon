export default function HomePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">VeriHire</h1>
      <p className="text-zinc-300">
        Phase 0 scaffold. Frontend is live and configured to call the backend at:
      </p>
      <pre className="rounded bg-zinc-900 p-4 text-sm">{apiUrl}</pre>
      <div className="grid gap-3 sm:grid-cols-2">
        <a className="rounded border border-zinc-800 p-4 hover:bg-zinc-900" href="/candidate">
          Candidate Portal (placeholder)
        </a>
        <a className="rounded border border-zinc-800 p-4 hover:bg-zinc-900" href="/employer">
          Employer Portal (placeholder)
        </a>
      </div>
    </main>
  );
}

