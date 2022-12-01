import { CarLocationEnum } from "./enums";

export interface PhysicsResult {
  packetId: number;
  gas: number;
  brake: number;
  fuel: number;
  gear: number;
  rpms: number;
  steerAngle: number;
  speedKmh: number;
  velocity: number[];
  accG: number[];
  wheelSlip: number[];
  wheelPressure: number[];
  wheelAngularSpeed: number[];
  TyreCoreTemp: number[];
  suspensionTravel: number[];
  tc: number;
  heading: number;
  pitch: number;
  roll: number;
  carDamage: number[];
  pitLimiterOn: boolean;
  abs: number;
  autoshifterOn: boolean;
  tyreWear: number[];
  tyreDirtyLevel: number[];
  turboBoost: number;
  airTemp: number;
  roadTemp: number;
  localAngularVel: number[];
  finalFF: number;
  kersCurrentKJ: number;
  brakeTemp: number[];
  clutch: number;
  isAIControlled: boolean;
  tyreContactPoint: number[][];
  tyreContactNormal: number[][];
  tyreContactHeading: number[][];
  brakeBias: number;
  localVelocity: number[];
  slipRatio: number[];
  slipAngle: number[];
  waterTemp: number;
  brakePressure: number[];
  frontBrakeCompound: number;
  rearBrakeCompound: number;
  padLife: number[];
  discLife: number[];
  ignitionOn: boolean;
  starterEngineOn: boolean;
  isEngineRunning: boolean;
  kerbVibration: number;
  slipVibrations: number;
  gVibrations: number;
  absVibrations: number;
}

export interface GraphicsResult {
  packetId: number;
  status: ACCGameStatus;
  session: SessionType;
  currentTime: string[];
  lastTime: string[];
  bestTime: string[];
  split: string[];
  completedLaps: number;
  position: number;
  iCurrentTime: number;
  iLastTime: number;
  iBestTime: number;
  sessionTimeLeft: number;
  distanceTraveled: number;
  isInPit: boolean;
  currentSectorIndex: number;
  lastSectorTime: number;
  numberOfLaps: number;
  tyreCompound: string[];
  normalizedCarPosition: number;
  activeCars: number;
  carCoordinates: number[][];
  carID: number[];
  playerCarID: number;
  penaltyTime: number;
  flag: FlagType;
  penalty: PenaltyType;
  idealLineOn: boolean;
  isInPitLane: boolean;
  surfaceGrip: number;
  mandatoryPitDone: boolean;
  windSpeed: number;
  windDirection: number;
  isSetupMenuVisible: boolean;
  mainDisplayIndex: number;
  secondaryDisplyIndex: number;
  TC: number;
  TCCUT: number;
  EngineMap: number;
  ABS: number;
  fuelXLap: number;
  rainLights: boolean;
  flashingLights: boolean;
  lightsStage: number;
  exhaustTemperature: number;
  wiperLV: number;
  driverStintTotalTimeLeft: number;
  driverStintTimeLeft: number;
  rainTyres: boolean;
  sessionIndex: number;
  usedFuel: number;
  deltaLapTime: string[];
  iDeltaLapTime: number;
  estimatedLapTime: string[];
  iEstimatedLapTime: number;
  isDeltaPositive: boolean;
  iSplit: number;
  isValidLap: boolean;
  fuelEstimatedLaps: number;
  trackStatus: string[];
  missingMandatoryPits: number;
  Clock: number;
  directionLightsLeft: boolean;
  directionLightsRight: boolean;
  GlobalYellow: boolean;
  GlobalYellow1: boolean;
  GlobalYellow2: boolean;
  GlobalYellow3: boolean;
  GlobalWhite: boolean;
  GlobalGreen: boolean;
  GlobalChequered: boolean;
  GlobalRed: boolean;
  mfdTyreSet: number;
  mfdFuelToAdd: number;
  mfdTyrePressureLF: number;
  mfdTyrePressureRF: number;
  mfdTyrePressureLR: number;
  mfdTyrePressureRR: number;
  trackGripStatus: TrackGrip;
  rainIntensity: RainIntensity;
  rainIntensityIn1numbermin: RainIntensity;
  rainIntensityIn3numbermin: RainIntensity;
  currentTyreSet: number;
  strategyTyreSet: number;
}

export interface BroadcastEvent {
  Type: BroadcastEventType;
  Msg: string;
  TimeMs: number;
  CarId: number;
  CarData: CarInformation;
}

export interface StaticResult {
  smVersion: string[];
  acVersion: string[];
  numberOfSessions: number;
  numCars: number;
  carModel: string[];
  track: string[];
  playerName: string[];
  playerSurname: string[];
  playerNick: string[];
  sectorCount: number;
  maxRpm: number;
  maxFuel: number;
  penaltiesEnabled: boolean;
  aidFuelRate: number;
  aidTireRate: number;
  aidMechanicalDamage: number;
  AllowTyreBlankets: boolean;
  aidStability: boolean;
  aidAutoclutch: boolean;
  aidAutoBlip: boolean;
  PitWindowStart: number;
  PitWindowEnd: number;
  isOnline: boolean;
  dryTyresName: string[];
  wetTyresName: string[];
}

export interface RegistrationResult {
  ConnectionId: number;
  ConnectionSuccess: boolean;
  isReadonly: boolean;
  err: string;
}

export interface RealtimeUpdate {
  EventIndex: number;
  SessionIndex: number;
  SessionType: SessionType;
  Phase: SessionPhase;
  SessionTime: number;
  SessionEndTime: number;
  FocusedCarIndex: number;
  ActiveCameraSet: string;
  ActiveCamera: string;
  CurrentHudPage: string;
  IsReplayPlaying: boolean;
  ReplaySessionTime?: number;
  ReplayRemainingTime?: number;
  TimeOfDay: number;
  AmbientTemp: number;
  TrackTemp: number;
  Clouds: number;
  RainLevel: number;
  Wetness: number;
  BestSessionLap: Partial<LapData>;
}

export interface LapData {
  Splits: number[];
  LaptimeMS: number;
  CarIndex: number;
  DriverIndex: number;
  IsInvalid: boolean;
  IsValidForBest: boolean;
  isOutlap: boolean;
  isInlap: boolean;
  Type: number;
}

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

export interface BroadcastOptions {
  /** The name to use when connecting to ACC. `required`*/
  name: string;
  /** The password to use when connecting to ACC.  `required`*/
  password: string;
  /** The command Password to use when connecting to ACC.  `default ""` */
  cmdPassword?: string;
  /** The command Password to use when connecting to ACC.  `default 9numbernumbernumber` */
  port?: number;
  /** The local network IP if you are running the game on a different PC to this program.  `default localhost` */
  address?: string;
  /** How often to request an update from ACC.  `default 25numberms` */
  updateMS?: number;
  /** Log response to console `default boolean`*/
  logging?: boolean;
}

export interface SharedMemoryOptions {
  physicsUpdateInt?: number;
  graphicsUpdateInt?: number;
  staticUpdateInt?: number;
  logging?: boolean;
}

export interface AsServerOptions extends BroadcastOptions {
  /** Forward the UDP binaries to another address on your network */
  forwardAddresses: NetworkAddress[];
  /** Skip parsing of packets on this computer */
  forwardOnly?: boolean;
  physicsUpdate?: number;
  graphicsUpdate?: number;
  staticUpdate?: number;
}

export interface NetworkAddress {
  address: string;
  port: number;
}

export type ACCGameStatus = "AC_OFF" | "AC_REPLAY" | "AC_LIVE" | "AC_PAUSE";

export type EntryListCars = CarInformation[];

export interface RealtimeCarUpdate {
  CarIndex: number;
  DriverIndex: number;
  DriverCount: number;
  Gear: number;
  WorldPosX: number;
  WorldPosY: number;
  Yaw: number;
  CarLocation: CarLocation;
  Kmh: number;
  Position: number;
  CupPosition: number;
  TrackPosition: number;
  SplinePosition: number;
  Laps: number;
  Delta: number;
  BestSessionLap: LapData;
  LastLap: LapData;
  CurrentLap: LapData;
}

export type CarLocation =
  | "None"
  | "Track"
  | "Pitlane"
  | "Pit Entry"
  | "Pit Exit";

export type SessionType =
  | "AC_UNKNOWN"
  | "AC_PRACTICE"
  | "AC_QUALIFY"
  | "AC_RACE"
  | "AC_HOTLAP"
  | "AC_TIME_ATTACK"
  | "AC_DRIFT"
  | "AC_DRAG"
  | "AC_HOTSTINT"
  | "AC_HOTLAPSUPERPOLE";

export type FlagType =
  | "AC_NO_FLAG"
  | "AC_BLUE_FLAG"
  | "AC_YELLOW_FLAG"
  | "AC_BLACK_FLAG"
  | "AC_WHITE_FLAG"
  | "AC_CHECKERED_FLAG"
  | "AC_PENALTY_FLAG"
  | "ACC_GREEN_FLAG"
  | "ACC_ORANGE_FLAG";

export type DriverCategory =
  | "Platinum"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "Error";

export type CupCategory =
  | "Overall/Pro"
  | "ProAm"
  | "Am"
  | "Silver"
  | "National";

export type LapType = "Error" | "Outlap" | "Regular" | "Inlap";

export type SessionPhase =
  | "None"
  | "Starting"
  | "PreFormation"
  | "FormationLap"
  | "PreSession"
  | "Session"
  | "SessionOver"
  | "PostSession"
  | "ResultUI";

export type BroadcastEventType =
  | "None"
  | "GreenFlag"
  | "SessionOver"
  | "PenaltyCommMsg"
  | "Accident"
  | "LapCompleted"
  | "BestSessionLap"
  | "BestPersonalLap";

export type Nationality =
  | "Any"
  | "Italy"
  | "Germany"
  | "France"
  | "Spain"
  | "GreatBritain"
  | "Hungary"
  | "Belgium"
  | "Switzerland"
  | "Austria"
  | "Russia"
  | "Thailand"
  | "Netherlands"
  | "Poland"
  | "Argentina"
  | "Monaco"
  | "Ireland"
  | "Brazil"
  | "SouthAfrica"
  | "PuertoRico"
  | "Slovakia"
  | "Oman"
  | "Greece"
  | "Saudi Arabia"
  | "Norway"
  | "Turkey"
  | "South Korea"
  | "Lebanon"
  | "Armenia"
  | "Mexico"
  | "Sweden"
  | "Finland"
  | "Denmark"
  | "Croatia"
  | "Canada"
  | "China"
  | "Portugal"
  | "Singapore"
  | "Indonesia"
  | "USA"
  | "New Zealand"
  | "Australia"
  | "San Marino"
  | "UAE"
  | "Luxembourg"
  | "Kuwait"
  | "Hong Kong"
  | "Colombia"
  | "Japan"
  | "Andorra"
  | "Azerbaijan"
  | "Bulgaria"
  | "Cuba"
  | "Czech Republic"
  | "Estonia"
  | "Georgia"
  | "India"
  | "Israel"
  | "Jamaica"
  | "Latvia"
  | "Lithuania"
  | "Macau"
  | "Malaysia"
  | "Nepal"
  | "New Caledonia"
  | "Nigeria"
  | "Northern Ireland"
  | "Papua New Guinea"
  | "Philippines"
  | "Qatar"
  | "Romania"
  | "Scotland"
  | "Serbia"
  | "Slovenia"
  | "Taiwan"
  | "Ukraine"
  | "Venezuela"
  | "Wales"
  | "Iran"
  | "Bahrain"
  | "Zimbabwe"
  | "Chinese Taipei"
  | "Chile"
  | "Uruguay"
  | "Madagascar";

export type PenaltyType =
  | "None"
  | "DriveThrough_Cutting"
  | "StopAndGo_10_Cutting"
  | "StopAndGo_20_Cutting"
  | "StopAndGo_30_Cutting"
  | "Disqualified_Cutting"
  | "RemoveBestLaptime_Cutting"
  | "DriveThrough_PitSpeeding"
  | "StopAndGo_10_PitSpeeding"
  | "StopAndGo_20_PitSpeeding"
  | "StopAndGo_30_PitSpeeding"
  | "Disqualified_PitSpeeding"
  | "RemoveBestLaptime_PitSpeeding"
  | "Disqualified_IgnoredMandatoryPit"
  | "PostRaceTime"
  | "Disqualified_Trolling"
  | "Disqualified_PitEntry"
  | "Disqualified_PitExit"
  | "Disqualified_WrongWay"
  | "DriveThrough_IgnoredDriverStint"
  | "Disqualified_IgnoredDriverStint"
  | "Disqualified_ExceededDriverStintLimit";

export type TrackGrip =
  | "ACC_GREEN"
  | "ACC_FAST"
  | "ACC_OPTIMUM"
  | "ACC_GREASY"
  | "ACC_DAMP"
  | "ACC_WET"
  | "ACC_FLOODED";

export type RainIntensity =
  | "ACC_NO_RAIN"
  | "ACC_DRIZZLE"
  | "ACC_LIGHT_RAIN"
  | "ACC_MEDIUM_RAIN"
  | "ACC_HEAVY_RAIN"
  | "ACC_THUNDERSTORM";

export type WheelType =
  | "ACC_FrontLeft"
  | "ACC_FrontRight"
  | "ACC_RearLeft"
  | "ACC_RearRight";
