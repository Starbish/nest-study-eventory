/*
    model Event {
        id          Int      @id @default(autoincrement())
        hostId      Int      @map("host_id")
        categoryId  Int      @map("category_id")
        cityId      Int      @map("city_id")
        title       String
        description String
        maxPeople   Int      @map("max_people")
        startTime   DateTime @map("start_time")
        endTime     DateTime @map("end_time")
        createdAt   DateTime @default(now()) @map("created_at")
        updatedAt   DateTime @updatedAt @map("updated_at")

        host     User     @relation(fields: [hostId], references: [id])
        category Category @relation(fields: [categoryId], references: [id])
        city     City     @relation(fields: [cityId], references: [id])

        eventJoin EventJoin[]
        review    Review[]

        @@map("event")
    }
*/

export type EventData = {
    id: number;
    hostId: number;
    title: string;
    description: string;
    categoryId: number;
    cityId: number;
    startTime: Date;
    endTime: Date;
    maxPeople: number;
};