import { LapData } from "@/types";
export interface Lap {
    LaptimeMS: number;
    CarIndex: number;
    DriverIndex: number;
    Splits: any[];
    Type: number;
    isInvalid: boolean;
    isValidForBest: boolean;
}
declare const ReadLap: (reader: any) => LapData;
export default ReadLap;
