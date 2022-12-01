import { RaceSessionType, SessionPhase } from "@/enums";
import ReadLap from "@/lib/ReadLap";
import ReadString from "@/lib/ReadString";
import { RealtimeUpdate } from "@/types";

export function realtimeUpdateParser(reader) {
  const result: Partial<RealtimeUpdate> = {};

  result.EventIndex = reader.ReadUInt16();
  result.SessionIndex = reader.ReadUInt16();
  result.SessionType = new RaceSessionType()[
    reader.ReadBytes(1).readUInt8(0).toString()
  ];
  result.Phase = new SessionPhase()[
    reader.ReadBytes(1).readUInt8(0).toString()
  ];
  result.SessionTime = reader.ReadFloat();
  result.SessionEndTime = reader.ReadFloat();

  result.FocusedCarIndex = reader.ReadInt32();
  result.ActiveCameraSet = ReadString(reader);
  result.ActiveCamera = ReadString(reader);
  result.CurrentHudPage = ReadString(reader);

  result.IsReplayPlaying = reader.ReadBytes(1).readUInt8(0) > 0;

  if (result.IsReplayPlaying) {
    result.ReplaySessionTime = reader.ReadFloat();
    result.ReplayRemainingTime = reader.ReadFloat();
  }

  result.TimeOfDay = reader.ReadFloat();
  result.AmbientTemp = reader.ReadBytes(1).readUInt8(0);
  result.TrackTemp = reader.ReadBytes(1).readUInt8(0);
  result.Clouds = reader.ReadBytes(1).readUInt8(0) / 10;
  result.RainLevel = reader.ReadBytes(1).readUInt8(0) / 10;
  result.Wetness = reader.ReadBytes(1).readUInt8(0) / 10;

  result.BestSessionLap = ReadLap(reader);

  return result as RealtimeUpdate;
}
