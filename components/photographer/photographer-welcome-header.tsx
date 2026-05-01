export function PhotographerWelcomeHeader({
  firstName,
}: {
  firstName: string;
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl">
        Welcome back, {firstName} 👋
      </h1>
      <p className="mt-2 text-zinc-600">
        Here&apos;s what&apos;s happening with your business today.
      </p>
    </div>
  );
}
