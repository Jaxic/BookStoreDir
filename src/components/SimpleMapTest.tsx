/** @jsxImportSource react */
import { useEffect, useState } from 'react';

export default function SimpleMapTest() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('[SimpleMapTest] Component mounted');
      setMounted(true);
    } catch (err: any) {
      console.error('[SimpleMapTest] Error:', err);
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600 font-semibold">
        ❌ Component Error: {error}
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full text-blue-600">
        ⏳ Component mounting...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-green-600 font-semibold">
      ✅ React component works!
    </div>
  );
} 