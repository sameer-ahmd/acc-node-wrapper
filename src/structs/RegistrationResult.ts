import ReadString from "@/lib/ReadString";
import { RegistrationResult } from "@/types";

export function registrationResultParser(reader, ConnectionId: number) {
  const result: Partial<RegistrationResult> = {};

  result.ConnectionId = ConnectionId;
  result.ConnectionSuccess = reader.ReadBytes(1).readUInt8(0) > 0;
  result.isReadonly = reader.ReadBytes(1).readUInt8(0) === 0;
  result.err = ReadString(reader);

  return result as RegistrationResult;
}
