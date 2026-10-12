import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-bold text-primary">404</h2>
      <p className="mt-4 text-lg text-foreground/80">
        ገጹ አልተገኘም / Page Not Found
      </p>
      <Button asChild className="mt-6 min-h-[48px]">
        <Link href="/am">ወደ መነሻ ገጽ ይመለሱ / Back to Home</Link>
      </Button>
    </div>
  );
}
