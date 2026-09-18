import { Link } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="animate-fadeIn flex flex-col items-center justify-center text-center gap-4 py-24">
      <span className="p-4 rounded-2xl border border-line bg-card text-muted">
        <SearchX size={28} />
      </span>
      <h1 className="text-2xl font-bold text-hi">Route not found</h1>
      <p className="text-sm text-muted max-w-sm">
        That console page doesn&rsquo;t exist. It may have been renamed or you followed a stale link.
      </p>
      <Link to="/dashboard" className="btn-primary mt-2">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>
    </div>
  );
}
