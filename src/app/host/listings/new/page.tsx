import Link from "next/link";
import { Icon } from "../../../../components/Icon";
import { ListingForm } from "../../../../components/ListingForm";

export default function NewListingPage() {
  return <main className="shell-container create-listing-page"><Link href="/host/listings" className="back-link"><Icon name="arrow-left" size={16} /> Your listings</Link><ListingForm /></main>;
}
