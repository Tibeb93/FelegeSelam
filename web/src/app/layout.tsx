import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Since we have a `not-found.tsx` page on the root app directory, a root layout file
// is required by Next.js App Router, passing children through to [locale]/layout.tsx.
export default function RootLayout({ children }: Props) {
  return children;
}
