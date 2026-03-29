import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getWishlistStats } from "../wishlist.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const namespace = url.searchParams.get("namespace") || "wishlist";
  const stats = await getWishlistStats(session.shop, namespace);

  return Response.json({
    status: 200,
    customers: stats.customers,
    products: stats.products,
    entries: stats.entries,
  });
};
