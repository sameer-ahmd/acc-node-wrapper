"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  ACCNodeWrapper: true
};
exports.default = exports.ACCNodeWrapper = void 0;
var _nodeDgram = _interopRequireDefault(require("node:dgram"));
var _events = _interopRequireDefault(require("events"));
var _constants = _interopRequireDefault(require("./constants"));
var _binutils = _interopRequireDefault(require("binutils"));
var _utf8Bytes = _interopRequireDefault(require("utf8-bytes"));
var _moment = _interopRequireDefault(require("moment"));
var _isWindows = require("./lib/isWindows");
var _FirstOrDefault = _interopRequireDefault(require("./lib/FirstOrDefault"));
var _SingleOrDefault = _interopRequireDefault(require("./lib/SingleOrDefault"));
var _ReadString = _interopRequireDefault(require("./lib/ReadString"));
var _CarInfo = _interopRequireDefault(require("./structs/CarInfo"));
var _enums = require("./enums");
var _RegistrationResult = require("./structs/RegistrationResult");
var _RealtimeUpdateParser = require("./structs/RealtimeUpdateParser");
var _RealtimeCarUpdate = require("./structs/RealtimeCarUpdate");
var _PhysicsParser = require("./structs/PhysicsParser");
var _GraphicsParser = require("./structs/GraphicsParser");
var _StaticParser = require("./structs/StaticParser");
var _types = require("./types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/*==== Import Section ==== */

const client = _nodeDgram.default.createSocket("udp4");
let NodeIPC = null;
if ((0, _isWindows.isWindows)()) {
  try {
    NodeIPC = require("@fynnix/node-easy-ipc");
  } catch (error) {
    throw new Error("Operating system is not compatible...");
  }
}
/**
 *  @class
 *  @name ACC_Node_Wrapper
 *  @comment ACC SDK implementation for Node.js.
 *  @extends EventEmitter
 */
class ACCNodeWrapper extends _events.default {
  isWindows = (0, _isWindows.isWindows)();
  SERVER_DISPLAYNAME = null;
  SERVER_IP = null;
  SERVER_PORT = null;
  SERVER_PASS = null;
  SERVER_COMMANDPASS = null;
  UPDATE_INTERVAL = null;
  Logging = false;
  Logging2 = false;
  ConnectionId = null;
  lastEntrylistRequest = (0, _moment.default)();
  _entryListCars = [];
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
  initAsServer(options) {
    this.resolveAsServerOptions(options);
    this.initBroadcastSDK(options);
    this.initSharedMemory(options);
  }
  initAsClient(port) {
    this.clientUDP = _nodeDgram.default.createSocket("udp4");
    this.clientUDP.on("message", message => {
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
  initBroadcastSDK(options) {
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
  handleError = err => {
    if (err) {
      console.log("=== ACC Node Wrapper ===");
      console.log("=== UDP Error Start ===");
      console.error(err);
      console.log("=== UDP Error End ===");
      console.log("");
    }
  };
  resolveAsServerOptions(options) {
    this.isServerMode = true;
    const {
      forwardOnly,
      forwardAddresses
    } = options;
    this.forwardOnly = forwardOnly || false;
    this.forwardAddresses = forwardAddresses;
  }
  resolveBroadcastOptions(options) {
    const {
      port,
      cmdPassword,
      password,
      address,
      updateMS,
      name,
      logging
    } = options;
    this.SERVER_DISPLAYNAME = name;
    this.SERVER_PASS = password;
    this.SERVER_PORT = port || 9000;
    this.SERVER_COMMANDPASS = cmdPassword || "";
    this.SERVER_IP = address || "localhost";
    this.UPDATE_INTERVAL = updateMS || 250;
    this.Logging = logging || false;
  }
  resolveSharedMemOptions(options) {
    const {
      graphicsUpdateInt,
      staticUpdateInt,
      physicsUpdateInt,
      logging
    } = options;
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

  handlingMessage = message => {
    const reader = new _binutils.default.BinaryReader(message, "little");
    const messageType = reader.ReadUInt8();
    let result = {};
    switch (messageType) {
      case _constants.default.InboundMessageTypes.REGISTRATION_RESULT:
        this.ConnectionId = reader.ReadInt32();
        result = (0, _RegistrationResult.registrationResultParser)(reader, this.ConnectionId);
        this.RequestEntryList();
        this.RequestTrackData();
        break;
      case _constants.default.InboundMessageTypes.REALTIME_UPDATE:
        result = (0, _RealtimeUpdateParser.realtimeUpdateParser)(reader);
        break;
      case _constants.default.InboundMessageTypes.REALTIME_CAR_UPDATE:
        {
          result = (0, _RealtimeCarUpdate.realtimeCarUpdateParser)(reader);
          const carEntry = (0, _FirstOrDefault.default)(this._entryListCars, value => value.CarIndex === result.CarIndex);
          if (carEntry === null || this._entryListCars[carEntry].Drivers.length !== result.DriverCount) if (parseInt((0, _moment.default)().format("x")) - parseInt(this.lastEntrylistRequest) > 1000) {
            this.lastEntrylistRequest = (0, _moment.default)().format("x");
            this.RequestEntryList();
          }
        }
        break;
      case _constants.default.InboundMessageTypes.ENTRY_LIST:
        {
          this._entryListCars = [];
          result.connectionId = reader.ReadInt32();
          const carEntryCount = reader.ReadUInt16();
          for (let i = 0; i < carEntryCount; i++) this._entryListCars.push(new _CarInfo.default(reader.ReadUInt16()));
          result._entryListCars = this._entryListCars;
        }
        break;
      case _constants.default.InboundMessageTypes.TRACK_DATA:
        {
          result.connectionId = reader.ReadInt32();
          result.TrackName = (0, _ReadString.default)(reader);
          result.TrackId = reader.ReadInt32();
          const TrackMeters = reader.ReadInt32();
          result.TrackMeters = TrackMeters > 0 ? TrackMeters : -1;
          result.CameraSets = [];
          const cameraSetCount = reader.ReadBytes(1).readUInt8(0);
          for (let i = 0; i < cameraSetCount; i++) {
            const cameras = [];
            const camSetName = (0, _ReadString.default)(reader);
            const cameraCount = reader.ReadBytes(1).readUInt8(0);
            for (let j = 0; j < cameraCount; j++) cameras.push((0, _ReadString.default)(reader));
            result.CameraSets.push({
              name: camSetName,
              cameras
            });
          }
          result.HUDPages = [];
          const hudPagesCount = reader.ReadBytes(1).readUInt8(0);
          for (let i = 0; i < hudPagesCount; i++) result.HUDPages.push((0, _ReadString.default)(reader));
        }
        break;
      case _constants.default.InboundMessageTypes.ENTRY_LIST_CAR:
        {
          const carId = reader.ReadUInt16();
          const carInfo = (0, _SingleOrDefault.default)(this._entryListCars, value => value.CarIndex === carId);
          if (carInfo === null) {
            result.err = `Entry list update for unknown carIndex ${carId}`;
            break;
          }
          this._entryListCars[carInfo].CarModelType = reader.ReadBytes(1).readUInt8(0);
          this._entryListCars[carInfo].TeamName = (0, _ReadString.default)(reader);
          this._entryListCars[carInfo].RaceNumber = reader.ReadInt32();
          this._entryListCars[carInfo].CupCategory = new _enums.CupCategory()[reader.ReadBytes(1).readUInt8(0).toString()];
          this._entryListCars[carInfo].CurrentDriverIndex = reader.ReadBytes(1).readUInt8(0);
          this._entryListCars[carInfo].Nationality = new _enums.NationalityEnum()[reader.ReadUInt16().toString()];
          const driversOnCarCount = reader.ReadBytes(1).readUInt8(0);
          for (let i = 0; i < driversOnCarCount; i++) {
            const DriverInfo = {
              FirstName: (0, _ReadString.default)(reader),
              LastName: (0, _ReadString.default)(reader),
              ShortName: (0, _ReadString.default)(reader),
              Category: new _enums.DriverCategory()[reader.ReadBytes(1).readUInt8(0).toString()],
              Nationality: new _enums.NationalityEnum()[reader.ReadUInt16().toString()]
            };
            this._entryListCars[carInfo].Drivers.push(DriverInfo);
          }
          result = this._entryListCars;
        }
        break;
      case _constants.default.InboundMessageTypes.BROADCASTING_EVENT:
        {
          result.Type = new _enums.BroadcastingCarEventType()[reader.ReadBytes(1).readUInt8(0).toString()];
          result.Msg = (0, _ReadString.default)(reader);
          result.TimeMs = reader.ReadInt32();
          result.CarId = reader.ReadInt32();
          result.CarData = this._entryListCars[
          // @ts-ignore
          (0, _FirstOrDefault.default)(this._entryListCars, value => value.CarIndex === result.CarId)];
        }
        break;
      case _constants.default.InboundMessageTypes.PHYSICS_EVENT:
        {
          result = (0, _PhysicsParser.physicsParser)(reader);
        }
        break;
      case _constants.default.InboundMessageTypes.GRAPHICS_EVENT:
        {
          result = (0, _GraphicsParser.graphicsParser)(reader);
        }
        break;
      case _constants.default.InboundMessageTypes.STATIC_EVENT:
        {
          result = (0, _StaticParser.staticParser)(reader);
        }
        break;
      default:
        {
          result.err = "Type not recognized!";
        }
        break;
    }
    return {
      type: _constants.default.InboundMessageTypesStr[messageType] !== undefined ? _constants.default.InboundMessageTypesStr[messageType] : messageType,
      result
    };
  };

  /**
   * @name RequestConnection
   * @comment This function creates the connection.
   */
  RequestConnection = () => {
    const SERVER_DISPLAYNAME_ARR = (0, _utf8Bytes.default)(this.SERVER_DISPLAYNAME);
    const SERVER_PASS_ARR = (0, _utf8Bytes.default)(this.SERVER_PASS);
    const SERVER_COMMANDPASS_ARR = (0, _utf8Bytes.default)(this.SERVER_COMMANDPASS);
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.REGISTER_COMMAND_APPLICATION]);
    writer.WriteBytes([_constants.default.broadcastingNetworkProtocol.BROADCASTING_PROTOCOL_VERSION]);
    writer.WriteUInt16(SERVER_DISPLAYNAME_ARR.length);
    writer.WriteBytes(SERVER_DISPLAYNAME_ARR);
    writer.WriteUInt16(SERVER_PASS_ARR.length);
    writer.WriteBytes(SERVER_PASS_ARR);
    writer.WriteUInt32(this.UPDATE_INTERVAL);
    writer.WriteUInt16(SERVER_COMMANDPASS_ARR.length);
    writer.WriteBytes(SERVER_COMMANDPASS_ARR);
    const connection = writer.ByteBuffer;
    client.send(connection, 0, connection.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
  };

  /**
   * @name Disconnect
   * @comment This function disconnects the connection.
   */
  Disconnect = () => {
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.UNREGISTER_COMMAND_APPLICATION]);
    writer.WriteUInt32(this.ConnectionId);
    const disconnect = writer.ByteBuffer;
    client.send(disconnect, 0, disconnect.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
  };

  /**
   * @name RequestEntryList
   * @comment This function request the entry list.
   */
  RequestEntryList = () => {
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.REQUEST_ENTRY_LIST]);
    writer.WriteUInt32(this.ConnectionId);
    const request = writer.ByteBuffer;
    client.send(request, 0, request.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
  };

  /**
   * @name RequestTrackData
   * @comment This function request the track data.
   */
  RequestTrackData = () => {
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.REQUEST_TRACK_DATA]);
    writer.WriteUInt32(this.ConnectionId);
    const request = writer.ByteBuffer;
    client.send(request, 0, request.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
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
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.CHANGE_FOCUS]);
    writer.WriteUInt32(this.ConnectionId);
    if (carIndex === null) writer.WriteBytes([0]);else {
      writer.WriteBytes([1]);
      writer.WriteUInt16(carIndex);
    }
    if (cameraSet === null || cameraSet === undefined || camera === null || camera === undefined) writer.WriteBytes([0]);else {
      writer.WriteBytes([1]);
      const cSet = (0, _utf8Bytes.default)(cameraSet);
      writer.WriteUInt16(cSet.length);
      writer.WriteBytes(cSet);
      const c = (0, _utf8Bytes.default)(camera);
      writer.WriteUInt16(c.length);
      writer.WriteBytes(c);
    }
    const request = writer.ByteBuffer;
    client.send(request, 0, request.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
  };

  /**
   * @name RequestInstantReplay
   * @comment This function is requesting instant replay.
   */
  RequestInstantReplay = (startSessionTime, durationMS, initialFocusedCarIndex, initialCameraSet, initialCamera) => {
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.INSTANT_REPLAY_REQUEST]);
    writer.WriteUInt32(this.ConnectionId);
    writer.WriteFloat(startSessionTime);
    writer.WriteFloat(durationMS);
    writer.WriteInt32(initialFocusedCarIndex || -1);
    const cameraSet = (0, _utf8Bytes.default)(initialCameraSet || "");
    writer.WriteUInt16(cameraSet.length);
    writer.WriteBytes(cameraSet);
    const camera = (0, _utf8Bytes.default)(initialCamera || "");
    writer.WriteUInt16(camera.length);
    writer.WriteBytes(camera);
    const request = writer.ByteBuffer;
    client.send(request, 0, request.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
  };

  /**
   * @name RequestHUDPage
   * @comment This function is requesting a HUD Page change.
   */
  RequestHUDPage = hudPage => {
    const writer = new _binutils.default.BinaryWriter("little");
    writer.WriteBytes([_constants.default.outboundMessageTypes.CHANGE_HUD_PAGE]);
    writer.WriteUInt32(this.ConnectionId);
    const page = (0, _utf8Bytes.default)(hudPage);
    writer.WriteUInt16(page.length);
    writer.WriteBytes(hudPage);
    const request = writer.ByteBuffer;
    client.send(request, 0, request.length, this.SERVER_PORT, this.SERVER_IP, this.handleError);
  };

  /**
   * @name initSharedMemory
   * @comment This is the init function for the ACC Node Wrapper. This inits the Shared Memory.
   * @param M_PHYSICS_UPDATE_INTERVAL
   * @param M_GRAPHICS_UPDATE_INTERVAL
   * @param M_STATIC_UPDATE_INTERVAL
   * @param Logging
   */
  initSharedMemory(options) {
    if (!this.isWindows && !this.isServerMode) throw new Error("You must be on the windows machine to use this functionality");

    // this should fail with no error because server mode is designed to broadcast shared memory
    // across the network and if a person is doing this it's possibly for a very specific/strange reason
    if (!this.isWindows && this.isServerMode) return console.log("Only utilizing broadcast mode as this is not a windows computer");
    this.resolveSharedMemOptions(options);

    /*==== Start Interval M_PHYSICS ====*/
    this.SharedMemoryInterval1 = setInterval(() => {
      const m_physics_result = this.ReadPhysics();
      this.emit("PHYSICS_EVENT", m_physics_result);

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
      this.emit("GRAPHICS_EVENT", m_graphics_result);

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
      this.emit("STATIC_EVENT", m_static_result);

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
    clearInterval(this.SharedMemoryInterval1);
    clearInterval(this.SharedMemoryInterval2);
    clearInterval(this.SharedMemoryInterval3);
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
      const writer = new _binutils.default.BinaryWriter("little");
      writer.WriteBytes([8]);
      writer.WriteBytes(this.m_physics_buffer);
      const response = writer.ByteBuffer;
      this.bridgeMessage(response);
    }
    if (this.forwardOnly) return;
    const reader = new _binutils.default.BinaryReader(this.m_physics_buffer, "little");
    return (0, _PhysicsParser.physicsParser)(reader);
  }

  /**
   * @name ReadGraphics
   * @comment This function reads the Graphics Shared Memory.
   */
  ReadGraphics() {
    const FileGraphics_Path = "Local\\acpmf_graphics";
    this.m_graphics.createMapping(null, FileGraphics_Path, this.m_graphics_length);
    this.m_graphics.readInto(0, this.m_graphics_length, this.m_graphics_buffer);
    if (this.isServerMode) {
      const writer = new _binutils.default.BinaryWriter("little");
      writer.WriteBytes([9]);
      writer.WriteBytes(this.m_graphics_buffer);
      const response = writer.ByteBuffer;
      this.bridgeMessage(response);
    }
    if (this.forwardOnly) return;
    const reader = new _binutils.default.BinaryReader(this.m_graphics_buffer, "little");
    return (0, _GraphicsParser.graphicsParser)(reader);
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
      const writer = new _binutils.default.BinaryWriter("little");
      writer.WriteBytes([10]);
      writer.WriteBytes(this.m_static_buffer);
      const response = writer.ByteBuffer;
      this.bridgeMessage(response);
    }
    if (this.forwardOnly) return;
    const reader = new _binutils.default.BinaryReader(this.m_static_buffer, "little");
    return (0, _StaticParser.staticParser)(reader);
  }
  bridgeMessage(message) {
    if (!client) {
      throw new Error("Socket is not initialized");
    }
    if (!client) {
      throw new Error("No ports to bridge over");
    }
    for (const address of this.forwardAddresses) {
      client.send(message, 0, message.length, address.port, address.address || "0.0.0.0");
    }
  }
}
exports.ACCNodeWrapper = ACCNodeWrapper;
var _default = exports.default = ACCNodeWrapper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfbm9kZURncmFtIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZXZlbnRzIiwiX2NvbnN0YW50cyIsIl9iaW51dGlscyIsIl91dGY4Qnl0ZXMiLCJfbW9tZW50IiwiX2lzV2luZG93cyIsIl9GaXJzdE9yRGVmYXVsdCIsIl9TaW5nbGVPckRlZmF1bHQiLCJfUmVhZFN0cmluZyIsIl9DYXJJbmZvIiwiX2VudW1zIiwiX1JlZ2lzdHJhdGlvblJlc3VsdCIsIl9SZWFsdGltZVVwZGF0ZVBhcnNlciIsIl9SZWFsdGltZUNhclVwZGF0ZSIsIl9QaHlzaWNzUGFyc2VyIiwiX0dyYXBoaWNzUGFyc2VyIiwiX1N0YXRpY1BhcnNlciIsIl90eXBlcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiX2V4cG9ydE5hbWVzIiwiZXhwb3J0cyIsImRlZmluZVByb3BlcnR5IiwiZW51bWVyYWJsZSIsImdldCIsImUiLCJfX2VzTW9kdWxlIiwiZGVmYXVsdCIsImNsaWVudCIsImRncmFtIiwiY3JlYXRlU29ja2V0IiwiTm9kZUlQQyIsImlzV2luZG93cyIsImVycm9yIiwiRXJyb3IiLCJBQ0NOb2RlV3JhcHBlciIsIkV2ZW50RW1pdHRlciIsIlNFUlZFUl9ESVNQTEFZTkFNRSIsIlNFUlZFUl9JUCIsIlNFUlZFUl9QT1JUIiwiU0VSVkVSX1BBU1MiLCJTRVJWRVJfQ09NTUFORFBBU1MiLCJVUERBVEVfSU5URVJWQUwiLCJMb2dnaW5nIiwiTG9nZ2luZzIiLCJDb25uZWN0aW9uSWQiLCJsYXN0RW50cnlsaXN0UmVxdWVzdCIsIm1vbWVudCIsIl9lbnRyeUxpc3RDYXJzIiwiY29uc3RydWN0b3IiLCJTaGFyZWRNZW1vcnlJbnRlcnZhbDEiLCJtX3BoeXNpY3NfbGVuZ3RoIiwibV9waHlzaWNzX2J1ZmZlciIsIkJ1ZmZlciIsImFsbG9jIiwibV9waHlzaWNzIiwiRmlsZU1hcHBpbmciLCJtX2dyYXBoaWNzIiwibV9zdGF0aWMiLCJtX2dyYXBoaWNzX2xlbmd0aCIsIm1fZ3JhcGhpY3NfYnVmZmVyIiwibV9zdGF0aWNfbGVuZ3RoIiwibV9zdGF0aWNfYnVmZmVyIiwiaW5pdEFzU2VydmVyIiwib3B0aW9ucyIsInJlc29sdmVBc1NlcnZlck9wdGlvbnMiLCJpbml0QnJvYWRjYXN0U0RLIiwiaW5pdFNoYXJlZE1lbW9yeSIsImluaXRBc0NsaWVudCIsInBvcnQiLCJjbGllbnRVRFAiLCJvbiIsIm1lc3NhZ2UiLCJyZXN1bHQiLCJoYW5kbGluZ01lc3NhZ2UiLCJlbWl0IiwiYmluZCIsInJlc29sdmVCcm9hZGNhc3RPcHRpb25zIiwidWRwX2luZm8iLCJpc1NlcnZlck1vZGUiLCJicmlkZ2VNZXNzYWdlIiwiZm9yd2FyZE9ubHkiLCJjb25zb2xlIiwibG9nIiwiYWRkcmVzcyIsIkpTT04iLCJzdHJpbmdpZnkiLCJSZXF1ZXN0Q29ubmVjdGlvbiIsImhhbmRsZUVycm9yIiwiZXJyIiwiZm9yd2FyZEFkZHJlc3NlcyIsImNtZFBhc3N3b3JkIiwicGFzc3dvcmQiLCJ1cGRhdGVNUyIsIm5hbWUiLCJsb2dnaW5nIiwicmVzb2x2ZVNoYXJlZE1lbU9wdGlvbnMiLCJncmFwaGljc1VwZGF0ZUludCIsInN0YXRpY1VwZGF0ZUludCIsInBoeXNpY3NVcGRhdGVJbnQiLCJNX0dSQVBISUNTX1VQREFURV9JTlRFUlZBTCIsIk1fU1RBVElDX1VQREFURV9JTlRFUlZBTCIsIk1fUEhZU0lDU19VUERBVEVfSU5URVJWQUwiLCJyZWFkZXIiLCJiaW51dGlscyIsIkJpbmFyeVJlYWRlciIsIm1lc3NhZ2VUeXBlIiwiUmVhZFVJbnQ4IiwiY29uc3RhbnRzIiwiSW5ib3VuZE1lc3NhZ2VUeXBlcyIsIlJFR0lTVFJBVElPTl9SRVNVTFQiLCJSZWFkSW50MzIiLCJyZWdpc3RyYXRpb25SZXN1bHRQYXJzZXIiLCJSZXF1ZXN0RW50cnlMaXN0IiwiUmVxdWVzdFRyYWNrRGF0YSIsIlJFQUxUSU1FX1VQREFURSIsInJlYWx0aW1lVXBkYXRlUGFyc2VyIiwiUkVBTFRJTUVfQ0FSX1VQREFURSIsInJlYWx0aW1lQ2FyVXBkYXRlUGFyc2VyIiwiY2FyRW50cnkiLCJGaXJzdE9yRGVmYXVsdCIsInZhbHVlIiwiQ2FySW5kZXgiLCJEcml2ZXJzIiwibGVuZ3RoIiwiRHJpdmVyQ291bnQiLCJwYXJzZUludCIsImZvcm1hdCIsIkVOVFJZX0xJU1QiLCJjb25uZWN0aW9uSWQiLCJjYXJFbnRyeUNvdW50IiwiUmVhZFVJbnQxNiIsImkiLCJwdXNoIiwiQ2FySW5mbyIsIlRSQUNLX0RBVEEiLCJUcmFja05hbWUiLCJSZWFkU3RyaW5nIiwiVHJhY2tJZCIsIlRyYWNrTWV0ZXJzIiwiQ2FtZXJhU2V0cyIsImNhbWVyYVNldENvdW50IiwiUmVhZEJ5dGVzIiwicmVhZFVJbnQ4IiwiY2FtZXJhcyIsImNhbVNldE5hbWUiLCJjYW1lcmFDb3VudCIsImoiLCJIVURQYWdlcyIsImh1ZFBhZ2VzQ291bnQiLCJFTlRSWV9MSVNUX0NBUiIsImNhcklkIiwiY2FySW5mbyIsIlNpbmdsZU9yRGVmYXVsdCIsIkNhck1vZGVsVHlwZSIsIlRlYW1OYW1lIiwiUmFjZU51bWJlciIsIkN1cENhdGVnb3J5IiwidG9TdHJpbmciLCJDdXJyZW50RHJpdmVySW5kZXgiLCJOYXRpb25hbGl0eSIsIk5hdGlvbmFsaXR5RW51bSIsImRyaXZlcnNPbkNhckNvdW50IiwiRHJpdmVySW5mbyIsIkZpcnN0TmFtZSIsIkxhc3ROYW1lIiwiU2hvcnROYW1lIiwiQ2F0ZWdvcnkiLCJEcml2ZXJDYXRlZ29yeSIsIkJST0FEQ0FTVElOR19FVkVOVCIsIlR5cGUiLCJCcm9hZGNhc3RpbmdDYXJFdmVudFR5cGUiLCJNc2ciLCJUaW1lTXMiLCJDYXJJZCIsIkNhckRhdGEiLCJQSFlTSUNTX0VWRU5UIiwicGh5c2ljc1BhcnNlciIsIkdSQVBISUNTX0VWRU5UIiwiZ3JhcGhpY3NQYXJzZXIiLCJTVEFUSUNfRVZFTlQiLCJzdGF0aWNQYXJzZXIiLCJ0eXBlIiwiSW5ib3VuZE1lc3NhZ2VUeXBlc1N0ciIsInVuZGVmaW5lZCIsIlNFUlZFUl9ESVNQTEFZTkFNRV9BUlIiLCJ1dGY4IiwiU0VSVkVSX1BBU1NfQVJSIiwiU0VSVkVSX0NPTU1BTkRQQVNTX0FSUiIsIndyaXRlciIsIkJpbmFyeVdyaXRlciIsIldyaXRlQnl0ZXMiLCJvdXRib3VuZE1lc3NhZ2VUeXBlcyIsIlJFR0lTVEVSX0NPTU1BTkRfQVBQTElDQVRJT04iLCJicm9hZGNhc3RpbmdOZXR3b3JrUHJvdG9jb2wiLCJCUk9BRENBU1RJTkdfUFJPVE9DT0xfVkVSU0lPTiIsIldyaXRlVUludDE2IiwiV3JpdGVVSW50MzIiLCJjb25uZWN0aW9uIiwiQnl0ZUJ1ZmZlciIsInNlbmQiLCJEaXNjb25uZWN0IiwiVU5SRUdJU1RFUl9DT01NQU5EX0FQUExJQ0FUSU9OIiwiZGlzY29ubmVjdCIsIlJFUVVFU1RfRU5UUllfTElTVCIsInJlcXVlc3QiLCJSRVFVRVNUX1RSQUNLX0RBVEEiLCJTZXRGb2N1cyIsImNhckluZGV4IiwiY2FtZXJhU2V0IiwiY2FtZXJhIiwiU2V0Rm9jdXNJbnRlcm5hbCIsIlNldENhbWVyYSIsIkNIQU5HRV9GT0NVUyIsImNTZXQiLCJjIiwiUmVxdWVzdEluc3RhbnRSZXBsYXkiLCJzdGFydFNlc3Npb25UaW1lIiwiZHVyYXRpb25NUyIsImluaXRpYWxGb2N1c2VkQ2FySW5kZXgiLCJpbml0aWFsQ2FtZXJhU2V0IiwiaW5pdGlhbENhbWVyYSIsIklOU1RBTlRfUkVQTEFZX1JFUVVFU1QiLCJXcml0ZUZsb2F0IiwiV3JpdGVJbnQzMiIsIlJlcXVlc3RIVURQYWdlIiwiaHVkUGFnZSIsIkNIQU5HRV9IVURfUEFHRSIsInBhZ2UiLCJzZXRJbnRlcnZhbCIsIm1fcGh5c2ljc19yZXN1bHQiLCJSZWFkUGh5c2ljcyIsIlNoYXJlZE1lbW9yeUludGVydmFsMiIsIm1fZ3JhcGhpY3NfcmVzdWx0IiwiUmVhZEdyYXBoaWNzIiwiU2hhcmVkTWVtb3J5SW50ZXJ2YWwzIiwibV9zdGF0aWNfcmVzdWx0IiwiUmVhZFN0YXRpYyIsImRpc2Nvbm5lY3RTaGFyZWRNZW1vcnkiLCJjbG9zZU1hcHBpbmciLCJjbGVhckludGVydmFsIiwiRmlsZVBoeXNpY3NfUGF0aCIsImNyZWF0ZU1hcHBpbmciLCJyZWFkSW50byIsInJlc3BvbnNlIiwiRmlsZUdyYXBoaWNzX1BhdGgiLCJGaWxlU3RhdGljX1BhdGgiLCJfZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKj09PT0gSW1wb3J0IFNlY3Rpb24gPT09PSAqL1xyXG5pbXBvcnQgZGdyYW0gZnJvbSBcIm5vZGU6ZGdyYW1cIjtcclxuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tIFwiZXZlbnRzXCI7XHJcbmltcG9ydCBjb25zdGFudHMgZnJvbSBcIi4vY29uc3RhbnRzXCI7XHJcbmltcG9ydCBiaW51dGlscyBmcm9tIFwiYmludXRpbHNcIjtcclxuaW1wb3J0IHV0ZjggZnJvbSBcInV0ZjgtYnl0ZXNcIjtcclxuaW1wb3J0IG1vbWVudCwgeyBNb21lbnQgfSBmcm9tIFwibW9tZW50XCI7XHJcbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gXCIuL2xpYi9pc1dpbmRvd3NcIjtcclxuaW1wb3J0IEZpcnN0T3JEZWZhdWx0IGZyb20gXCIuL2xpYi9GaXJzdE9yRGVmYXVsdFwiO1xyXG5pbXBvcnQgU2luZ2xlT3JEZWZhdWx0IGZyb20gXCIuL2xpYi9TaW5nbGVPckRlZmF1bHRcIjtcclxuaW1wb3J0IFJlYWRTdHJpbmcgZnJvbSBcIi4vbGliL1JlYWRTdHJpbmdcIjtcclxuaW1wb3J0IFJlYWRMYXAgZnJvbSBcIi4vbGliL1JlYWRMYXBcIjtcclxuaW1wb3J0IFJlYWRDaGFyIGZyb20gXCIuL2xpYi9SZWFkQ2hhclwiO1xyXG5pbXBvcnQgQ2FySW5mbyBmcm9tIFwiLi9zdHJ1Y3RzL0NhckluZm9cIjtcclxuaW1wb3J0IHtcclxuICBEcml2ZXJDYXRlZ29yeSxcclxuICBDdXBDYXRlZ29yeSxcclxuICBCcm9hZGNhc3RpbmdDYXJFdmVudFR5cGUsXHJcbiAgTmF0aW9uYWxpdHlFbnVtLFxyXG4gIEFDQ19TVEFUVVMsXHJcbiAgQUNDX1NFU1NJT05fVFlQRSxcclxuICBBQ0NfRkxBR19UWVBFLFxyXG4gIEFDQ19QRU5BTFRZX1RZUEUsXHJcbiAgQUNDX1RSQUNLX0dSSVBfU1RBVFVTLFxyXG4gIEFDQ19SQUlOX0lOVEVOU0lUWSxcclxufSBmcm9tIFwiLi9lbnVtc1wiO1xyXG5cclxuaW1wb3J0IHtcclxuICBSZWFsdGltZUNhclVwZGF0ZSxcclxuICBSZWFsdGltZVVwZGF0ZSxcclxuICBSZWdpc3RyYXRpb25SZXN1bHQsXHJcbiAgQ2FySW5mb3JtYXRpb24sXHJcbiAgRW50cnlMaXN0Q2FycyxcclxuICBCcm9hZGNhc3RPcHRpb25zLFxyXG4gIEFzU2VydmVyT3B0aW9ucyxcclxuICBTaGFyZWRNZW1vcnlPcHRpb25zLFxyXG4gIE5ldHdvcmtBZGRyZXNzLFxyXG4gIFBoeXNpY3NSZXN1bHQsXHJcbiAgU3RhdGljUmVzdWx0LFxyXG4gIEdyYXBoaWNzUmVzdWx0LFxyXG4gIEJyb2FkY2FzdEV2ZW50LFxyXG59IGZyb20gXCIuL3R5cGVzXCI7XHJcblxyXG5pbXBvcnQgeyByZWdpc3RyYXRpb25SZXN1bHRQYXJzZXIgfSBmcm9tIFwiLi9zdHJ1Y3RzL1JlZ2lzdHJhdGlvblJlc3VsdFwiO1xyXG5pbXBvcnQgeyByZWFsdGltZVVwZGF0ZVBhcnNlciB9IGZyb20gXCIuL3N0cnVjdHMvUmVhbHRpbWVVcGRhdGVQYXJzZXJcIjtcclxuaW1wb3J0IHsgcmVhbHRpbWVDYXJVcGRhdGVQYXJzZXIgfSBmcm9tIFwiLi9zdHJ1Y3RzL1JlYWx0aW1lQ2FyVXBkYXRlXCI7XHJcbmltcG9ydCB7IHBoeXNpY3NQYXJzZXIgfSBmcm9tIFwiLi9zdHJ1Y3RzL1BoeXNpY3NQYXJzZXJcIjtcclxuaW1wb3J0IHsgZ3JhcGhpY3NQYXJzZXIgfSBmcm9tIFwiLi9zdHJ1Y3RzL0dyYXBoaWNzUGFyc2VyXCI7XHJcbmltcG9ydCB7IHN0YXRpY1BhcnNlciB9IGZyb20gXCIuL3N0cnVjdHMvU3RhdGljUGFyc2VyXCI7XHJcblxyXG5jb25zdCBjbGllbnQgPSBkZ3JhbS5jcmVhdGVTb2NrZXQoXCJ1ZHA0XCIpO1xyXG5cclxubGV0IE5vZGVJUEMgPSBudWxsO1xyXG5cclxuaWYgKGlzV2luZG93cygpKSB7XHJcbiAgdHJ5IHtcclxuICAgIE5vZGVJUEMgPSByZXF1aXJlKFwiQGZ5bm5peC9ub2RlLWVhc3ktaXBjXCIpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcGVyYXRpbmcgc3lzdGVtIGlzIG5vdCBjb21wYXRpYmxlLi4uXCIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIEFDQ05vZGVXcmFwcGVyIHtcclxuICAvKipcclxuICAgICAgQGV2ZW50IGBcIlJFR0lTVFJBVElPTl9SRVNVTFRcImBcclxuICAgICAgQGRlc2NyaXB0aW9uIEdldCB1cGRhdGUgb24gYSBjdXJyZW50IHNlc3Npb24uXHJcbiAgICAgICovXHJcbiAgb24oXHJcbiAgICBldmVudDogXCJSRUdJU1RSQVRJT05fUkVTVUxUXCIsXHJcbiAgICBsaXN0ZW5lcjogKGRhdGE6IFJlZ2lzdHJhdGlvblJlc3VsdCkgPT4gdm9pZFxyXG4gICk6IHRoaXM7XHJcbiAgLyoqXHJcbiAgICAgIEBldmVudCBgXCJSRUFMVElNRV9VUERBVEVcImBcclxuICAgICAgQGRlc2NyaXB0aW9uIEdldCB1cGRhdGUgb24gYSBjdXJyZW50IHNlc3Npb24uXHJcbiAgICAgICovXHJcbiAgb24oZXZlbnQ6IFwiUkVBTFRJTUVfVVBEQVRFXCIsIGxpc3RlbmVyOiAoZGF0YTogUmVhbHRpbWVVcGRhdGUpID0+IHZvaWQpOiB0aGlzO1xyXG4gIC8qKlxyXG4gICAgICBAZXZlbnQgYFwiUkVBTFRJTUVfQ0FSX1VQREFURVwiYFxyXG4gICAgICBAZGVzY3JpcHRpb24gR2V0IHVwZGF0ZSBvbiB0aGUgY2FyLlxyXG4gICAgICAqL1xyXG4gIG9uKFxyXG4gICAgZXZlbnQ6IFwiUkVBTFRJTUVfQ0FSX1VQREFURVwiLFxyXG4gICAgbGlzdGVuZXI6IChkYXRhOiBSZWFsdGltZUNhclVwZGF0ZSkgPT4gdm9pZFxyXG4gICk6IHRoaXM7XHJcbiAgLyoqXHJcbiAgICAgIEBldmVudCBgXCJFTlRSWV9MSVNUXCJgXHJcbiAgICAgIEBkZXNjcmlwdGlvbiBHZXQgdGhlIGVudHJ5IGxpc3Qgb2YgY2FycyBpbiBjdXJyZW50IHNlc3Npb24uXHJcbiAgICAgICovXHJcbiAgb24oZXZlbnQ6IFwiRU5UUllfTElTVFwiLCBsaXN0ZW5lcjogKGRhdGE6IENhckluZm9ybWF0aW9uW10pID0+IHZvaWQpOiB0aGlzO1xyXG4gIC8qKlxyXG4gICAgICBAZXZlbnQgYFwiRU5UUllfTElTVF9DQVJcImBcclxuICAgICAgQGRlc2NyaXB0aW9uIEdldCB0aGUgZW50cnkgbGlzdCBvZiBjYXJzIGluIGN1cnJlbnQgc2Vzc2lvbi5cclxuICAgICAgKi9cclxuICBvbihldmVudDogXCJFTlRSWV9MSVNUX0NBUlwiLCBsaXN0ZW5lcjogKGRhdGE6IEVudHJ5TGlzdENhcnMpID0+IHZvaWQpOiB0aGlzO1xyXG5cclxuICBvbihldmVudDogXCJCUk9BRENBU1RfRVZFTlRcIiwgbGlzdGVuZXI6IChkYXRhOiBCcm9hZGNhc3RFdmVudCkgPT4gdm9pZCk6IHRoaXM7XHJcblxyXG4gIG9uKGV2ZW50OiBcIlBIWVNJQ1NfRVZFTlRcIiwgbGlzdGVuZXI6IChkYXRhOiBQaHlzaWNzUmVzdWx0KSA9PiB2b2lkKTogdGhpcztcclxuXHJcbiAgb24oZXZlbnQ6IFwiU1RBVElDX0VWRU5UXCIsIGxpc3RlbmVyOiAoZGF0YTogU3RhdGljUmVzdWx0KSA9PiB2b2lkKTogdGhpcztcclxuXHJcbiAgb24oZXZlbnQ6IFwiR1JBUEhJQ1NfRVZFTlRcIiwgbGlzdGVuZXI6IChkYXRhOiBHcmFwaGljc1Jlc3VsdCkgPT4gdm9pZCk6IHRoaXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAgQGNsYXNzXHJcbiAqICBAbmFtZSBBQ0NfTm9kZV9XcmFwcGVyXHJcbiAqICBAY29tbWVudCBBQ0MgU0RLIGltcGxlbWVudGF0aW9uIGZvciBOb2RlLmpzLlxyXG4gKiAgQGV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQUNDTm9kZVdyYXBwZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xyXG4gIHByaXZhdGUgaXNXaW5kb3dzID0gaXNXaW5kb3dzKCk7XHJcbiAgcHJpdmF0ZSBpbnRlcnZhbElEOiBOb2RlSlMuVGltZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgU2hhcmVkTWVtb3J5SW50ZXJ2YWwxOiBOb2RlSlMuVGltZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgU2hhcmVkTWVtb3J5SW50ZXJ2YWwyOiBOb2RlSlMuVGltZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgU2hhcmVkTWVtb3J5SW50ZXJ2YWwzOiBOb2RlSlMuVGltZXIgfCBudWxsO1xyXG4gIHByaXZhdGUgbV9waHlzaWNzX2xlbmd0aDogbnVtYmVyO1xyXG4gIHByaXZhdGUgbV9waHlzaWNzX2J1ZmZlcjogQnVmZmVyO1xyXG4gIHByaXZhdGUgbV9waHlzaWNzOiBhbnk7XHJcbiAgcHJpdmF0ZSBtX2dyYXBoaWNzX2xlbmd0aDogbnVtYmVyO1xyXG4gIHByaXZhdGUgbV9ncmFwaGljc19idWZmZXI6IEJ1ZmZlcjtcclxuICBwcml2YXRlIG1fZ3JhcGhpY3M6IGFueTtcclxuICBwcml2YXRlIG1fc3RhdGljX2xlbmd0aDogbnVtYmVyO1xyXG4gIHByaXZhdGUgbV9zdGF0aWNfYnVmZmVyOiBCdWZmZXI7XHJcbiAgcHJpdmF0ZSBtX3N0YXRpYzogYW55O1xyXG4gIHByaXZhdGUgaXNTZXJ2ZXJNb2RlOiBib29sZWFuO1xyXG4gIGNsaWVudFVEUDogYW55O1xyXG4gIGZvcndhcmRPbmx5OiBib29sZWFuO1xyXG4gIG5hbWU6IHN0cmluZztcclxuICBwYXNzd29yZDogc3RyaW5nO1xyXG4gIGNtZFBhc3N3b3JkOiBzdHJpbmc7XHJcbiAgdXBkYXRlTVM6IG51bWJlcjtcclxuICBwb3J0OiBudW1iZXI7XHJcbiAgYWRkcmVzczogc3RyaW5nO1xyXG4gIGlzQ29ubmVjdGVkOiBib29sZWFuO1xyXG4gIGZvcndhcmRBZGRyZXNzZXM6IE5ldHdvcmtBZGRyZXNzW107XHJcbiAgTV9QSFlTSUNTX1VQREFURV9JTlRFUlZBTDogbnVtYmVyO1xyXG4gIE1fR1JBUEhJQ1NfVVBEQVRFX0lOVEVSVkFMOiBudW1iZXI7XHJcbiAgTV9TVEFUSUNfVVBEQVRFX0lOVEVSVkFMOiBudW1iZXI7XHJcblxyXG4gIFNFUlZFUl9ESVNQTEFZTkFNRSA9IG51bGw7XHJcbiAgU0VSVkVSX0lQID0gbnVsbDtcclxuICBTRVJWRVJfUE9SVCA9IG51bGw7XHJcbiAgU0VSVkVSX1BBU1MgPSBudWxsO1xyXG4gIFNFUlZFUl9DT01NQU5EUEFTUyA9IG51bGw7XHJcbiAgVVBEQVRFX0lOVEVSVkFMID0gbnVsbDtcclxuXHJcbiAgTG9nZ2luZyA9IGZhbHNlO1xyXG4gIExvZ2dpbmcyID0gZmFsc2U7XHJcbiAgQ29ubmVjdGlvbklkOiBudWxsIHwgbnVtYmVyID0gbnVsbDtcclxuICBsYXN0RW50cnlsaXN0UmVxdWVzdDogTW9tZW50IHwgc3RyaW5nID0gbW9tZW50KCk7XHJcbiAgX2VudHJ5TGlzdENhcnM6IENhckluZm9bXSA9IFtdO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCk7XHJcblxyXG4gICAgaWYgKHRoaXMuaXNXaW5kb3dzKSB7XHJcbiAgICAgIHRoaXMuU2hhcmVkTWVtb3J5SW50ZXJ2YWwxID0gbnVsbDtcclxuICAgICAgdGhpcy5tX3BoeXNpY3NfbGVuZ3RoID0gNzEyO1xyXG4gICAgICB0aGlzLm1fcGh5c2ljc19idWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5tX3BoeXNpY3NfbGVuZ3RoKTtcclxuICAgICAgdGhpcy5tX3BoeXNpY3MgPSBuZXcgTm9kZUlQQy5GaWxlTWFwcGluZygpO1xyXG4gICAgICB0aGlzLm1fZ3JhcGhpY3MgPSBuZXcgTm9kZUlQQy5GaWxlTWFwcGluZygpO1xyXG4gICAgICB0aGlzLm1fc3RhdGljID0gbmV3IE5vZGVJUEMuRmlsZU1hcHBpbmcoKTtcclxuICAgICAgdGhpcy5tX2dyYXBoaWNzX2xlbmd0aCA9IDE1ODA7XHJcbiAgICAgIHRoaXMubV9ncmFwaGljc19idWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5tX2dyYXBoaWNzX2xlbmd0aCk7XHJcbiAgICAgIHRoaXMubV9zdGF0aWNfbGVuZ3RoID0gODIwO1xyXG4gICAgICB0aGlzLm1fc3RhdGljX2J1ZmZlciA9IEJ1ZmZlci5hbGxvYyh0aGlzLm1fc3RhdGljX2xlbmd0aCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpbml0QXNTZXJ2ZXIob3B0aW9uczogQXNTZXJ2ZXJPcHRpb25zKSB7XHJcbiAgICB0aGlzLnJlc29sdmVBc1NlcnZlck9wdGlvbnMob3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5pbml0QnJvYWRjYXN0U0RLKG9wdGlvbnMpO1xyXG4gICAgdGhpcy5pbml0U2hhcmVkTWVtb3J5KG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgaW5pdEFzQ2xpZW50KHBvcnQ6IG51bWJlcikge1xyXG4gICAgdGhpcy5jbGllbnRVRFAgPSBkZ3JhbS5jcmVhdGVTb2NrZXQoXCJ1ZHA0XCIpO1xyXG5cclxuICAgIHRoaXMuY2xpZW50VURQLm9uKFwibWVzc2FnZVwiLCAobWVzc2FnZSkgPT4ge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmhhbmRsaW5nTWVzc2FnZShtZXNzYWdlKTtcclxuXHJcbiAgICAgIHRoaXMuZW1pdChyZXN1bHRbXCJ0eXBlXCJdLCByZXN1bHRbXCJyZXN1bHRcIl0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5jbGllbnRVRFAuYmluZChwb3J0KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGluaXRCcm9hZGNhc3RTREtcclxuICAgKiBAY29tbWVudCBUaGlzIGlzIHRoZSBpbml0IGZ1bmN0aW9uIGZvciB0aGUgQUNDIE5vZGUgV3JhcHBlci4gVGhpcyBpbml0cyB0aGUgQnJvYWRjYXN0IFNESy5cclxuICAgKiBAcGFyYW0gb3B0aW9ucyBAc2VlIEJyb2FkY2FzdE9wdGlvbnMgXHJcbiAgXHJcbiAgICovXHJcbiAgaW5pdEJyb2FkY2FzdFNESyhvcHRpb25zOiBCcm9hZGNhc3RPcHRpb25zKSB7XHJcbiAgICB0aGlzLnJlc29sdmVCcm9hZGNhc3RPcHRpb25zKG9wdGlvbnMpO1xyXG5cclxuICAgIGNsaWVudC5vbihcIm1lc3NhZ2VcIiwgKG1lc3NhZ2UsIHVkcF9pbmZvKSA9PiB7XHJcbiAgICAgIGlmICh0aGlzLmlzU2VydmVyTW9kZSkgdGhpcy5icmlkZ2VNZXNzYWdlKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgaWYgKHRoaXMuZm9yd2FyZE9ubHkpIHJldHVybjtcclxuICAgICAgLyo9PT09IEhhbmRsaW5nIE1lc3NhZ2UgPT09PSovXHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuaGFuZGxpbmdNZXNzYWdlKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgdGhpcy5lbWl0KHJlc3VsdFtcInR5cGVcIl0sIHJlc3VsdFtcInJlc3VsdFwiXSk7XHJcblxyXG4gICAgICAvKj09PT0gTG9nZ2luZyBNZXNzYWdlID09PT0qL1xyXG4gICAgICBpZiAodGhpcy5Mb2dnaW5nKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0gQUNDIE5vZGUgV3JhcHBlciA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0gVURQIE1lc3NhZ2UgU3RhcnQgPT09XCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiSW5mbzogUmVjZWl2aW5nIGEgTWVzc2FnZS5cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coYEZyb206ICR7dWRwX2luZm8uYWRkcmVzc30sICR7dWRwX2luZm8ucG9ydH1gKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgTWVzc2FnZTogJHtKU09OLnN0cmluZ2lmeShyZXN1bHQpfWApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IFVEUCBNZXNzYWdlIEVuZCA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJcIik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8qPT09PSBTdGFydCBDb25uZWN0aW9uID09PT0qL1xyXG4gICAgdGhpcy5SZXF1ZXN0Q29ubmVjdGlvbigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGNvbW1lbnQgVGhpcyBpcyBoYW5kbGluZyB0aGUgZXJyb3JzLlxyXG4gICAqIEBwYXJhbSBlcnJcclxuICAgKi9cclxuICBoYW5kbGVFcnJvciA9IChlcnIpID0+IHtcclxuICAgIGlmIChlcnIpIHtcclxuICAgICAgY29uc29sZS5sb2coXCI9PT0gQUNDIE5vZGUgV3JhcHBlciA9PT1cIik7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiPT09IFVEUCBFcnJvciBTdGFydCA9PT1cIik7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgY29uc29sZS5sb2coXCI9PT0gVURQIEVycm9yIEVuZCA9PT1cIik7XHJcbiAgICAgIGNvbnNvbGUubG9nKFwiXCIpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHByaXZhdGUgcmVzb2x2ZUFzU2VydmVyT3B0aW9ucyhvcHRpb25zOiBBc1NlcnZlck9wdGlvbnMpIHtcclxuICAgIHRoaXMuaXNTZXJ2ZXJNb2RlID0gdHJ1ZTtcclxuXHJcbiAgICBjb25zdCB7IGZvcndhcmRPbmx5LCBmb3J3YXJkQWRkcmVzc2VzIH0gPSBvcHRpb25zO1xyXG5cclxuICAgIHRoaXMuZm9yd2FyZE9ubHkgPSBmb3J3YXJkT25seSB8fCBmYWxzZTtcclxuICAgIHRoaXMuZm9yd2FyZEFkZHJlc3NlcyA9IGZvcndhcmRBZGRyZXNzZXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc29sdmVCcm9hZGNhc3RPcHRpb25zKG9wdGlvbnM6IEJyb2FkY2FzdE9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHsgcG9ydCwgY21kUGFzc3dvcmQsIHBhc3N3b3JkLCBhZGRyZXNzLCB1cGRhdGVNUywgbmFtZSwgbG9nZ2luZyB9ID1cclxuICAgICAgb3B0aW9ucztcclxuXHJcbiAgICB0aGlzLlNFUlZFUl9ESVNQTEFZTkFNRSA9IG5hbWU7XHJcbiAgICB0aGlzLlNFUlZFUl9QQVNTID0gcGFzc3dvcmQ7XHJcbiAgICB0aGlzLlNFUlZFUl9QT1JUID0gcG9ydCB8fCA5MDAwO1xyXG4gICAgdGhpcy5TRVJWRVJfQ09NTUFORFBBU1MgPSBjbWRQYXNzd29yZCB8fCBcIlwiO1xyXG4gICAgdGhpcy5TRVJWRVJfSVAgPSBhZGRyZXNzIHx8IFwibG9jYWxob3N0XCI7XHJcbiAgICB0aGlzLlVQREFURV9JTlRFUlZBTCA9IHVwZGF0ZU1TIHx8IDI1MDtcclxuICAgIHRoaXMuTG9nZ2luZyA9IGxvZ2dpbmcgfHwgZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHJlc29sdmVTaGFyZWRNZW1PcHRpb25zKG9wdGlvbnM6IFNoYXJlZE1lbW9yeU9wdGlvbnMpIHtcclxuICAgIGNvbnN0IHsgZ3JhcGhpY3NVcGRhdGVJbnQsIHN0YXRpY1VwZGF0ZUludCwgcGh5c2ljc1VwZGF0ZUludCwgbG9nZ2luZyB9ID1cclxuICAgICAgb3B0aW9ucztcclxuXHJcbiAgICB0aGlzLk1fR1JBUEhJQ1NfVVBEQVRFX0lOVEVSVkFMID0gZ3JhcGhpY3NVcGRhdGVJbnQgfHwgMjUwO1xyXG4gICAgdGhpcy5NX1NUQVRJQ19VUERBVEVfSU5URVJWQUwgPSBzdGF0aWNVcGRhdGVJbnQgfHwgMjUwO1xyXG4gICAgdGhpcy5NX1BIWVNJQ1NfVVBEQVRFX0lOVEVSVkFMID0gcGh5c2ljc1VwZGF0ZUludCB8fCAyNTA7XHJcbiAgICB0aGlzLkxvZ2dpbmcyID0gbG9nZ2luZztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIGhhbmRsaW5nTWVzc2FnZVxyXG4gICAqIEBjb21tZW50IFRoaXMgaXMgdGhlIGFyZWEgd2hlcmUgdGhlIGluY29taW5nIFVEUCBtZXNzYWdlcyBhcmUgcHJvY2Vzc2VkLlxyXG4gICAqIEBwYXJhbSBtZXNzYWdlXHJcbiAgICogQHJldHVybnMge3tyZXN1bHQ6IHt9LCB0eXBlOiAoKnxudW1iZXIpfX1cclxuICAgKi9cclxuXHJcbiAgaGFuZGxpbmdNZXNzYWdlID0gKG1lc3NhZ2U6IEJ1ZmZlcik6IHsgcmVzdWx0OiB7fTsgdHlwZTogYW55IHwgbnVtYmVyIH0gPT4ge1xyXG4gICAgY29uc3QgcmVhZGVyID0gbmV3IGJpbnV0aWxzLkJpbmFyeVJlYWRlcihtZXNzYWdlLCBcImxpdHRsZVwiKTtcclxuICAgIGNvbnN0IG1lc3NhZ2VUeXBlID0gcmVhZGVyLlJlYWRVSW50OCgpO1xyXG5cclxuICAgIGxldCByZXN1bHQ6IFJlZ2lzdHJhdGlvblJlc3VsdCB8IFJlYWx0aW1lVXBkYXRlIHwgYW55ID0ge307XHJcblxyXG4gICAgc3dpdGNoIChtZXNzYWdlVHlwZSkge1xyXG4gICAgICBjYXNlIGNvbnN0YW50cy5JbmJvdW5kTWVzc2FnZVR5cGVzLlJFR0lTVFJBVElPTl9SRVNVTFQ6XHJcbiAgICAgICAgdGhpcy5Db25uZWN0aW9uSWQgPSByZWFkZXIuUmVhZEludDMyKCk7XHJcbiAgICAgICAgcmVzdWx0ID0gcmVnaXN0cmF0aW9uUmVzdWx0UGFyc2VyKHJlYWRlciwgdGhpcy5Db25uZWN0aW9uSWQpO1xyXG4gICAgICAgIHRoaXMuUmVxdWVzdEVudHJ5TGlzdCgpO1xyXG4gICAgICAgIHRoaXMuUmVxdWVzdFRyYWNrRGF0YSgpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBjb25zdGFudHMuSW5ib3VuZE1lc3NhZ2VUeXBlcy5SRUFMVElNRV9VUERBVEU6XHJcbiAgICAgICAgcmVzdWx0ID0gcmVhbHRpbWVVcGRhdGVQYXJzZXIocmVhZGVyKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXMuUkVBTFRJTUVfQ0FSX1VQREFURTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZXN1bHQgPSByZWFsdGltZUNhclVwZGF0ZVBhcnNlcihyZWFkZXIpO1xyXG5cclxuICAgICAgICAgIGNvbnN0IGNhckVudHJ5ID0gRmlyc3RPckRlZmF1bHQoXHJcbiAgICAgICAgICAgIHRoaXMuX2VudHJ5TGlzdENhcnMsXHJcbiAgICAgICAgICAgICh2YWx1ZSkgPT4gdmFsdWUuQ2FySW5kZXggPT09IHJlc3VsdC5DYXJJbmRleFxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIGNhckVudHJ5ID09PSBudWxsIHx8XHJcbiAgICAgICAgICAgIHRoaXMuX2VudHJ5TGlzdENhcnNbY2FyRW50cnldLkRyaXZlcnMubGVuZ3RoICE9PSByZXN1bHQuRHJpdmVyQ291bnRcclxuICAgICAgICAgIClcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgIHBhcnNlSW50KG1vbWVudCgpLmZvcm1hdChcInhcIikpIC1cclxuICAgICAgICAgICAgICAgIHBhcnNlSW50KHRoaXMubGFzdEVudHJ5bGlzdFJlcXVlc3QgYXMgc3RyaW5nKSA+XHJcbiAgICAgICAgICAgICAgMTAwMFxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICB0aGlzLmxhc3RFbnRyeWxpc3RSZXF1ZXN0ID0gbW9tZW50KCkuZm9ybWF0KFwieFwiKTtcclxuICAgICAgICAgICAgICB0aGlzLlJlcXVlc3RFbnRyeUxpc3QoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXMuRU5UUllfTElTVDpcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aGlzLl9lbnRyeUxpc3RDYXJzID0gW107XHJcbiAgICAgICAgICByZXN1bHQuY29ubmVjdGlvbklkID0gcmVhZGVyLlJlYWRJbnQzMigpO1xyXG4gICAgICAgICAgY29uc3QgY2FyRW50cnlDb3VudCA9IHJlYWRlci5SZWFkVUludDE2KCk7XHJcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhckVudHJ5Q291bnQ7IGkrKylcclxuICAgICAgICAgICAgdGhpcy5fZW50cnlMaXN0Q2Fycy5wdXNoKG5ldyBDYXJJbmZvKHJlYWRlci5SZWFkVUludDE2KCkpKTtcclxuXHJcbiAgICAgICAgICByZXN1bHQuX2VudHJ5TGlzdENhcnMgPSB0aGlzLl9lbnRyeUxpc3RDYXJzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXMuVFJBQ0tfREFUQTpcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZXN1bHQuY29ubmVjdGlvbklkID0gcmVhZGVyLlJlYWRJbnQzMigpO1xyXG5cclxuICAgICAgICAgIHJlc3VsdC5UcmFja05hbWUgPSBSZWFkU3RyaW5nKHJlYWRlcik7XHJcbiAgICAgICAgICByZXN1bHQuVHJhY2tJZCA9IHJlYWRlci5SZWFkSW50MzIoKTtcclxuICAgICAgICAgIGNvbnN0IFRyYWNrTWV0ZXJzID0gcmVhZGVyLlJlYWRJbnQzMigpO1xyXG4gICAgICAgICAgcmVzdWx0LlRyYWNrTWV0ZXJzID0gVHJhY2tNZXRlcnMgPiAwID8gVHJhY2tNZXRlcnMgOiAtMTtcclxuXHJcbiAgICAgICAgICByZXN1bHQuQ2FtZXJhU2V0cyA9IFtdO1xyXG4gICAgICAgICAgY29uc3QgY2FtZXJhU2V0Q291bnQgPSByZWFkZXIuUmVhZEJ5dGVzKDEpLnJlYWRVSW50OCgwKTtcclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FtZXJhU2V0Q291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBjYW1lcmFzOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBjYW1TZXROYW1lID0gUmVhZFN0cmluZyhyZWFkZXIpO1xyXG4gICAgICAgICAgICBjb25zdCBjYW1lcmFDb3VudCA9IHJlYWRlci5SZWFkQnl0ZXMoMSkucmVhZFVJbnQ4KDApO1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjYW1lcmFDb3VudDsgaisrKVxyXG4gICAgICAgICAgICAgIGNhbWVyYXMucHVzaChSZWFkU3RyaW5nKHJlYWRlcikpO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0LkNhbWVyYVNldHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgbmFtZTogY2FtU2V0TmFtZSxcclxuICAgICAgICAgICAgICBjYW1lcmFzLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXN1bHQuSFVEUGFnZXMgPSBbXTtcclxuICAgICAgICAgIGNvbnN0IGh1ZFBhZ2VzQ291bnQgPSByZWFkZXIuUmVhZEJ5dGVzKDEpLnJlYWRVSW50OCgwKTtcclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaHVkUGFnZXNDb3VudDsgaSsrKVxyXG4gICAgICAgICAgICByZXN1bHQuSFVEUGFnZXMucHVzaChSZWFkU3RyaW5nKHJlYWRlcikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXMuRU5UUllfTElTVF9DQVI6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgY29uc3QgY2FySWQgPSByZWFkZXIuUmVhZFVJbnQxNigpO1xyXG4gICAgICAgICAgY29uc3QgY2FySW5mbyA9IFNpbmdsZU9yRGVmYXVsdChcclxuICAgICAgICAgICAgdGhpcy5fZW50cnlMaXN0Q2FycyxcclxuICAgICAgICAgICAgKHZhbHVlKSA9PiB2YWx1ZS5DYXJJbmRleCA9PT0gY2FySWRcclxuICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgaWYgKGNhckluZm8gPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmVzdWx0LmVyciA9IGBFbnRyeSBsaXN0IHVwZGF0ZSBmb3IgdW5rbm93biBjYXJJbmRleCAke2NhcklkfWA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRoaXMuX2VudHJ5TGlzdENhcnNbY2FySW5mb10uQ2FyTW9kZWxUeXBlID0gcmVhZGVyXHJcbiAgICAgICAgICAgIC5SZWFkQnl0ZXMoMSlcclxuICAgICAgICAgICAgLnJlYWRVSW50OCgwKTtcclxuICAgICAgICAgIHRoaXMuX2VudHJ5TGlzdENhcnNbY2FySW5mb10uVGVhbU5hbWUgPSBSZWFkU3RyaW5nKHJlYWRlcik7XHJcbiAgICAgICAgICB0aGlzLl9lbnRyeUxpc3RDYXJzW2NhckluZm9dLlJhY2VOdW1iZXIgPSByZWFkZXIuUmVhZEludDMyKCk7XHJcbiAgICAgICAgICB0aGlzLl9lbnRyeUxpc3RDYXJzW2NhckluZm9dLkN1cENhdGVnb3J5ID0gbmV3IEN1cENhdGVnb3J5KClbXHJcbiAgICAgICAgICAgIHJlYWRlci5SZWFkQnl0ZXMoMSkucmVhZFVJbnQ4KDApLnRvU3RyaW5nKClcclxuICAgICAgICAgIF07XHJcbiAgICAgICAgICB0aGlzLl9lbnRyeUxpc3RDYXJzW2NhckluZm9dLkN1cnJlbnREcml2ZXJJbmRleCA9IHJlYWRlclxyXG4gICAgICAgICAgICAuUmVhZEJ5dGVzKDEpXHJcbiAgICAgICAgICAgIC5yZWFkVUludDgoMCk7XHJcbiAgICAgICAgICB0aGlzLl9lbnRyeUxpc3RDYXJzW2NhckluZm9dLk5hdGlvbmFsaXR5ID0gbmV3IE5hdGlvbmFsaXR5RW51bSgpW1xyXG4gICAgICAgICAgICByZWFkZXIuUmVhZFVJbnQxNigpLnRvU3RyaW5nKClcclxuICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgY29uc3QgZHJpdmVyc09uQ2FyQ291bnQgPSByZWFkZXIuUmVhZEJ5dGVzKDEpLnJlYWRVSW50OCgwKTtcclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHJpdmVyc09uQ2FyQ291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBjb25zdCBEcml2ZXJJbmZvID0ge1xyXG4gICAgICAgICAgICAgIEZpcnN0TmFtZTogUmVhZFN0cmluZyhyZWFkZXIpLFxyXG4gICAgICAgICAgICAgIExhc3ROYW1lOiBSZWFkU3RyaW5nKHJlYWRlciksXHJcbiAgICAgICAgICAgICAgU2hvcnROYW1lOiBSZWFkU3RyaW5nKHJlYWRlciksXHJcbiAgICAgICAgICAgICAgQ2F0ZWdvcnk6IG5ldyBEcml2ZXJDYXRlZ29yeSgpW1xyXG4gICAgICAgICAgICAgICAgcmVhZGVyLlJlYWRCeXRlcygxKS5yZWFkVUludDgoMCkudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgTmF0aW9uYWxpdHk6IG5ldyBOYXRpb25hbGl0eUVudW0oKVtcclxuICAgICAgICAgICAgICAgIHJlYWRlci5SZWFkVUludDE2KCkudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9lbnRyeUxpc3RDYXJzW2NhckluZm9dLkRyaXZlcnMucHVzaChEcml2ZXJJbmZvKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLl9lbnRyeUxpc3RDYXJzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXMuQlJPQURDQVNUSU5HX0VWRU5UOlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHJlc3VsdC5UeXBlID0gbmV3IEJyb2FkY2FzdGluZ0NhckV2ZW50VHlwZSgpW1xyXG4gICAgICAgICAgICByZWFkZXIuUmVhZEJ5dGVzKDEpLnJlYWRVSW50OCgwKS50b1N0cmluZygpXHJcbiAgICAgICAgICBdO1xyXG4gICAgICAgICAgcmVzdWx0Lk1zZyA9IFJlYWRTdHJpbmcocmVhZGVyKTtcclxuICAgICAgICAgIHJlc3VsdC5UaW1lTXMgPSByZWFkZXIuUmVhZEludDMyKCk7XHJcbiAgICAgICAgICByZXN1bHQuQ2FySWQgPSByZWFkZXIuUmVhZEludDMyKCk7XHJcbiAgICAgICAgICByZXN1bHQuQ2FyRGF0YSA9XHJcbiAgICAgICAgICAgIHRoaXMuX2VudHJ5TGlzdENhcnNbXHJcbiAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgIEZpcnN0T3JEZWZhdWx0KFxyXG4gICAgICAgICAgICAgICAgdGhpcy5fZW50cnlMaXN0Q2FycyxcclxuICAgICAgICAgICAgICAgICh2YWx1ZSkgPT4gdmFsdWUuQ2FySW5kZXggPT09IHJlc3VsdC5DYXJJZFxyXG4gICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIGNvbnN0YW50cy5JbmJvdW5kTWVzc2FnZVR5cGVzLlBIWVNJQ1NfRVZFTlQ6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVzdWx0ID0gcGh5c2ljc1BhcnNlcihyZWFkZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXMuR1JBUEhJQ1NfRVZFTlQ6XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgcmVzdWx0ID0gZ3JhcGhpY3NQYXJzZXIocmVhZGVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlIGNvbnN0YW50cy5JbmJvdW5kTWVzc2FnZVR5cGVzLlNUQVRJQ19FVkVOVDpcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZXN1bHQgPSBzdGF0aWNQYXJzZXIocmVhZGVyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHJlc3VsdC5lcnIgPSBcIlR5cGUgbm90IHJlY29nbml6ZWQhXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6XHJcbiAgICAgICAgY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXNTdHJbbWVzc2FnZVR5cGVdICE9PSB1bmRlZmluZWRcclxuICAgICAgICAgID8gY29uc3RhbnRzLkluYm91bmRNZXNzYWdlVHlwZXNTdHJbbWVzc2FnZVR5cGVdXHJcbiAgICAgICAgICA6IG1lc3NhZ2VUeXBlLFxyXG4gICAgICByZXN1bHQsXHJcbiAgICB9O1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIFJlcXVlc3RDb25uZWN0aW9uXHJcbiAgICogQGNvbW1lbnQgVGhpcyBmdW5jdGlvbiBjcmVhdGVzIHRoZSBjb25uZWN0aW9uLlxyXG4gICAqL1xyXG4gIFJlcXVlc3RDb25uZWN0aW9uID0gKCkgPT4ge1xyXG4gICAgY29uc3QgU0VSVkVSX0RJU1BMQVlOQU1FX0FSUiA9IHV0ZjgodGhpcy5TRVJWRVJfRElTUExBWU5BTUUpO1xyXG4gICAgY29uc3QgU0VSVkVSX1BBU1NfQVJSID0gdXRmOCh0aGlzLlNFUlZFUl9QQVNTKTtcclxuICAgIGNvbnN0IFNFUlZFUl9DT01NQU5EUEFTU19BUlIgPSB1dGY4KHRoaXMuU0VSVkVSX0NPTU1BTkRQQVNTKTtcclxuXHJcbiAgICBjb25zdCB3cml0ZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5V3JpdGVyKFwibGl0dGxlXCIpO1xyXG5cclxuICAgIHdyaXRlci5Xcml0ZUJ5dGVzKFtcclxuICAgICAgY29uc3RhbnRzLm91dGJvdW5kTWVzc2FnZVR5cGVzLlJFR0lTVEVSX0NPTU1BTkRfQVBQTElDQVRJT04sXHJcbiAgICBdKTtcclxuXHJcbiAgICB3cml0ZXIuV3JpdGVCeXRlcyhbXHJcbiAgICAgIGNvbnN0YW50cy5icm9hZGNhc3RpbmdOZXR3b3JrUHJvdG9jb2wuQlJPQURDQVNUSU5HX1BST1RPQ09MX1ZFUlNJT04sXHJcbiAgICBdKTtcclxuXHJcbiAgICB3cml0ZXIuV3JpdGVVSW50MTYoU0VSVkVSX0RJU1BMQVlOQU1FX0FSUi5sZW5ndGgpO1xyXG4gICAgd3JpdGVyLldyaXRlQnl0ZXMoU0VSVkVSX0RJU1BMQVlOQU1FX0FSUik7XHJcbiAgICB3cml0ZXIuV3JpdGVVSW50MTYoU0VSVkVSX1BBU1NfQVJSLmxlbmd0aCk7XHJcbiAgICB3cml0ZXIuV3JpdGVCeXRlcyhTRVJWRVJfUEFTU19BUlIpO1xyXG4gICAgd3JpdGVyLldyaXRlVUludDMyKHRoaXMuVVBEQVRFX0lOVEVSVkFMKTtcclxuICAgIHdyaXRlci5Xcml0ZVVJbnQxNihTRVJWRVJfQ09NTUFORFBBU1NfQVJSLmxlbmd0aCk7XHJcbiAgICB3cml0ZXIuV3JpdGVCeXRlcyhTRVJWRVJfQ09NTUFORFBBU1NfQVJSKTtcclxuXHJcbiAgICBjb25zdCBjb25uZWN0aW9uID0gd3JpdGVyLkJ5dGVCdWZmZXI7XHJcblxyXG4gICAgY2xpZW50LnNlbmQoXHJcbiAgICAgIGNvbm5lY3Rpb24sXHJcbiAgICAgIDAsXHJcbiAgICAgIGNvbm5lY3Rpb24ubGVuZ3RoLFxyXG4gICAgICB0aGlzLlNFUlZFUl9QT1JULFxyXG4gICAgICB0aGlzLlNFUlZFUl9JUCxcclxuICAgICAgdGhpcy5oYW5kbGVFcnJvclxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBEaXNjb25uZWN0XHJcbiAgICogQGNvbW1lbnQgVGhpcyBmdW5jdGlvbiBkaXNjb25uZWN0cyB0aGUgY29ubmVjdGlvbi5cclxuICAgKi9cclxuICBEaXNjb25uZWN0ID0gKCkgPT4ge1xyXG4gICAgY29uc3Qgd3JpdGVyID0gbmV3IGJpbnV0aWxzLkJpbmFyeVdyaXRlcihcImxpdHRsZVwiKTtcclxuICAgIHdyaXRlci5Xcml0ZUJ5dGVzKFtcclxuICAgICAgY29uc3RhbnRzLm91dGJvdW5kTWVzc2FnZVR5cGVzLlVOUkVHSVNURVJfQ09NTUFORF9BUFBMSUNBVElPTixcclxuICAgIF0pO1xyXG4gICAgd3JpdGVyLldyaXRlVUludDMyKHRoaXMuQ29ubmVjdGlvbklkKTtcclxuXHJcbiAgICBjb25zdCBkaXNjb25uZWN0ID0gd3JpdGVyLkJ5dGVCdWZmZXI7XHJcblxyXG4gICAgY2xpZW50LnNlbmQoXHJcbiAgICAgIGRpc2Nvbm5lY3QsXHJcbiAgICAgIDAsXHJcbiAgICAgIGRpc2Nvbm5lY3QubGVuZ3RoLFxyXG4gICAgICB0aGlzLlNFUlZFUl9QT1JULFxyXG4gICAgICB0aGlzLlNFUlZFUl9JUCxcclxuICAgICAgdGhpcy5oYW5kbGVFcnJvclxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBSZXF1ZXN0RW50cnlMaXN0XHJcbiAgICogQGNvbW1lbnQgVGhpcyBmdW5jdGlvbiByZXF1ZXN0IHRoZSBlbnRyeSBsaXN0LlxyXG4gICAqL1xyXG4gIFJlcXVlc3RFbnRyeUxpc3QgPSAoKSA9PiB7XHJcbiAgICBjb25zdCB3cml0ZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5V3JpdGVyKFwibGl0dGxlXCIpO1xyXG4gICAgd3JpdGVyLldyaXRlQnl0ZXMoW2NvbnN0YW50cy5vdXRib3VuZE1lc3NhZ2VUeXBlcy5SRVFVRVNUX0VOVFJZX0xJU1RdKTtcclxuICAgIHdyaXRlci5Xcml0ZVVJbnQzMih0aGlzLkNvbm5lY3Rpb25JZCk7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IHdyaXRlci5CeXRlQnVmZmVyO1xyXG4gICAgY2xpZW50LnNlbmQoXHJcbiAgICAgIHJlcXVlc3QsXHJcbiAgICAgIDAsXHJcbiAgICAgIHJlcXVlc3QubGVuZ3RoLFxyXG4gICAgICB0aGlzLlNFUlZFUl9QT1JULFxyXG4gICAgICB0aGlzLlNFUlZFUl9JUCxcclxuICAgICAgdGhpcy5oYW5kbGVFcnJvclxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBSZXF1ZXN0VHJhY2tEYXRhXHJcbiAgICogQGNvbW1lbnQgVGhpcyBmdW5jdGlvbiByZXF1ZXN0IHRoZSB0cmFjayBkYXRhLlxyXG4gICAqL1xyXG4gIFJlcXVlc3RUcmFja0RhdGEgPSAoKSA9PiB7XHJcbiAgICBjb25zdCB3cml0ZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5V3JpdGVyKFwibGl0dGxlXCIpO1xyXG4gICAgd3JpdGVyLldyaXRlQnl0ZXMoW2NvbnN0YW50cy5vdXRib3VuZE1lc3NhZ2VUeXBlcy5SRVFVRVNUX1RSQUNLX0RBVEFdKTtcclxuICAgIHdyaXRlci5Xcml0ZVVJbnQzMih0aGlzLkNvbm5lY3Rpb25JZCk7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IHdyaXRlci5CeXRlQnVmZmVyO1xyXG4gICAgY2xpZW50LnNlbmQoXHJcbiAgICAgIHJlcXVlc3QsXHJcbiAgICAgIDAsXHJcbiAgICAgIHJlcXVlc3QubGVuZ3RoLFxyXG4gICAgICB0aGlzLlNFUlZFUl9QT1JULFxyXG4gICAgICB0aGlzLlNFUlZFUl9JUCxcclxuICAgICAgdGhpcy5oYW5kbGVFcnJvclxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBTZXRGb2N1c1xyXG4gICAqIEBjb21tZW50IFRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgZm9jdXMgb2YgdGhlIGNhbWVyYS5cclxuICAgKi9cclxuICBTZXRGb2N1cyA9IChjYXJJbmRleCwgY2FtZXJhU2V0LCBjYW1lcmEpID0+IHtcclxuICAgIHRoaXMuU2V0Rm9jdXNJbnRlcm5hbChjYXJJbmRleCwgY2FtZXJhU2V0LCBjYW1lcmEpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIFNldENhbWVyYVxyXG4gICAqIEBjb21tZW50IFRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgYWN0aXZlIGNhbWVyYS5cclxuICAgKi9cclxuICBTZXRDYW1lcmEgPSAoY2FtZXJhU2V0LCBjYW1lcmEpID0+IHtcclxuICAgIHRoaXMuU2V0Rm9jdXNJbnRlcm5hbChudWxsLCBjYW1lcmFTZXQsIGNhbWVyYSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgU2V0Rm9jdXNJbnRlcm5hbFxyXG4gICAqIEBjb21tZW50IFRoaXMgZnVuY3Rpb24gaXMgdGhlIG1haW4gcGFydCBmb3IgdGhlIFNldEZvY3VzIGFuZCBTZXRDYW1lcmEgZnVuY3Rpb24uXHJcbiAgICovXHJcbiAgU2V0Rm9jdXNJbnRlcm5hbCA9IChjYXJJbmRleCwgY2FtZXJhU2V0LCBjYW1lcmEpID0+IHtcclxuICAgIGNvbnN0IHdyaXRlciA9IG5ldyBiaW51dGlscy5CaW5hcnlXcml0ZXIoXCJsaXR0bGVcIik7XHJcbiAgICB3cml0ZXIuV3JpdGVCeXRlcyhbY29uc3RhbnRzLm91dGJvdW5kTWVzc2FnZVR5cGVzLkNIQU5HRV9GT0NVU10pO1xyXG4gICAgd3JpdGVyLldyaXRlVUludDMyKHRoaXMuQ29ubmVjdGlvbklkKTtcclxuXHJcbiAgICBpZiAoY2FySW5kZXggPT09IG51bGwpIHdyaXRlci5Xcml0ZUJ5dGVzKFswXSk7XHJcbiAgICBlbHNlIHtcclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXMoWzFdKTtcclxuICAgICAgd3JpdGVyLldyaXRlVUludDE2KGNhckluZGV4KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoXHJcbiAgICAgIGNhbWVyYVNldCA9PT0gbnVsbCB8fFxyXG4gICAgICBjYW1lcmFTZXQgPT09IHVuZGVmaW5lZCB8fFxyXG4gICAgICBjYW1lcmEgPT09IG51bGwgfHxcclxuICAgICAgY2FtZXJhID09PSB1bmRlZmluZWRcclxuICAgIClcclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXMoWzBdKTtcclxuICAgIGVsc2Uge1xyXG4gICAgICB3cml0ZXIuV3JpdGVCeXRlcyhbMV0pO1xyXG4gICAgICBjb25zdCBjU2V0ID0gdXRmOChjYW1lcmFTZXQpO1xyXG4gICAgICB3cml0ZXIuV3JpdGVVSW50MTYoY1NldC5sZW5ndGgpO1xyXG4gICAgICB3cml0ZXIuV3JpdGVCeXRlcyhjU2V0KTtcclxuICAgICAgY29uc3QgYyA9IHV0ZjgoY2FtZXJhKTtcclxuICAgICAgd3JpdGVyLldyaXRlVUludDE2KGMubGVuZ3RoKTtcclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXMoYyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IHdyaXRlci5CeXRlQnVmZmVyO1xyXG5cclxuICAgIGNsaWVudC5zZW5kKFxyXG4gICAgICByZXF1ZXN0LFxyXG4gICAgICAwLFxyXG4gICAgICByZXF1ZXN0Lmxlbmd0aCxcclxuICAgICAgdGhpcy5TRVJWRVJfUE9SVCxcclxuICAgICAgdGhpcy5TRVJWRVJfSVAsXHJcbiAgICAgIHRoaXMuaGFuZGxlRXJyb3JcclxuICAgICk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgUmVxdWVzdEluc3RhbnRSZXBsYXlcclxuICAgKiBAY29tbWVudCBUaGlzIGZ1bmN0aW9uIGlzIHJlcXVlc3RpbmcgaW5zdGFudCByZXBsYXkuXHJcbiAgICovXHJcbiAgUmVxdWVzdEluc3RhbnRSZXBsYXkgPSAoXHJcbiAgICBzdGFydFNlc3Npb25UaW1lLFxyXG4gICAgZHVyYXRpb25NUyxcclxuICAgIGluaXRpYWxGb2N1c2VkQ2FySW5kZXgsXHJcbiAgICBpbml0aWFsQ2FtZXJhU2V0LFxyXG4gICAgaW5pdGlhbENhbWVyYVxyXG4gICkgPT4ge1xyXG4gICAgY29uc3Qgd3JpdGVyID0gbmV3IGJpbnV0aWxzLkJpbmFyeVdyaXRlcihcImxpdHRsZVwiKTtcclxuICAgIHdyaXRlci5Xcml0ZUJ5dGVzKFtjb25zdGFudHMub3V0Ym91bmRNZXNzYWdlVHlwZXMuSU5TVEFOVF9SRVBMQVlfUkVRVUVTVF0pO1xyXG4gICAgd3JpdGVyLldyaXRlVUludDMyKHRoaXMuQ29ubmVjdGlvbklkKTtcclxuXHJcbiAgICB3cml0ZXIuV3JpdGVGbG9hdChzdGFydFNlc3Npb25UaW1lKTtcclxuICAgIHdyaXRlci5Xcml0ZUZsb2F0KGR1cmF0aW9uTVMpO1xyXG4gICAgd3JpdGVyLldyaXRlSW50MzIoaW5pdGlhbEZvY3VzZWRDYXJJbmRleCB8fCAtMSk7XHJcblxyXG4gICAgY29uc3QgY2FtZXJhU2V0ID0gdXRmOChpbml0aWFsQ2FtZXJhU2V0IHx8IFwiXCIpO1xyXG4gICAgd3JpdGVyLldyaXRlVUludDE2KGNhbWVyYVNldC5sZW5ndGgpO1xyXG4gICAgd3JpdGVyLldyaXRlQnl0ZXMoY2FtZXJhU2V0KTtcclxuICAgIGNvbnN0IGNhbWVyYSA9IHV0ZjgoaW5pdGlhbENhbWVyYSB8fCBcIlwiKTtcclxuICAgIHdyaXRlci5Xcml0ZVVJbnQxNihjYW1lcmEubGVuZ3RoKTtcclxuICAgIHdyaXRlci5Xcml0ZUJ5dGVzKGNhbWVyYSk7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IHdyaXRlci5CeXRlQnVmZmVyO1xyXG4gICAgY2xpZW50LnNlbmQoXHJcbiAgICAgIHJlcXVlc3QsXHJcbiAgICAgIDAsXHJcbiAgICAgIHJlcXVlc3QubGVuZ3RoLFxyXG4gICAgICB0aGlzLlNFUlZFUl9QT1JULFxyXG4gICAgICB0aGlzLlNFUlZFUl9JUCxcclxuICAgICAgdGhpcy5oYW5kbGVFcnJvclxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBSZXF1ZXN0SFVEUGFnZVxyXG4gICAqIEBjb21tZW50IFRoaXMgZnVuY3Rpb24gaXMgcmVxdWVzdGluZyBhIEhVRCBQYWdlIGNoYW5nZS5cclxuICAgKi9cclxuICBSZXF1ZXN0SFVEUGFnZSA9IChodWRQYWdlKSA9PiB7XHJcbiAgICBjb25zdCB3cml0ZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5V3JpdGVyKFwibGl0dGxlXCIpO1xyXG4gICAgd3JpdGVyLldyaXRlQnl0ZXMoW2NvbnN0YW50cy5vdXRib3VuZE1lc3NhZ2VUeXBlcy5DSEFOR0VfSFVEX1BBR0VdKTtcclxuICAgIHdyaXRlci5Xcml0ZVVJbnQzMih0aGlzLkNvbm5lY3Rpb25JZCk7XHJcblxyXG4gICAgY29uc3QgcGFnZSA9IHV0ZjgoaHVkUGFnZSk7XHJcbiAgICB3cml0ZXIuV3JpdGVVSW50MTYocGFnZS5sZW5ndGgpO1xyXG4gICAgd3JpdGVyLldyaXRlQnl0ZXMoaHVkUGFnZSk7XHJcblxyXG4gICAgY29uc3QgcmVxdWVzdCA9IHdyaXRlci5CeXRlQnVmZmVyO1xyXG4gICAgY2xpZW50LnNlbmQoXHJcbiAgICAgIHJlcXVlc3QsXHJcbiAgICAgIDAsXHJcbiAgICAgIHJlcXVlc3QubGVuZ3RoLFxyXG4gICAgICB0aGlzLlNFUlZFUl9QT1JULFxyXG4gICAgICB0aGlzLlNFUlZFUl9JUCxcclxuICAgICAgdGhpcy5oYW5kbGVFcnJvclxyXG4gICAgKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBpbml0U2hhcmVkTWVtb3J5XHJcbiAgICogQGNvbW1lbnQgVGhpcyBpcyB0aGUgaW5pdCBmdW5jdGlvbiBmb3IgdGhlIEFDQyBOb2RlIFdyYXBwZXIuIFRoaXMgaW5pdHMgdGhlIFNoYXJlZCBNZW1vcnkuXHJcbiAgICogQHBhcmFtIE1fUEhZU0lDU19VUERBVEVfSU5URVJWQUxcclxuICAgKiBAcGFyYW0gTV9HUkFQSElDU19VUERBVEVfSU5URVJWQUxcclxuICAgKiBAcGFyYW0gTV9TVEFUSUNfVVBEQVRFX0lOVEVSVkFMXHJcbiAgICogQHBhcmFtIExvZ2dpbmdcclxuICAgKi9cclxuICBpbml0U2hhcmVkTWVtb3J5KG9wdGlvbnM6IFNoYXJlZE1lbW9yeU9wdGlvbnMpIHtcclxuICAgIGlmICghdGhpcy5pc1dpbmRvd3MgJiYgIXRoaXMuaXNTZXJ2ZXJNb2RlKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgXCJZb3UgbXVzdCBiZSBvbiB0aGUgd2luZG93cyBtYWNoaW5lIHRvIHVzZSB0aGlzIGZ1bmN0aW9uYWxpdHlcIlxyXG4gICAgICApO1xyXG5cclxuICAgIC8vIHRoaXMgc2hvdWxkIGZhaWwgd2l0aCBubyBlcnJvciBiZWNhdXNlIHNlcnZlciBtb2RlIGlzIGRlc2lnbmVkIHRvIGJyb2FkY2FzdCBzaGFyZWQgbWVtb3J5XHJcbiAgICAvLyBhY3Jvc3MgdGhlIG5ldHdvcmsgYW5kIGlmIGEgcGVyc29uIGlzIGRvaW5nIHRoaXMgaXQncyBwb3NzaWJseSBmb3IgYSB2ZXJ5IHNwZWNpZmljL3N0cmFuZ2UgcmVhc29uXHJcbiAgICBpZiAoIXRoaXMuaXNXaW5kb3dzICYmIHRoaXMuaXNTZXJ2ZXJNb2RlKVxyXG4gICAgICByZXR1cm4gY29uc29sZS5sb2coXHJcbiAgICAgICAgXCJPbmx5IHV0aWxpemluZyBicm9hZGNhc3QgbW9kZSBhcyB0aGlzIGlzIG5vdCBhIHdpbmRvd3MgY29tcHV0ZXJcIlxyXG4gICAgICApO1xyXG5cclxuICAgIHRoaXMucmVzb2x2ZVNoYXJlZE1lbU9wdGlvbnMob3B0aW9ucyk7XHJcblxyXG4gICAgLyo9PT09IFN0YXJ0IEludGVydmFsIE1fUEhZU0lDUyA9PT09Ki9cclxuICAgIHRoaXMuU2hhcmVkTWVtb3J5SW50ZXJ2YWwxID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICBjb25zdCBtX3BoeXNpY3NfcmVzdWx0ID0gdGhpcy5SZWFkUGh5c2ljcygpO1xyXG5cclxuICAgICAgdGhpcy5lbWl0KFwiUEhZU0lDU19FVkVOVFwiLCBtX3BoeXNpY3NfcmVzdWx0KTtcclxuXHJcbiAgICAgIC8qPT09PSBMb2dnaW5nIE1lc3NhZ2UgPT09PSovXHJcbiAgICAgIGlmICh0aGlzLkxvZ2dpbmcyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0gQUNDIE5vZGUgV3JhcHBlciA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0gU2hhcmVkIE1lbW9yeSBTdGFydCA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJJbmZvOiBSZWNlaXZpbmcgYSBNZXNzYWdlLlwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgTWVzc2FnZTogJHtKU09OLnN0cmluZ2lmeShtX3BoeXNpY3NfcmVzdWx0KX1gKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIj09PSBTaGFyZWQgTWVtb3J5IEVuZCA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJcIik7XHJcbiAgICAgIH1cclxuICAgIH0sIHRoaXMuTV9QSFlTSUNTX1VQREFURV9JTlRFUlZBTCk7XHJcblxyXG4gICAgLyo9PT09IFN0YXJ0IEludGVydmFsIE1fR1JBUEhJQ1MgPT09PSovXHJcbiAgICB0aGlzLlNoYXJlZE1lbW9yeUludGVydmFsMiA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgY29uc3QgbV9ncmFwaGljc19yZXN1bHQgPSB0aGlzLlJlYWRHcmFwaGljcygpO1xyXG4gICAgICB0aGlzLmVtaXQoXCJHUkFQSElDU19FVkVOVFwiLCBtX2dyYXBoaWNzX3Jlc3VsdCk7XHJcblxyXG4gICAgICAvKj09PT0gTG9nZ2luZyBNZXNzYWdlID09PT0qL1xyXG4gICAgICBpZiAodGhpcy5Mb2dnaW5nMikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IEFDQyBOb2RlIFdyYXBwZXIgPT09XCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IFNoYXJlZCBNZW1vcnkgU3RhcnQgPT09XCIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiSW5mbzogUmVjZWl2aW5nIGEgTWVzc2FnZS5cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coYE1lc3NhZ2U6ICR7SlNPTi5zdHJpbmdpZnkobV9ncmFwaGljc19yZXN1bHQpfWApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IFNoYXJlZCBNZW1vcnkgRW5kID09PVwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcy5NX0dSQVBISUNTX1VQREFURV9JTlRFUlZBTCk7XHJcblxyXG4gICAgLyo9PT09IFN0YXJ0IEludGVydmFsIE1fU1RBVElDID09PT0qL1xyXG4gICAgdGhpcy5TaGFyZWRNZW1vcnlJbnRlcnZhbDMgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGNvbnN0IG1fc3RhdGljX3Jlc3VsdCA9IHRoaXMuUmVhZFN0YXRpYygpO1xyXG4gICAgICB0aGlzLmVtaXQoXCJTVEFUSUNfRVZFTlRcIiwgbV9zdGF0aWNfcmVzdWx0KTtcclxuXHJcbiAgICAgIC8qPT09PSBMb2dnaW5nIE1lc3NhZ2UgPT09PSovXHJcbiAgICAgIGlmICh0aGlzLkxvZ2dpbmcyKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0gQUNDIE5vZGUgV3JhcHBlciA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0gU2hhcmVkIE1lbW9yeSBTdGFydCA9PT1cIik7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJJbmZvOiBSZWNlaXZpbmcgYSBNZXNzYWdlLlwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhgTWVzc2FnZTogJHtKU09OLnN0cmluZ2lmeShtX3N0YXRpY19yZXN1bHQpfWApO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IFNoYXJlZCBNZW1vcnkgRW5kID09PVwiKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIlwiKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcy5NX1NUQVRJQ19VUERBVEVfSU5URVJWQUwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQG5hbWUgZGlzY29ubmVjdFNoYXJlZE1lbW9yeVxyXG4gICAqIEBjb21tZW50IFRoaXMgZnVuY3Rpb24gZGlzY29ubmVjdHMgdGhlIFdyYXBwZXIgZnJvbSB0aGUgU2hhcmVkIE1lbW9yeS5cclxuICAgKi9cclxuICBkaXNjb25uZWN0U2hhcmVkTWVtb3J5KCkge1xyXG4gICAgdGhpcy5tX3BoeXNpY3MuY2xvc2VNYXBwaW5nKCk7XHJcbiAgICB0aGlzLm1fZ3JhcGhpY3MuY2xvc2VNYXBwaW5nKCk7XHJcbiAgICB0aGlzLm1fc3RhdGljLmNsb3NlTWFwcGluZygpO1xyXG5cclxuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5TaGFyZWRNZW1vcnlJbnRlcnZhbDEgYXMgTm9kZUpTLlRpbWVvdXQpO1xyXG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLlNoYXJlZE1lbW9yeUludGVydmFsMiBhcyBOb2RlSlMuVGltZW91dCk7XHJcbiAgICBjbGVhckludGVydmFsKHRoaXMuU2hhcmVkTWVtb3J5SW50ZXJ2YWwzIGFzIE5vZGVKUy5UaW1lb3V0KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBuYW1lIFJlYWRQaHlzaWNzXHJcbiAgICogQGNvbW1lbnQgVGhpcyBmdW5jdGlvbiByZWFkcyB0aGUgUGh5c2ljcyBTaGFyZWQgTWVtb3J5LlxyXG4gICAqL1xyXG4gIFJlYWRQaHlzaWNzKCkge1xyXG4gICAgY29uc3QgRmlsZVBoeXNpY3NfUGF0aCA9IFwiTG9jYWxcXFxcYWNwbWZfcGh5c2ljc1wiO1xyXG4gICAgdGhpcy5tX3BoeXNpY3MuY3JlYXRlTWFwcGluZyhudWxsLCBGaWxlUGh5c2ljc19QYXRoLCB0aGlzLm1fcGh5c2ljc19sZW5ndGgpO1xyXG4gICAgdGhpcy5tX3BoeXNpY3MucmVhZEludG8oMCwgdGhpcy5tX3BoeXNpY3NfbGVuZ3RoLCB0aGlzLm1fcGh5c2ljc19idWZmZXIpO1xyXG5cclxuICAgIGlmICh0aGlzLmlzU2VydmVyTW9kZSkge1xyXG4gICAgICBjb25zdCB3cml0ZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5V3JpdGVyKFwibGl0dGxlXCIpO1xyXG5cclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXMoWzhdKTtcclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXModGhpcy5tX3BoeXNpY3NfYnVmZmVyKTtcclxuXHJcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gd3JpdGVyLkJ5dGVCdWZmZXI7XHJcblxyXG4gICAgICB0aGlzLmJyaWRnZU1lc3NhZ2UocmVzcG9uc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmZvcndhcmRPbmx5KSByZXR1cm47XHJcblxyXG4gICAgY29uc3QgcmVhZGVyID0gbmV3IGJpbnV0aWxzLkJpbmFyeVJlYWRlcih0aGlzLm1fcGh5c2ljc19idWZmZXIsIFwibGl0dGxlXCIpO1xyXG5cclxuICAgIHJldHVybiBwaHlzaWNzUGFyc2VyKHJlYWRlcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBSZWFkR3JhcGhpY3NcclxuICAgKiBAY29tbWVudCBUaGlzIGZ1bmN0aW9uIHJlYWRzIHRoZSBHcmFwaGljcyBTaGFyZWQgTWVtb3J5LlxyXG4gICAqL1xyXG4gIFJlYWRHcmFwaGljcygpIHtcclxuICAgIGNvbnN0IEZpbGVHcmFwaGljc19QYXRoID0gXCJMb2NhbFxcXFxhY3BtZl9ncmFwaGljc1wiO1xyXG4gICAgdGhpcy5tX2dyYXBoaWNzLmNyZWF0ZU1hcHBpbmcoXHJcbiAgICAgIG51bGwsXHJcbiAgICAgIEZpbGVHcmFwaGljc19QYXRoLFxyXG4gICAgICB0aGlzLm1fZ3JhcGhpY3NfbGVuZ3RoXHJcbiAgICApO1xyXG4gICAgdGhpcy5tX2dyYXBoaWNzLnJlYWRJbnRvKDAsIHRoaXMubV9ncmFwaGljc19sZW5ndGgsIHRoaXMubV9ncmFwaGljc19idWZmZXIpO1xyXG5cclxuICAgIGlmICh0aGlzLmlzU2VydmVyTW9kZSkge1xyXG4gICAgICBjb25zdCB3cml0ZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5V3JpdGVyKFwibGl0dGxlXCIpO1xyXG5cclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXMoWzldKTtcclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXModGhpcy5tX2dyYXBoaWNzX2J1ZmZlcik7XHJcblxyXG4gICAgICBjb25zdCByZXNwb25zZSA9IHdyaXRlci5CeXRlQnVmZmVyO1xyXG5cclxuICAgICAgdGhpcy5icmlkZ2VNZXNzYWdlKHJlc3BvbnNlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5mb3J3YXJkT25seSkgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBiaW51dGlscy5CaW5hcnlSZWFkZXIodGhpcy5tX2dyYXBoaWNzX2J1ZmZlciwgXCJsaXR0bGVcIik7XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoaWNzUGFyc2VyKHJlYWRlcik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAbmFtZSBSZWFkU3RhdGljXHJcbiAgICogQGNvbW1lbnQgVGhpcyBmdW5jdGlvbiByZWFkcyB0aGUgU3RhdGljIFNoYXJlZCBNZW1vcnkuXHJcbiAgICovXHJcbiAgUmVhZFN0YXRpYygpIHtcclxuICAgIGNvbnN0IEZpbGVTdGF0aWNfUGF0aCA9IFwiTG9jYWxcXFxcYWNwbWZfc3RhdGljXCI7XHJcbiAgICB0aGlzLm1fc3RhdGljLmNyZWF0ZU1hcHBpbmcobnVsbCwgRmlsZVN0YXRpY19QYXRoLCB0aGlzLm1fc3RhdGljX2xlbmd0aCk7XHJcbiAgICB0aGlzLm1fc3RhdGljLnJlYWRJbnRvKDAsIHRoaXMubV9zdGF0aWNfbGVuZ3RoLCB0aGlzLm1fc3RhdGljX2J1ZmZlcik7XHJcblxyXG4gICAgaWYgKHRoaXMuaXNTZXJ2ZXJNb2RlKSB7XHJcbiAgICAgIGNvbnN0IHdyaXRlciA9IG5ldyBiaW51dGlscy5CaW5hcnlXcml0ZXIoXCJsaXR0bGVcIik7XHJcblxyXG4gICAgICB3cml0ZXIuV3JpdGVCeXRlcyhbMTBdKTtcclxuICAgICAgd3JpdGVyLldyaXRlQnl0ZXModGhpcy5tX3N0YXRpY19idWZmZXIpO1xyXG5cclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSB3cml0ZXIuQnl0ZUJ1ZmZlcjtcclxuXHJcbiAgICAgIHRoaXMuYnJpZGdlTWVzc2FnZShyZXNwb25zZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuZm9yd2FyZE9ubHkpIHJldHVybjtcclxuXHJcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgYmludXRpbHMuQmluYXJ5UmVhZGVyKHRoaXMubV9zdGF0aWNfYnVmZmVyLCBcImxpdHRsZVwiKTtcclxuXHJcbiAgICByZXR1cm4gc3RhdGljUGFyc2VyKHJlYWRlcik7XHJcbiAgfVxyXG5cclxuICBicmlkZ2VNZXNzYWdlKG1lc3NhZ2U6IEJ1ZmZlcik6IHZvaWQge1xyXG4gICAgaWYgKCFjbGllbnQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU29ja2V0IGlzIG5vdCBpbml0aWFsaXplZFwiKTtcclxuICAgIH1cclxuICAgIGlmICghY2xpZW50KSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHBvcnRzIHRvIGJyaWRnZSBvdmVyXCIpO1xyXG4gICAgfVxyXG4gICAgZm9yIChjb25zdCBhZGRyZXNzIG9mIHRoaXMuZm9yd2FyZEFkZHJlc3Nlcykge1xyXG4gICAgICBjbGllbnQuc2VuZChcclxuICAgICAgICBtZXNzYWdlLFxyXG4gICAgICAgIDAsXHJcbiAgICAgICAgbWVzc2FnZS5sZW5ndGgsXHJcbiAgICAgICAgYWRkcmVzcy5wb3J0LFxyXG4gICAgICAgIGFkZHJlc3MuYWRkcmVzcyB8fCBcIjAuMC4wLjBcIlxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQUNDTm9kZVdyYXBwZXI7XHJcbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVzXCI7XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsSUFBQUEsVUFBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsT0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsVUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsU0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksVUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssT0FBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sVUFBQSxHQUFBTixPQUFBO0FBQ0EsSUFBQU8sZUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsZ0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNB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