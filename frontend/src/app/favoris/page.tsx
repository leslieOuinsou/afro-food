import { redirect } from 'next/navigation';

export default function FavorisPage() {
  redirect('/dashboard?tab=favoris');
}
