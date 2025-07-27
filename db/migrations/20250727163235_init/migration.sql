-- CreateTable
CREATE TABLE "Show_Order" (
    "id" SERIAL NOT NULL,
    "fileUrl" VARCHAR(255) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "soldToName" VARCHAR(255),
    "soldToAddress" TEXT,
    "arkemaSoldToCode" VARCHAR(255),
    "shipToName" VARCHAR(255) NOT NULL,
    "shipToAddress" TEXT,
    "arkemaShipToCode" VARCHAR(255),
    "vendorName" VARCHAR(255) NOT NULL,
    "vendorAddress" TEXT,
    "vendorSalesArea" VARCHAR(255),
    "poNumber" VARCHAR(255),
    "poDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "deliveryByDate" TIMESTAMP(3),
    "lineNumber" VARCHAR(255),
    "arkemaProductCode" VARCHAR(255),
    "itemQuantity" DECIMAL(15,3),
    "unitOfMeasure" VARCHAR(255),
    "unitPrice" DECIMAL(15,2),

    CONSTRAINT "Show_Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Show_Order_poNumber_key" ON "Show_Order"("poNumber");
