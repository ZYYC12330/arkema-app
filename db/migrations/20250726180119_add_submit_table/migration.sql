-- CreateTable
CREATE TABLE "Submit" (
    "id" SERIAL NOT NULL,
    "fileUrl" VARCHAR(255) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "soldToName" VARCHAR(255),
    "soldToAddress" TEXT,
    "arkemaSoldToCode" VARCHAR(50),
    "shipToName" VARCHAR(255) NOT NULL,
    "shipToAddress" TEXT,
    "arkemaShipToCode" VARCHAR(50),
    "vendorName" VARCHAR(255) NOT NULL,
    "vendorAddress" TEXT,
    "vendorSalesArea" VARCHAR(100),
    "poNumber" VARCHAR(50),
    "poDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "deliveryByDate" TIMESTAMP(3),
    "lineNumber" VARCHAR(20),
    "arkemaProductCode" VARCHAR(50),
    "itemQuantity" DECIMAL(15,3),
    "unitOfMeasure" VARCHAR(20),
    "unitPrice" DECIMAL(15,2),

    CONSTRAINT "Submit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submit_poNumber_key" ON "Submit"("poNumber");
