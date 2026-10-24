/** Guide illustration from public/illustrations (plan section 6.11): full width, ~175 px high, 18 px corners. */
export function Illustration({ name, label }: { name: string; label: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <img
        src={`/illustrations/${name}.svg`}
        alt=""
        className="h-[175px] w-full rounded-[18px] bg-illustration-bg object-contain"
      />
      <figcaption className="text-center text-sm font-bold">{label}</figcaption>
    </figure>
  );
}
