import { redirect } from 'next/navigation';

/** Legacy path — directory is now photographer home at `/photographer`. */
export default function PhotographerDirectoryRedirect() {
  redirect('/photographer');
}
