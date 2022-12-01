import ReadChar from "@/lib/ReadChar";
import { StaticResult } from "..";

export function staticParser(reader) {
  const result: Partial<StaticResult> = {};

  result.smVersion = [];
  for (let i = 0; i < 15; i++) result.smVersion.push(ReadChar(reader));

  result.acVersion = [];
  for (let i = 0; i < 15; i++) result.acVersion.push(ReadChar(reader));

  result.numberOfSessions = reader.ReadUInt32();

  result.numCars = reader.ReadUInt32();

  result.carModel = [];
  for (let i = 0; i < 33; i++) result.carModel.push(ReadChar(reader));

  result.track = [];
  for (let i = 0; i < 33; i++) result.track.push(ReadChar(reader));

  result.playerName = [];
  for (let i = 0; i < 33; i++) result.playerName.push(ReadChar(reader));

  result.playerSurname = [];
  for (let i = 0; i < 33; i++) result.playerSurname.push(ReadChar(reader));

  result.playerNick = [];
  for (let i = 0; i < 34; i++) result.playerNick.push(ReadChar(reader));

  result.sectorCount = reader.ReadUInt32();
  const maxTorque = reader.ReadFloat();
  const maxPower = reader.ReadFloat();
  result.maxRpm = reader.ReadUInt32();
  result.maxFuel = reader.ReadFloat();

  const suspensionMaxTravel: number[] = [];
  for (let i = 0; i < 4; i++) suspensionMaxTravel.push(reader.ReadFloat());

  const tyreRadius: number[] = [];
  for (let i = 0; i < 4; i++) tyreRadius.push(reader.ReadFloat());

  const maxTurboBoost = reader.ReadFloat();
  const deprecated_1 = reader.ReadFloat();
  const deprecated_2 = reader.ReadFloat();

  result.penaltiesEnabled = reader.ReadUInt32() > 0;
  result.aidFuelRate = reader.ReadFloat();
  result.aidTireRate = reader.ReadFloat();
  result.aidMechanicalDamage = reader.ReadFloat();
  result.AllowTyreBlankets = reader.ReadFloat() > 0;
  result.aidStability = reader.ReadFloat() > 0;
  result.aidAutoclutch = reader.ReadUInt32() > 0;
  result.aidAutoBlip = reader.ReadUInt32() > 0;

  const hasDRS = reader.ReadUInt32() > 0;
  const hasERS = reader.ReadUInt32() > 0;
  const hasKERS = reader.ReadUInt32() > 0;
  const kersMaxJ = reader.ReadFloat();
  const engineBrakeSettingsCount = reader.ReadUInt32();
  const ersPowerControllerCount = reader.ReadUInt32();
  const trackSplineLength = reader.ReadFloat();

  const trackConfiguration: number[] = [];
  for (let i = 0; i < 34; i++) trackConfiguration.push(ReadChar(reader));

  const ersMaxJ = reader.ReadFloat();
  const isTimedRace = reader.ReadUInt32() > 0;
  const hasExtraLap = reader.ReadUInt32() > 0;

  const carSkin: number[] = [];
  for (let i = 0; i < 34; i++) carSkin.push(ReadChar(reader));

  const reversedGridPositions = reader.ReadUInt32();
  result.PitWindowStart = reader.ReadUInt32();
  result.PitWindowEnd = reader.ReadInt32();
  result.isOnline = reader.ReadUInt32() > 0;

  result.dryTyresName = [];
  for (let i = 0; i < 33; i++) result.dryTyresName.push(ReadChar(reader));

  result.wetTyresName = [];
  for (let i = 0; i < 33; i++) result.wetTyresName.push(ReadChar(reader));

  return result;
}
