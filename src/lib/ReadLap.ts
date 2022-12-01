import { LapData } from "@/types";
import { LapType } from "../enums";

export interface Lap {
  LaptimeMS: number;
  CarIndex: number;
  DriverIndex: number;
  Splits: any[];
  Type: number;
  isInvalid: boolean;
  isValidForBest: boolean;
}

const ReadLap = (reader) => {
  const lap: Partial<LapData> = {
    LaptimeMS: reader.ReadInt32(),
    CarIndex: reader.ReadUInt16(),
    DriverIndex: reader.ReadUInt16(),
    Splits: [],
    Type: 0,
    IsInvalid: false,
    IsValidForBest: false,
  };

  const splitCount = reader.ReadBytes(1).readUInt8(0);
  for (let i = 0; i < splitCount; i++) lap.Splits.push(reader.ReadInt32());

  lap.IsInvalid = reader.ReadBytes(1).readUInt8(0) > 0;
  lap.IsValidForBest = reader.ReadBytes(1).readUInt8(0) > 0;

  const isOutlap = reader.ReadBytes(1).readUInt8(0) > 0;
  const isInlap = reader.ReadBytes(1).readUInt8(0) > 0;

  if (isOutlap) lap.Type = 1;
  else if (isInlap) lap.Type = 3;
  else lap.Type = 2;

  lap.Type = new LapType()[lap.Type.toString()];

  while (lap.Splits.length < 3) lap.Splits.push(null);

  return lap as LapData;
};

export default ReadLap;
