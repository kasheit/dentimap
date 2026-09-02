export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="label-eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy-800 dark:text-white lg:text-[34px]">
        {title}
      </h1>
      <p className="mt-2 text-sm text-navy-500 dark:text-navy-300">{description}</p>
    </div>
  );
}
