export type CreateEventData = {
  hostId: number;
  title: string;
  description: string;
  categoryId: number;
  cityId: number;
  startTime: Date;
  endTime: Date;
  maxPeople: number;
};
