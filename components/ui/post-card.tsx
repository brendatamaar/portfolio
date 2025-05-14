import { formatDate } from "@/components/util/formatDate"
import Link from "next/link";

interface Props {
  title: string;
  link: string;
  date: string;
}

export function PostCard({ title, link, date }: Props) {
  return (
    <div>
      <Link href={link} target="_blank">
        <div className="grid grid-cols-12 gap-2 border-b border-opacity-50 py-2 text-sm font-base text-muted-foreground hover:text-black dark:hover:text-white dark:text-font-dark-mode mb-2 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out">
          <div className="col-span-3">{formatDate(date)}</div>
          <div className="col-span-8">{title}</div>
          <div className="flex justify-end col-span-1"><span>→</span></div>
        </div>
      </Link>
    </div>

  );
}
