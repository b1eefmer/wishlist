import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getWishlistDashboard } from "../wishlist.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return getWishlistDashboard(session.shop);
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <s-page heading="Basic Wishlist">
      <s-box padding="base">
        <s-paragraph>
          <h1>Dashboard</h1>
        </s-paragraph>
        <s-text tone="neutral">
          Shop: {data.shop.shop}
        </s-text>
      </s-box>
      <s-section heading="Wishlist Stats">
        <s-grid
          gridTemplateColumns="repeat(3, 1fr)"
          gap="small"
          justifyContent="center"
        >
          <s-grid-item gridColumn="span 1" padding="large">
            <s-paragraph>
              <s-text>{data.stats.products} </s-text>
              <s-text>products</s-text>
            </s-paragraph>
          </s-grid-item>
          <s-grid-item gridColumn="span 1" padding="large">
            <s-text>{data.stats.customers} </s-text>
            <s-text>customers</s-text>
          </s-grid-item>
          <s-grid-item gridColumn="span 1" padding="large">
            <s-text>{data.stats.entries} </s-text>
            <s-text>saved items</s-text>
          </s-grid-item>
        </s-grid>
      </s-section>
      <s-section heading="Top Products">
        {data.topProducts.length ? (
          <s-stack direction="block" gap="small">
            {data.topProducts.map((item: (typeof data.topProducts)[number]) => (
              <s-box key={item.handle} padding="small" border="base">
                <s-text type="strong">
                  {item.product?.title || item.handle}
                </s-text>
                <s-paragraph>
                  <s-text>{item.count} saves</s-text>
                  {item.product?.vendor ? <s-text> - {item.product.vendor}</s-text> : null}
                  {item.product?.price ? <s-text> - {item.product.price}</s-text> : null}
                </s-paragraph>
              </s-box>
            ))}
          </s-stack>
        ) : (
          <s-paragraph>
            No wishlist activity yet. The next migration slice will wire the storefront
            endpoints and theme extension so these stats start filling in.
          </s-paragraph>
        )}
      </s-section>
      <s-section heading="Install">
        <s-paragraph>
          Finish the app installation at the Theme editor.
        </s-paragraph>
        <s-ordered-list>
          <s-list-item>
            Enable app embeds
            <s-unordered-list>
              <s-list-item>Open the Theme editor</s-list-item>
              <s-list-item>Open the App embeds tab</s-list-item>
              <s-list-item>Find and enable the "Popup & Sidebar" block provided by "Wishlist" app</s-list-item>
            </s-unordered-list>
          </s-list-item>
          <s-list-item>
            Add button on product page
            <s-unordered-list>
              <s-list-item>Open the Theme editor</s-list-item>
              <s-list-item>Navigate to product page</s-list-item>
              <s-list-item>Add wishlist button block to the product information section</s-list-item>
            </s-unordered-list>
          </s-list-item>
        </s-ordered-list>
      </s-section>
      <s-section heading="Support">
        <s-paragraph>
          If you have any questions drop me a message to{" "}
          <s-link href="mailto:codefan18@gmail.com" target="_blank">
            codefan18@gmail.com
          </s-link>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
