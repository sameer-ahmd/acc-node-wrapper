/*==== Import Section ==== */
import dgram from "node:dgram";
import EventEmitter from "events";
import constants from "./constants";
import binutils from "binutils";
import utf8 from "utf8-bytes";
import moment, { Moment } from "moment";
import { isWindows } from "./lib/isWindows";
import FirstOrDefault from "./lib/FirstOrDefault";
import SingleOrDefault from "./lib/SingleOrDefault";
import ReadString from "./lib/ReadString";
import ReadLap from "./lib/ReadLap";
import ReadChar from "./lib/ReadChar";
import CarInfo from "./structs/CarInfo";
import {
  DriverCategory,
  CupCategory,
  BroadcastingCarEventType,
  NationalityEnum,
  ACC_STATUS,
  ACC_SESSION_TYPE,
  ACC_FLAG_TYPE,
  ACC_PENALTY_TYPE,
  ACC_TRACK_GRIP_STATUS,
  ACC_RAIN_INTENSITY,
} from "./enums";

import {
  RealtimeCarUpdate,
  RealtimeUpdate,
  RegistrationResult,
  CarInformation,
  EntryListCars,
  BroadcastOptions,
  AsServerOptions,
  SharedMemoryOptions,
  NetworkAddress,
  PhysicsResult,
  StaticResult,
  GraphicsResult,
  BroadcastEvent,
} from "./types";

import { registrationResultParser } from "./structs/RegistrationResult";
import { realtimeUpdateParser } from "./structs/RealtimeUpdateParser";
import { realtimeCarUpdateParser } from "./structs/RealtimeCarUpdate";
import { physicsParser } from "./structs/PhysicsParser";
import { graphicsParser } from "./structs/GraphicsParser";
import { staticParser } from "./structs/StaticParser";

const client = dgram.createSocket("udp4");

let NodeIPC = null;

if (isWindows()) {
  try {
    NodeIPC = require("@fynnix/node-easy-ipc");
  } catch (error) {
    throw new Error("Operating system is not compatible...");
  }
}

export declare interface ACCNodeWrapper {
  /**
      @event `"REGISTRATION_RESULT"`
      @description Get update on a current session.
      */
  on(
    event: "REGISTRATION_RESULT",
    listener: (data: RegistrationResult) => void
  ): this;
  /**
      @event `"REALTIME_UPDATE"`
      @description Get update on a current session.
      */
  on(event: "REALTIME_UPDATE", listener: (data: RealtimeUpdate) => void): this;
  /**
      @event `"REALTIME_CAR_UPDATE"`
      @description Get update on the car.
      */
  on(
    event: "REALTIME_CAR_UPDATE",
    listener: (data: RealtimeCarUpdate) => void
  ): this;
  /**
      @event `"ENTRY_LIST"`
      @description Get the entry list of cars in current session.
      */
  on(event: "ENTRY_LIST", listener: (data: CarInformation[]) => void): this;
  /**
      @event `"ENTRY_LIST_CAR"`
      @description Get the entry list of cars in current session.
      */
  on(event: "ENTRY_LIST_CAR", listener: (data: EntryListCars) => void): this;

  on(event: "BROADCAST_EVENT", listener: (data: BroadcastEvent) => void): this;

  on(event: "PHYSICS_EVENT", listener: (data: PhysicsResult) => void): this;

  on(event: "STATIC_EVENT", listener: (data: StaticResult) => void): this;

  on(event: "GRAPHICS_EVENT", listener: (data: GraphicsResult) => void): this;
}

/**
 *  @class
 *  @name ACC_Node_Wrapper
 *  @comment ACC SDK implementation for Node.js.
 *  @extends EventEmitter
 */
export class ACCNodeWrapper extends EventEmitter {
  private isWindows = isWindows();
  private intervalID: NodeJS.Timer | null;
  private SharedMemoryInterval1: NodeJS.Timer | null;
  private SharedMemoryInterval2: NodeJS.Timer | null;
  private SharedMemoryInterval3: NodeJS.Timer | null;
  private m_physics_length: number;
  private m_physics_buffer: Buffer;
  private m_physics: any;
  private m_graphics_length: number;
  private m_graphics_buffer: Buffer;
  private m_graphics: any;
  private m_static_length: number;
  private m_static_buffer: Buffer;
  private m_static: any;
  private isServerMode: boolean;
  clientUDP: any;
  forwardOnly: boolean;
  name: string;
  password: string;
  cmdPassword: string;
  updateMS: number;
  port: number;
  address: string;
  isConnected: boolean;
  forwardAddresses: NetworkAddress[];
  M_PHYSICS_UPDATE_INTERVAL: number;
  M_GRAPHICS_UPDATE_INTERVAL: number;
  M_STATIC_UPDATE_INTERVAL: number;

  SERVER_DISPLAYNAME = null;
  SERVER_IP = null;
  SERVER_PORT = null;
  SERVER_PASS = null;
  SERVER_COMMANDPASS = null;
  UPDATE_INTERVAL = null;

  Logging = false;
  Logging2 = false;
  ConnectionId: null | number = null;
  lastEntrylistRequest: Moment | string = moment();
  _entryListCars: CarInfo[] = [];

  constructor() {
    super();

    if (this.isWindows) {
      this.SharedMemoryInterval1 = null;
      this.m_physics_length = 712;
      this.m_physics_buffer = Buffer.alloc(this.m_physics_length);
      this.m_physics = new NodeIPC.FileMapping();
      this.m_graphics = new NodeIPC.FileMapping();
      this.m_static = new NodeIPC.FileMapping();
      this.m_graphics_length = 1580;
      this.m_graphics_buffer = Buffer.alloc(this.m_graphics_length);
      this.m_static_length = 820;
      this.m_static_buffer = Buffer.alloc(this.m_static_length);
    }
  }

  initAsServer(options: AsServerOptions) {
    this.resolveAsServerOptions(options);

    this.initBroadcastSDK(options);
    this.initSharedMemory(options);
  }

  initAsClient(port: number) {
    this.clientUDP = dgram.createSocket("udp4");

    this.clientUDP.on("message", (message) => {
      const result = this.handlingMessage(message);

      this.emit(result["type"], result["result"]);
    });

    this.clientUDP.bind(port);
  }

  /**
   * @name initBroadcastSDK
   * @comment This is the init function for the ACC Node Wrapper. This inits the Broadcast SDK.
   * @param options @see BroadcastOptions 
  
   */
  initBroadcastSDK(options: BroadcastOptions) {
    this.resolveBroadcastOptions(options);

    client.on("message", (message, udp_info) => {
      if (this.isServerMode) this.bridgeMessage(message);

      if (this.forwardOnly) return;
      /*==== Handling Message ====*/
      const result = this.handlingMessage(message);

      this.emit(result["type"], result["result"]);

      /*==== Logging Message ====*/
      if (this.Logging) {
        console.log("=== ACC Node Wrapper ===");
        console.log("=== UDP Message Start ===");
        console.log("Info: Receiving a Message.");
        console.log(`From: ${udp_info.address}, ${udp_info.port}`);
        console.log(`Message: ${JSON.stringify(result)}`);
        console.log("=== UDP Message End ===");
        console.log("");
      }
    });

    /*==== Start Connection ====*/
    this.RequestConnection();
  }

  /**
   * @comment This is handling the errors.
   * @param err
   */
  handleError = (err) => {
    if (err) {
      console.log("=== ACC Node Wrapper ===");
      console.log("=== UDP Error Start ===");
      console.error(err);
      console.log("=== UDP Error End ===");
      console.log("");
    }
  };

  private resolveAsServerOptions(options: AsServerOptions) {
    this.isServerMode = true;

    const { forwardOnly, forwardAddresses } = options;

    this.forwardOnly = forwardOnly || false;
    this.forwardAddresses = forwardAddresses;
  }

  private resolveBroadcastOptions(options: BroadcastOptions) {
    const { port, cmdPassword, password, address, updateMS, name, logging } =
      options;

    this.SERVER_DISPLAYNAME = name;
    this.SERVER_PASS = password;
    this.SERVER_PORT = port || 9000;
    this.SERVER_COMMANDPASS = cmdPassword || "";
    this.SERVER_IP = address || "localhost";
    this.UPDATE_INTERVAL = updateMS || 250;
    this.Logging = logging || false;
  }

  private resolveSharedMemOptions(options: SharedMemoryOptions) {
    const { graphicsUpdateInt, staticUpdateInt, physicsUpdateInt, logging } =
      options;

    this.M_GRAPHICS_UPDATE_INTERVAL = graphicsUpdateInt || 250;
    this.M_STATIC_UPDATE_INTERVAL = staticUpdateInt || 250;
    this.M_PHYSICS_UPDATE_INTERVAL = physicsUpdateInt || 250;
    this.Logging2 = logging;
  }

  /**
   * @name handlingMessage
   * @comment This is the area where the incoming UDP messages are processed.
   * @param message
   * @returns {{result: {}, type: (*|number)}}
   */

  handlingMessage = (message: Buffer): { result: {}; type: any | number } => {
    const reader = new binutils.BinaryReader(message, "little");
    const messageType = reader.ReadUInt8();

    let result: RegistrationResult | RealtimeUpdate | any = {};

    switch (messageType) {
      case constants.InboundMessageTypes.REGISTRATION_RESULT:
        this.ConnectionId = reader.ReadInt32();
        result = registrationResultParser(reader, this.ConnectionId);
        this.RequestEntryList();
        this.RequestTrackData();
        break;

      case constants.InboundMessageTypes.REALTIME_UPDATE:
        result = realtimeUpdateParser(reader);
        break;

      case constants.InboundMessageTypes.REALTIME_CAR_UPDATE:
        {
          result = realtimeCarUpdateParser(reader);

          const carEntry = FirstOrDefault(
            this._entryListCars,
            (value) => value.CarIndex === result.CarIndex
          );

          if (
            carEntry === null ||
            this._entryListCars[carEntry].Drivers.length !== result.DriverCount
          )
            if (
              parseInt(moment().format("x")) -
                parseInt(this.lastEntrylistRequest as string) >
              1000
            ) {
              this.lastEntrylistRequest = moment().format("x");
              this.RequestEntryList();
            }
        }
        break;

      case constants.InboundMessageTypes.ENTRY_LIST:
        {
          this._entryListCars = [];
          result.connectionId = reader.ReadInt32();
          const carEntryCount = reader.ReadUInt16();
          for (let i = 0; i < carEntryCount; i++)
            this._entryListCars.push(new CarInfo(reader.ReadUInt16()));

          result._entryListCars = this._entryListCars;
        }
        break;

      case constants.InboundMessageTypes.TRACK_DATA:
        {
          result.connectionId = reader.ReadInt32();

          result.TrackName = ReadString(reader);
          result.TrackId = reader.ReadInt32();
          const TrackMeters = reader.ReadInt32();
          result.TrackMeters = TrackMeters > 0 ? TrackMeters : -1;

          result.CameraSets = [];
          const cameraSetCount = reader.ReadBytes(1).readUInt8(0);
          for (let i = 0; i < cameraSetCount; i++) {
            const cameras: string[] = [];
            const camSetName = ReadString(reader);
            const cameraCount = reader.ReadBytes(1).readUInt8(0);

            for (let j = 0; j < cameraCount; j++)
              cameras.push(ReadString(reader));

            result.CameraSets.push({
              name: camSetName,
              cameras,
            });
          }

          result.HUDPages = [];
          const hudPagesCount = reader.ReadBytes(1).readUInt8(0);
          for (let i = 0; i < hudPagesCount; i++)
            result.HUDPages.push(ReadString(reader));
        }
        break;

      case constants.InboundMessageTypes.ENTRY_LIST_CAR:
        {
          const carId = reader.ReadUInt16();
          const carInfo = SingleOrDefault(
            this._entryListCars,
            (value) => value.CarIndex === carId
          );

          if (carInfo === null) {
            result.err = `Entry list update for unknown carIndex ${carId}`;
            break;
          }

          this._entryListCars[carInfo].CarModelType = reader
            .ReadBytes(1)
            .readUInt8(0);
          this._entryListCars[carInfo].TeamName = ReadString(reader);
          this._entryListCars[carInfo].RaceNumber = reader.ReadInt32();
          this._entryListCars[carInfo].CupCategory = new CupCategory()[
            reader.ReadBytes(1).readUInt8(0).toString()
          ];
          this._entryListCars[carInfo].CurrentDriverIndex = reader
            .ReadBytes(1)
            .readUInt8(0);
          this._entryListCars[carInfo].Nationality = new NationalityEnum()[
            reader.ReadUInt16().toString()
          ];

          const driversOnCarCount = reader.ReadBytes(1).readUInt8(0);
          for (let i = 0; i < driversOnCarCount; i++) {
            const DriverInfo = {
              FirstName: ReadString(reader),
              LastName: ReadString(reader),
              ShortName: ReadString(reader),
              Category: new DriverCategory()[
                reader.ReadBytes(1).readUInt8(0).toString()
              ],
              Nationality: new NationalityEnum()[
                reader.ReadUInt16().toString()
              ],
            };

            this._entryListCars[carInfo].Drivers.push(DriverInfo);
          }

          result = this._entryListCars;
        }
        break;

      case constants.InboundMessageTypes.BROADCASTING_EVENT:
        {
          result.Type = new BroadcastingCarEventType()[
            reader.ReadBytes(1).readUInt8(0).toString()
          ];
          result.Msg = ReadString(reader);
          result.TimeMs = reader.ReadInt32();
          result.CarId = reader.ReadInt32();
          result.CarData =
            this._entryListCars[
              // @ts-ignore
              FirstOrDefault(
                this._entryListCars,
                (value) => value.CarIndex === result.CarId
              )
            ];
        }
        break;

      case constants.InboundMessageTypes.PHYSICS_EVENT:
        {
          result = physicsParser(reader);
        }
        break;

      case constants.InboundMessageTypes.GRAPHICS_EVENT:
        {
          result = graphicsParser(reader);
        }
        break;

      case constants.InboundMessageTypes.STATIC_EVENT:
        {
          result = staticParser(reader);
        }
        break;

      default:
        {
          result.err = "Type not recognized!";
        }
        break;
    }

    return {
      type:
        constants.InboundMessageTypesStr[messageType] !== undefined
          ? constants.InboundMessageTypesStr[messageType]
          : messageType,
      result,
    };
  };

  /**
   * @name RequestConnection
   * @comment This function creates the connection.
   */
  RequestConnection = () => {
    const SERVER_DISPLAYNAME_ARR = utf8(this.SERVER_DISPLAYNAME);
    const SERVER_PASS_ARR = utf8(this.SERVER_PASS);
    const SERVER_COMMANDPASS_ARR = utf8(this.SERVER_COMMANDPASS);

    const writer = new binutils.BinaryWriter("little");

    writer.WriteBytes([
      constants.outboundMessageTypes.REGISTER_COMMAND_APPLICATION,
    ]);

    writer.WriteBytes([
      constants.broadcastingNetworkProtocol.BROADCASTING_PROTOCOL_VERSION,
    ]);

    writer.WriteUInt16(SERVER_DISPLAYNAME_ARR.length);
    writer.WriteBytes(SERVER_DISPLAYNAME_ARR);
    writer.WriteUInt16(SERVER_PASS_ARR.length);
    writer.WriteBytes(SERVER_PASS_ARR);
    writer.WriteUInt32(this.UPDATE_INTERVAL);
    writer.WriteUInt16(SERVER_COMMANDPASS_ARR.length);
    writer.WriteBytes(SERVER_COMMANDPASS_ARR);

    const connection = writer.ByteBuffer;

    client.send(
      connection,
      0,
      connection.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name Disconnect
   * @comment This function disconnects the connection.
   */
  Disconnect = () => {
    const writer = new binutils.BinaryWriter("little");
    writer.WriteBytes([
      constants.outboundMessageTypes.UNREGISTER_COMMAND_APPLICATION,
    ]);
    writer.WriteUInt32(this.ConnectionId);

    const disconnect = writer.ByteBuffer;

    client.send(
      disconnect,
      0,
      disconnect.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name RequestEntryList
   * @comment This function request the entry list.
   */
  RequestEntryList = () => {
    const writer = new binutils.BinaryWriter("little");
    writer.WriteBytes([constants.outboundMessageTypes.REQUEST_ENTRY_LIST]);
    writer.WriteUInt32(this.ConnectionId);

    const request = writer.ByteBuffer;
    client.send(
      request,
      0,
      request.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name RequestTrackData
   * @comment This function request the track data.
   */
  RequestTrackData = () => {
    const writer = new binutils.BinaryWriter("little");
    writer.WriteBytes([constants.outboundMessageTypes.REQUEST_TRACK_DATA]);
    writer.WriteUInt32(this.ConnectionId);

    const request = writer.ByteBuffer;
    client.send(
      request,
      0,
      request.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name SetFocus
   * @comment This function sets the focus of the camera.
   */
  SetFocus = (carIndex, cameraSet, camera) => {
    this.SetFocusInternal(carIndex, cameraSet, camera);
  };

  /**
   * @name SetCamera
   * @comment This function sets the active camera.
   */
  SetCamera = (cameraSet, camera) => {
    this.SetFocusInternal(null, cameraSet, camera);
  };

  /**
   * @name SetFocusInternal
   * @comment This function is the main part for the SetFocus and SetCamera function.
   */
  SetFocusInternal = (carIndex, cameraSet, camera) => {
    const writer = new binutils.BinaryWriter("little");
    writer.WriteBytes([constants.outboundMessageTypes.CHANGE_FOCUS]);
    writer.WriteUInt32(this.ConnectionId);

    if (carIndex === null) writer.WriteBytes([0]);
    else {
      writer.WriteBytes([1]);
      writer.WriteUInt16(carIndex);
    }

    if (
      cameraSet === null ||
      cameraSet === undefined ||
      camera === null ||
      camera === undefined
    )
      writer.WriteBytes([0]);
    else {
      writer.WriteBytes([1]);
      const cSet = utf8(cameraSet);
      writer.WriteUInt16(cSet.length);
      writer.WriteBytes(cSet);
      const c = utf8(camera);
      writer.WriteUInt16(c.length);
      writer.WriteBytes(c);
    }

    const request = writer.ByteBuffer;

    client.send(
      request,
      0,
      request.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name RequestInstantReplay
   * @comment This function is requesting instant replay.
   */
  RequestInstantReplay = (
    startSessionTime,
    durationMS,
    initialFocusedCarIndex,
    initialCameraSet,
    initialCamera
  ) => {
    const writer = new binutils.BinaryWriter("little");
    writer.WriteBytes([constants.outboundMessageTypes.INSTANT_REPLAY_REQUEST]);
    writer.WriteUInt32(this.ConnectionId);

    writer.WriteFloat(startSessionTime);
    writer.WriteFloat(durationMS);
    writer.WriteInt32(initialFocusedCarIndex || -1);

    const cameraSet = utf8(initialCameraSet || "");
    writer.WriteUInt16(cameraSet.length);
    writer.WriteBytes(cameraSet);
    const camera = utf8(initialCamera || "");
    writer.WriteUInt16(camera.length);
    writer.WriteBytes(camera);

    const request = writer.ByteBuffer;
    client.send(
      request,
      0,
      request.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name RequestHUDPage
   * @comment This function is requesting a HUD Page change.
   */
  RequestHUDPage = (hudPage) => {
    const writer = new binutils.BinaryWriter("little");
    writer.WriteBytes([constants.outboundMessageTypes.CHANGE_HUD_PAGE]);
    writer.WriteUInt32(this.ConnectionId);

    const page = utf8(hudPage);
    writer.WriteUInt16(page.length);
    writer.WriteBytes(hudPage);

    const request = writer.ByteBuffer;
    client.send(
      request,
      0,
      request.length,
      this.SERVER_PORT,
      this.SERVER_IP,
      this.handleError
    );
  };

  /**
   * @name initSharedMemory
   * @comment This is the init function for the ACC Node Wrapper. This inits the Shared Memory.
   * @param M_PHYSICS_UPDATE_INTERVAL
   * @param M_GRAPHICS_UPDATE_INTERVAL
   * @param M_STATIC_UPDATE_INTERVAL
   * @param Logging
   */
  initSharedMemory(options: SharedMemoryOptions) {
    if (!this.isWindows && !this.isServerMode)
      throw new Error(
        "You must be on the windows machine to use this functionality"
      );

    // this should fail with no error because server mode is designed to broadcast shared memory
    // across the network and if a person is doing this it's possibly for a very specific/strange reason
    if (!this.isWindows && this.isServerMode)
      return console.log(
        "Only utilizing broadcast mode as this is not a windows computer"
      );

    this.resolveSharedMemOptions(options);

    /*==== Start Interval M_PHYSICS ====*/
    this.SharedMemoryInterval1 = setInterval(() => {
      const m_physics_result = this.ReadPhysics();

      this.emit("M_PHYSICS_RESULT", m_physics_result);

      /*==== Logging Message ====*/
      if (this.Logging2) {
        console.log("=== ACC Node Wrapper ===");
        console.log("=== Shared Memory Start ===");
        console.log("Info: Receiving a Message.");
        console.log(`Message: ${JSON.stringify(m_physics_result)}`);
        console.log("=== Shared Memory End ===");
        console.log("");
      }
    }, this.M_PHYSICS_UPDATE_INTERVAL);

    /*==== Start Interval M_GRAPHICS ====*/
    this.SharedMemoryInterval2 = setInterval(() => {
      const m_graphics_result = this.ReadGraphics();
      this.emit("M_GRAPHICS_RESULT", m_graphics_result);

      /*==== Logging Message ====*/
      if (this.Logging2) {
        console.log("=== ACC Node Wrapper ===");
        console.log("=== Shared Memory Start ===");
        console.log("Info: Receiving a Message.");
        console.log(`Message: ${JSON.stringify(m_graphics_result)}`);
        console.log("=== Shared Memory End ===");
        console.log("");
      }
    }, this.M_GRAPHICS_UPDATE_INTERVAL);

    /*==== Start Interval M_STATIC ====*/
    this.SharedMemoryInterval3 = setInterval(() => {
      const m_static_result = this.ReadStatic();
      this.emit("M_STATIC_RESULT", m_static_result);

      /*==== Logging Message ====*/
      if (this.Logging2) {
        console.log("=== ACC Node Wrapper ===");
        console.log("=== Shared Memory Start ===");
        console.log("Info: Receiving a Message.");
        console.log(`Message: ${JSON.stringify(m_static_result)}`);
        console.log("=== Shared Memory End ===");
        console.log("");
      }
    }, this.M_STATIC_UPDATE_INTERVAL);
  }

  /**
   * @name disconnectSharedMemory
   * @comment This function disconnects the Wrapper from the Shared Memory.
   */
  disconnectSharedMemory() {
    this.m_physics.closeMapping();
    this.m_graphics.closeMapping();
    this.m_static.closeMapping();

    clearInterval(this.SharedMemoryInterval1 as NodeJS.Timeout);
    clearInterval(this.SharedMemoryInterval2 as NodeJS.Timeout);
    clearInterval(this.SharedMemoryInterval3 as NodeJS.Timeout);
  }

  /**
   * @name ReadPhysics
   * @comment This function reads the Physics Shared Memory.
   */
  ReadPhysics() {
    const FilePhysics_Path = "Local\\acpmf_physics";
    this.m_physics.createMapping(null, FilePhysics_Path, this.m_physics_length);
    this.m_physics.readInto(0, this.m_physics_length, this.m_physics_buffer);

    if (this.isServerMode) {
      const writer = new binutils.BinaryWriter("little");

      writer.WriteBytes([8]);
      writer.WriteBytes(this.m_physics_buffer);

      const response = writer.ByteBuffer;

      this.bridgeMessage(response);
    }

    if (this.forwardOnly) return;

    const reader = new binutils.BinaryReader(this.m_physics_buffer, "little");

    return physicsParser(reader);
  }

  /**
   * @name ReadGraphics
   * @comment This function reads the Graphics Shared Memory.
   */
  ReadGraphics() {
    const FileGraphics_Path = "Local\\acpmf_graphics";
    this.m_graphics.createMapping(
      null,
      FileGraphics_Path,
      this.m_graphics_length
    );
    this.m_graphics.readInto(0, this.m_graphics_length, this.m_graphics_buffer);

    if (this.isServerMode) {
      const writer = new binutils.BinaryWriter("little");

      writer.WriteBytes([9]);
      writer.WriteBytes(this.m_graphics_buffer);

      const response = writer.ByteBuffer;

      this.bridgeMessage(response);
    }

    if (this.forwardOnly) return;

    const reader = new binutils.BinaryReader(this.m_graphics_buffer, "little");

    return graphicsParser(reader);
  }

  /**
   * @name ReadStatic
   * @comment This function reads the Static Shared Memory.
   */
  ReadStatic() {
    const FileStatic_Path = "Local\\acpmf_static";
    this.m_static.createMapping(null, FileStatic_Path, this.m_static_length);
    this.m_static.readInto(0, this.m_static_length, this.m_static_buffer);

    if (this.isServerMode) {
      const writer = new binutils.BinaryWriter("little");

      writer.WriteBytes([10]);
      writer.WriteBytes(this.m_static_buffer);

      const response = writer.ByteBuffer;

      this.bridgeMessage(response);
    }

    if (this.forwardOnly) return;

    const reader = new binutils.BinaryReader(this.m_static_buffer, "little");

    return staticParser(reader);
  }

  bridgeMessage(message: Buffer): void {
    if (!client) {
      throw new Error("Socket is not initialized");
    }
    if (!client) {
      throw new Error("No ports to bridge over");
    }
    for (const address of this.forwardAddresses) {
      client.send(
        message,
        0,
        message.length,
        address.port,
        address.address || "0.0.0.0"
      );
    }
  }
}

export default ACCNodeWrapper;
export * from "./types";
