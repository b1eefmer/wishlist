import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getWishlistTopProducts } from "../wishlist.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const items = await getWishlistTopProducts(session.shop, "wishlist");

  return {
    items,
  };
};

export default function AdditionalPage() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Basic Wishlist">
      <s-section heading="Top products">
        {items.length ? (
          <s-table>
            <s-table-header-row>
              <s-table-header>Product</s-table-header>
              <s-table-header>Vendor</s-table-header>
              <s-table-header>Price</s-table-header>
              <s-table-header format="numeric">Count</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {items.map((item) => (
                <s-table-row key={item.handle}>
                  <s-table-cell>{item.product.title || item.handle}</s-table-cell>
                  <s-table-cell>{item.product.vendor || "-"}</s-table-cell>
                  <s-table-cell>{item.product.price || "-"}</s-table-cell>
                  <s-table-cell>{item.count}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        ) : (
          <s-paragraph>No product data yet.</s-paragraph>
        )}
      </s-section>
    </s-page>
  );
}
