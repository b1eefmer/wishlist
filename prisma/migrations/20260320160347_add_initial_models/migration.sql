-- CreateTable
CREATE TABLE "Plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "test" BOOLEAN NOT NULL,
    "trial_days" INTEGER NOT NULL,
    "price_amount" TEXT NOT NULL,
    "price_currency_code" TEXT NOT NULL,
    "price_period" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "plan_id" INTEGER NOT NULL DEFAULT 1,
    "shopify_subscription_id" TEXT,
    "coupon_code" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "iid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shop_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "store_id" INTEGER NOT NULL,
    "customer_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Customermeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "store_id" INTEGER NOT NULL,
    "customer_id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customermeta_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "store_id" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT,
    "handle" TEXT,
    "vendor" TEXT,
    "image_src" TEXT,
    "sku" TEXT,
    "price" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Shop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Shop_shop_idx" ON "Shop"("shop");

-- CreateIndex
CREATE INDEX "Shop_plan_id_idx" ON "Shop"("plan_id");

-- CreateIndex
CREATE INDEX "Customer_store_id_idx" ON "Customer"("store_id");

-- CreateIndex
CREATE INDEX "Customer_customer_id_idx" ON "Customer"("customer_id");

-- CreateIndex
CREATE INDEX "Customermeta_store_id_idx" ON "Customermeta"("store_id");

-- CreateIndex
CREATE INDEX "Customermeta_customer_id_idx" ON "Customermeta"("customer_id");

-- CreateIndex
CREATE INDEX "Customermeta_namespace_key_idx" ON "Customermeta"("namespace", "key");

-- CreateIndex
CREATE INDEX "Product_store_id_idx" ON "Product"("store_id");

-- CreateIndex
CREATE INDEX "Product_product_id_idx" ON "Product"("product_id");

-- CreateIndex
CREATE INDEX "Product_handle_idx" ON "Product"("handle");
