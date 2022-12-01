import { CarLocationEnum } from "@/enums";
import ReadLap from "@/lib/ReadLap";
import { RealtimeCarUpdate } from "@/types";

export function realtimeCarUpdateParser(reader) {
  const result: Partial<RealtimeCarUpdate> = {};

  result.CarIndex = reader.ReadUInt16();
  result.DriverIndex = reader.ReadUInt16();
  result.DriverCount = reader.ReadBytes(1).readUInt8(0);
  result.Gear = reader.ReadBytes(1).readUInt8(0) - 1;
  result.WorldPosX = reader.ReadFloat();
  result.WorldPosY = reader.ReadFloat();
  result.Yaw = reader.ReadFloat();
  result.CarLocation = new CarLocationEnum()[
    reader.ReadBytes(1).readUInt8(0).toString()
  ];
  result.Kmh = reader.ReadUInt16();
  result.Position = reader.ReadUInt16();
  result.CupPosition = reader.ReadUInt16();
  result.TrackPosition = reader.ReadUInt16();
  result.SplinePosition = reader.ReadFloat();
  result.Laps = reader.ReadUInt16();

  result.Delta = reader.ReadUInt32();
  result.BestSessionLap = ReadLap(reader);
  result.LastLap = ReadLap(reader);
  result.CurrentLap = ReadLap(reader);

  return result;
}
