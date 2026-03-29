import type { ActionFunctionArgs } from "react-router";
import { loadPublicWishlist } from "../wishlist-public.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const payload = await request.json();
  const result = await loadPublicWishlist(payload);

  return Response.json(result);
};
