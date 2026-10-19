import BrowseList, { browseMetadata } from "@/components/BrowseList";

// Weekly, like product pages: the listed set only changes when products are deleted.
export const revalidate = 604800;

export function generateMetadata() {
  return browseMetadata(1);
}

export default function BrowsePage() {
  return <BrowseList page={1} />;
}
