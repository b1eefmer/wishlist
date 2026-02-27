import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="Basic Wishlist">
      <s-box padding="base">
        <s-paragraph>
          <h1>Dashboard</h1>
          {/* <s-text type="strong" fontVariantNumeric="tabular-nums" tone="info">Dashboard </s-text> */}
        </s-paragraph>
      </s-box>
      <s-section heading="Wishlist Stats">
        <s-grid
          gridTemplateColumns="repeat(2, 1fr)"
          gap="small"
          justifyContent="center"
        >
          <s-grid-item gridColumn="span 1" padding="large">
            <s-paragraph>
              <s-text>0 </s-text>
              <s-text>products</s-text>
            </s-paragraph>
          </s-grid-item>
          <s-grid-item gridColumn="auto" padding="large">
            <s-text>0 </s-text>
            <s-text>customers</s-text>
          </s-grid-item>
        </s-grid>
        <s-link
          href="#"
          target="_blank"
        >
          More info
        </s-link>
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
          <s-link
            href="mailto:codefan18@gmail.com"
            target="_blank"
          >
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
