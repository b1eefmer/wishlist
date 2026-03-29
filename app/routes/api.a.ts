import type { ActionFunctionArgs } from "react-router";
import { savePublicWishlist } from "../wishlist-public.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const payload = await request.json();
  const result = await savePublicWishlist(payload);

  return Response.json(result);
};
