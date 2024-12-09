export interface CarInformation {
    CarIndex: number;
    CarModelType: number;
    TeamName: string;
    RaceNumber: number;
    CupCategory: number;
    CurrentDriverIndex: number;
    Drivers: string[];
    Nationality: string;
}
declare class CarInfo {
    CarIndex: number;
    CarModelType: number | null;
    TeamName: string;
    RaceNumber: number;
    CupCategory: number | null;
    CurrentDriverIndex: number;
    Drivers: any[];
    Nationality: number;
    constructor(CarIndex: any);
    getCurrentDriver(): any;
}
export default CarInfo;
