import { createHash } from "node:crypto";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "./db.server";

const DEFAULT_PLANS = [
  {
    id: 1,
    name: "Free",
    test: false,
    trial_days: 7,
    price_amount: "0.00",
    price_currency_code: "USD",
    price_period: "EVERY_30_DAYS",
  },
  {
    id: 2,
    name: "Basic",
    test: false,
    trial_days: 7,
    price_amount: "0.99",
    price_currency_code: "USD",
    price_period: "EVERY_30_DAYS",
  },
  {
    id: 3,
    name: "Exim",
    test: false,
    trial_days: 7,
    price_amount: "4.99",
    price_currency_code: "USD",
    price_period: "EVERY_30_DAYS",
  },
  {
    id: 4,
    name: "Basic Free",
    test: false,
    trial_days: 7,
    price_amount: "0.00",
    price_currency_code: "USD",
    price_period: "EVERY_30_DAYS",
  },
] as const;

function createLegacyIid(shop: string) {
  return (
    createHash("md5").update(`wishlist3_idd${shop}`).digest("hex") +
    createHash("md5").update(`wishlist3oldevnet${shop}`).digest("hex")
  );
}

export async function ensureDefaultPlans() {
  await Promise.all(
    DEFAULT_PLANS.map((plan) =>
      prisma.plan.upsert({
        where: { id: plan.id },
        update: plan,
        create: plan,
      }),
    ),
  );
}

export async function ensureShopRecord(shopDomain: string) {
  await ensureDefaultPlans();

  const iid = createLegacyIid(shopDomain);
  const existingShop = await prisma.shop.findFirst({
    where: { shop: shopDomain },
  });

  if (existingShop) {
    return prisma.shop.update({
      where: { id: existingShop.id },
      data: { iid },
    });
  }

  return prisma.shop.create({
    data: {
      shop: shopDomain,
      plan_id: 1,
      iid,
    },
  });
}

function getAppHost() {
  const appUrl = process.env.SHOPIFY_APP_URL || "";

  try {
    return new URL(appUrl).host;
  } catch {
    return appUrl.replace(/^https?:\/\//, "");
  }
}

export async function syncLegacyShopMetafields(
  admin: AdminApiContext,
  shopDomain: string,
) {
  const shop = await ensureShopRecord(shopDomain);
  const appHost = getAppHost();

  const shopResponse = await admin.graphql(`#graphql
    query WishlistShopId {
      shop {
        id
      }
    }`);
  const shopJson = await shopResponse.json();
  const shopId = shopJson.data?.shop?.id;

  if (!shopId) {
    throw new Error("Failed to load Shopify shop id.");
  }

  const response = await admin.graphql(
    `#graphql
      mutation WishlistSetShopMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
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
            ownerId: shopId,
            namespace: "loolistsapp",
            key: "iid",
            type: "single_line_text_field",
            value: shop.iid ?? "",
          },
          {
            ownerId: shopId,
            namespace: "loolistsapp",
            key: "appurl",
            type: "single_line_text_field",
            value: appHost,
          },
          {
            ownerId: shopId,
            namespace: "ollistsapp",
            key: "iid",
            type: "single_line_text_field",
            value: shop.iid ?? "",
          },
          {
            ownerId: shopId,
            namespace: "ollistsapp",
            key: "appurl",
            type: "single_line_text_field",
            value: appHost,
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

export async function getWishlistStats(shopDomain: string, namespace = "wishlist") {
  const shop = await ensureShopRecord(shopDomain);

  const [customers, products, entries] = await Promise.all([
    prisma.customermeta.findMany({
      where: {
        store_id: shop.id,
        namespace,
      },
      select: {
        customer_id: true,
      },
      distinct: ["customer_id"],
    }),
    prisma.customermeta.findMany({
      where: {
        store_id: shop.id,
        namespace,
      },
      select: {
        value: true,
      },
      distinct: ["value"],
    }),
    prisma.customermeta.count({
      where: {
        store_id: shop.id,
        namespace,
      },
    }),
  ]);

  return {
    shop,
    namespace,
    customers: customers.length,
    products: products.length,
    entries,
  };
}

export async function getWishlistTopProducts(
  shopDomain: string,
  namespace = "wishlist",
) {
  const shop = await ensureShopRecord(shopDomain);
  const topMeta = await prisma.customermeta.groupBy({
    by: ["value"],
    where: {
      store_id: shop.id,
      namespace,
    },
    _count: {
      value: true,
    },
    orderBy: {
      _count: {
        value: "desc",
      },
    },
    take: 10,
  });

  const productsByHandle = await prisma.product.findMany({
    where: {
      store_id: shop.id,
      handle: {
        in: topMeta.map((item) => item.value),
      },
    },
    select: {
      handle: true,
      title: true,
      image_src: true,
      vendor: true,
      price: true,
    },
  });

  const cachedProducts = new Map(
    productsByHandle
      .filter((product) => product.handle)
      .map((product) => [product.handle as string, product]),
  );

  return topMeta.map((item) => ({
    shop: shop.shop,
    handle: item.value,
    count: item._count.value,
    product: cachedProducts.get(item.value) ?? {
      handle: item.value,
      title: item.value,
      vendor: "",
      type: "",
      price: "",
      image_src: "",
    },
  }));
}

export async function getWishlistDashboard(shopDomain: string, namespace = "wishlist") {
  const [stats, topProducts] = await Promise.all([
    getWishlistStats(shopDomain, namespace),
    getWishlistTopProducts(shopDomain, namespace),
  ]);

  return {
    shop: stats.shop,
    namespace,
    stats: {
      customers: stats.customers,
      products: stats.products,
      entries: stats.entries,
    },
    topProducts,
  };
}
