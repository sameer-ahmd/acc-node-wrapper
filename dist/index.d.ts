/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from "events";
import { Moment } from "moment";
import CarInfo from "./structs/CarInfo";
import { RealtimeCarUpdate, RealtimeUpdate, RegistrationResult, CarInformation, EntryListCars, BroadcastOptions, AsServerOptions, SharedMemoryOptions, NetworkAddress, PhysicsResult, StaticResult, GraphicsResult, BroadcastEvent } from "./types";
export declare interface ACCNodeWrapper {
    on(event: "REGISTRATION_RESULT", listener: (data: RegistrationResult) => void): this;
    on(event: "REALTIME_UPDATE", listener: (data: RealtimeUpdate) => void): this;
    on(event: "REALTIME_CAR_UPDATE", listener: (data: RealtimeCarUpdate) => void): this;
    on(event: "ENTRY_LIST", listener: (data: CarInformation[]) => void): this;
    on(event: "ENTRY_LIST_CAR", listener: (data: EntryListCars) => void): this;
    on(event: "BROADCAST_EVENT", listener: (data: BroadcastEvent) => void): this;
    on(event: "PHYSICS_EVENT", listener: (data: PhysicsResult) => void): this;
    on(event: "STATIC_EVENT", listener: (data: StaticResult) => void): this;
    on(event: "GRAPHICS_EVENT", listener: (data: GraphicsResult) => void): this;
}
export declare class ACCNodeWrapper extends EventEmitter {
    private isWindows;
    private intervalID;
    private SharedMemoryInterval1;
    private SharedMemoryInterval2;
    private SharedMemoryInterval3;
    private m_physics_length;
    private m_physics_buffer;
    private m_physics;
    private m_graphics_length;
    private m_graphics_buffer;
    private m_graphics;
    private m_static_length;
    private m_static_buffer;
    private m_static;
    private isServerMode;
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
    SERVER_DISPLAYNAME: any;
    SERVER_IP: any;
    SERVER_PORT: any;
    SERVER_PASS: any;
    SERVER_COMMANDPASS: any;
    UPDATE_INTERVAL: any;
    Logging: boolean;
    Logging2: boolean;
    ConnectionId: null | number;
    lastEntrylistRequest: Moment | string;
    _entryListCars: CarInfo[];
    constructor();
    initAsServer(options: AsServerOptions): void;
    initAsClient(port: number): void;
    initBroadcastSDK(options: BroadcastOptions): void;
    handleError: (err: any) => void;
    private resolveAsServerOptions;
    private resolveBroadcastOptions;
    private resolveSharedMemOptions;
    handlingMessage: (message: Buffer) => {
        result: {};
        type: any | number;
    };
    RequestConnection: () => void;
    Disconnect: () => void;
    RequestEntryList: () => void;
    RequestTrackData: () => void;
    SetFocus: (carIndex: any, cameraSet: any, camera: any) => void;
    SetCamera: (cameraSet: any, camera: any) => void;
    SetFocusInternal: (carIndex: any, cameraSet: any, camera: any) => void;
    RequestInstantReplay: (startSessionTime: any, durationMS: any, initialFocusedCarIndex: any, initialCameraSet: any, initialCamera: any) => void;
    RequestHUDPage: (hudPage: any) => void;
    initSharedMemory(options: SharedMemoryOptions): void;
    disconnectSharedMemory(): void;
    ReadPhysics(): Partial<PhysicsResult>;
    ReadGraphics(): Partial<any>;
    ReadStatic(): Partial<StaticResult>;
    bridgeMessage(message: Buffer): void;
}
export default ACCNodeWrapper;
export * from "./types";
