-- CreateTable
CREATE TABLE "PreRegisteredAttendee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phoneNumber" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "sourceRow" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phoneNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isHackathonParticipant" BOOLEAN NOT NULL,
    "attendeeMode" TEXT NOT NULL,
    "attendeeType" TEXT,
    "titleRole" TEXT,
    "companyUniversity" TEXT,
    "placeOfResidence" TEXT,
    "interestedInSessions" TEXT,
    "projectTitle" TEXT,
    "howDidYouHear" TEXT,
    "qrCodeValue" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredAttendee_phoneNumber_key" ON "PreRegisteredAttendee"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_qrCodeValue_key" ON "Registration"("qrCodeValue");
