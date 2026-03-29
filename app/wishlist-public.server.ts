import prisma from "./db.server";
import { unauthenticated } from "./shopify.server";

type ProductMap = Record<
  string,
  {
    id: string;
    handle?: string;
    image?: string;
    image2x?: string;
    url?: string;
    title?: string;
    price?: string;
  }
>;

type PublicPayload = {
  iid?: string;
  shop?: string;
  namespace?: string;
  key?: string;
  customerid?: string;
  products?: ProductMap;
};

function getListNamespace(key: string) {
  return key.replace(/^loo-/, "");
}

async function getValidatedShop(iid: string, shopDomain: string) {
  const shop = await prisma.shop.findFirst({
    where: {
      shop: shopDomain,
      iid,
    },
  });

  if (!shop) {
    throw new Response(
      JSON.stringify({
        status: 500,
        message: "Authentication failed.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return shop;
}

function getCustomerGid(customerId: string) {
  return `gid://shopify/Customer/${customerId}`;
}

async function setCustomerListMetafield(
  shopDomain: string,
  customerId: string,
  namespace: string,
  key: string,
  products: ProductMap,
) {
  const { admin } = await unauthenticated.admin(shopDomain);
  const response = await admin.graphql(
    `#graphql
      mutation WishlistSetMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        metafields: [
          {
            ownerId: getCustomerGid(customerId),
            namespace,
            key,
            type: "json",
            value: JSON.stringify(products),
          },
        ],
      },
    },
  );

  const json = await response.json();
  const errors = json.data?.metafieldsSet?.userErrors ?? [];

  if (errors.length) {
    throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
  }
}

async function loadCustomerListMetafield(
  shopDomain: string,
  customerId: string,
  namespace: string,
  key: string,
) {
  const { admin } = await unauthenticated.admin(shopDomain);
  const response = await admin.graphql(
    `#graphql
      query WishlistLoadMetafield($id: ID!, $namespace: String!, $key: String!) {
        customer(id: $id) {
          metafield(namespace: $namespace, key: $key) {
            value
          }
        }
      }`,
    {
      variables: {
        id: getCustomerGid(customerId),
        namespace,
        key,
      },
    },
  );

  const json = await response.json();
  return json.data?.customer?.metafield?.value ?? "{}";
}

export async function savePublicWishlist(payload: PublicPayload) {
  const iid = payload.iid?.trim();
  const shopDomain = payload.shop?.trim();
  const key = payload.key?.trim();
  const customerId = payload.customerid?.trim();
  const products = payload.products ?? {};
  const namespace = payload.namespace?.trim() || "loo-lists";

  if (!iid || !shopDomain || !key || !customerId) {
    return {
      status: 400,
      message: "Missing required fields.",
    };
  }

  const shop = await getValidatedShop(iid, shopDomain);

  if (customerId === "guest") {
    return {
      status: 200,
      message: "Guest list stored locally only.",
    };
  }

  await setCustomerListMetafield(shopDomain, customerId, namespace, key, products);

  await prisma.customermeta.deleteMany({
    where: {
      store_id: shop.id,
      customer_id: customerId,
      namespace: getListNamespace(key),
    },
  });

  const productEntries = Object.values(products).filter(
    (product) => product.id && product.handle,
  );

  if (productEntries.length) {
    await prisma.customermeta.createMany({
      data: productEntries.map((product) => ({
        store_id: shop.id,
        customer_id: customerId,
        namespace: getListNamespace(key),
        key: product.id,
        value: product.handle as string,
      })),
    });
  }

  return {
    status: 200,
    message: "Meta field added successfully",
  };
}

export async function loadPublicWishlist(payload: PublicPayload) {
  const iid = payload.iid?.trim();
  const shopDomain = payload.shop?.trim();
  const key = payload.key?.trim();
  const customerId = payload.customerid?.trim();
  const namespace = payload.namespace?.trim() || "loo-lists";

  if (!iid || !shopDomain || !key || !customerId) {
    return {
      status: 400,
      message: "Missing required fields.",
      products: "{}",
    };
  }

  await getValidatedShop(iid, shopDomain);

  if (customerId === "guest") {
    return {
      status: 200,
      message: "Guest data not stored remotely.",
      products: "{}",
    };
  }

  const products = await loadCustomerListMetafield(
    shopDomain,
    customerId,
    namespace,
    key,
  );

  return {
    status: 200,
    message: products === "{}" ? "data not found" : `found data for ${key}`,
    products: products === "[]" ? "{}" : products,
  };
}
