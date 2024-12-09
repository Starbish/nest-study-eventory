export enum LeaveClubEventAction {
    LeaveAndDisband,
    Leave,
}

export type LeaveClubData = {
    eventId: number;
    action: LeaveClubEventAction;
};