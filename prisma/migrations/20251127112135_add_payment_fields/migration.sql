-- CreateTable
CREATE TABLE "Puppy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "color" TEXT NOT NULL,
    "generation" TEXT NOT NULL,
    "vaccinations" TEXT[],
    "notes" TEXT,
    "images" TEXT[],
    "sireId" TEXT,
    "damId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Puppy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "characteristics" TEXT,
    "averageSize" TEXT,
    "temperament" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "outsideUS" BOOLEAN NOT NULL DEFAULT false,
    "textAlerts" BOOLEAN NOT NULL DEFAULT false,
    "referralSource" TEXT,
    "breedChoices" JSONB NOT NULL,
    "preferredSizes" TEXT[],
    "preferredGender" TEXT NOT NULL,
    "preferredColors" TEXT[],
    "preferredCoatTypes" TEXT[],
    "activityLevel" TEXT NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "secondPickupLocation" TEXT,
    "deliveryMethod" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "depositAmount" INTEGER,
    "otherPets" BOOLEAN NOT NULL,
    "petTypes" TEXT,
    "allergies" TEXT,
    "hasChildren" BOOLEAN NOT NULL,
    "childrenAges" TEXT,
    "hasFence" BOOLEAN NOT NULL,
    "alternativeExercise" TEXT,
    "lifestyle" TEXT NOT NULL,
    "typicalDay" TEXT NOT NULL,
    "whyGoodFit" TEXT NOT NULL,
    "firstDog" BOOLEAN NOT NULL,
    "previousPuppies" INTEGER NOT NULL DEFAULT 0,
    "interestedInTraining" BOOLEAN NOT NULL,
    "spayNeuterAgreement" BOOLEAN NOT NULL,
    "optInCommunications" BOOLEAN NOT NULL DEFAULT false,
    "welcomeCall" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "rejectionReason" TEXT,
    "puppyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "puppyId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Puppy_breed_idx" ON "Puppy"("breed");

-- CreateIndex
CREATE INDEX "Puppy_status_idx" ON "Puppy"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Breed_name_key" ON "Breed"("name");

-- CreateIndex
CREATE INDEX "Application_email_idx" ON "Application"("email");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Reservation_puppyId_idx" ON "Reservation"("puppyId");

-- CreateIndex
CREATE INDEX "Reservation_customerEmail_idx" ON "Reservation"("customerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_puppyId_fkey" FOREIGN KEY ("puppyId") REFERENCES "Puppy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_puppyId_fkey" FOREIGN KEY ("puppyId") REFERENCES "Puppy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 1) Add the column as nullable
ALTER TABLE "Application" ADD COLUMN "displayId" TEXT;

-- 2) Backfill existing rows with a 4‑digit value
UPDATE "Application"
SET "displayId" = LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0')
WHERE "displayId" IS NULL;

-- 3) Make it required and unique
ALTER TABLE "Application"
ALTER COLUMN "displayId" SET NOT NULL;

CREATE UNIQUE INDEX "Application_displayId_key" ON "Application"("displayId");