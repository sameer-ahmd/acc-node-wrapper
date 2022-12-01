import { platform } from "os";

export function isWindows() {
  return platform() === "win32";
}
