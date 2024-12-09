"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registrationResultParser = registrationResultParser;
var _ReadString = _interopRequireDefault(require("../lib/ReadString"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function registrationResultParser(reader, ConnectionId) {
  const result = {};
  result.ConnectionId = ConnectionId;
  result.ConnectionSuccess = reader.ReadBytes(1).readUInt8(0) > 0;
  result.isReadonly = reader.ReadBytes(1).readUInt8(0) === 0;
  result.err = (0, _ReadString.default)(reader);
  return result;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfUmVhZFN0cmluZyIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwicmVnaXN0cmF0aW9uUmVzdWx0UGFyc2VyIiwicmVhZGVyIiwiQ29ubmVjdGlvbklkIiwicmVzdWx0IiwiQ29ubmVjdGlvblN1Y2Nlc3MiLCJSZWFkQnl0ZXMiLCJyZWFkVUludDgiLCJpc1JlYWRvbmx5IiwiZXJyIiwiUmVhZFN0cmluZyJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdHJ1Y3RzL1JlZ2lzdHJhdGlvblJlc3VsdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhZFN0cmluZyBmcm9tIFwiQC9saWIvUmVhZFN0cmluZ1wiO1xyXG5pbXBvcnQgeyBSZWdpc3RyYXRpb25SZXN1bHQgfSBmcm9tIFwiQC90eXBlc1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdHJhdGlvblJlc3VsdFBhcnNlcihyZWFkZXIsIENvbm5lY3Rpb25JZDogbnVtYmVyKSB7XHJcbiAgY29uc3QgcmVzdWx0OiBQYXJ0aWFsPFJlZ2lzdHJhdGlvblJlc3VsdD4gPSB7fTtcclxuXHJcbiAgcmVzdWx0LkNvbm5lY3Rpb25JZCA9IENvbm5lY3Rpb25JZDtcclxuICByZXN1bHQuQ29ubmVjdGlvblN1Y2Nlc3MgPSByZWFkZXIuUmVhZEJ5dGVzKDEpLnJlYWRVSW50OCgwKSA+IDA7XHJcbiAgcmVzdWx0LmlzUmVhZG9ubHkgPSByZWFkZXIuUmVhZEJ5dGVzKDEpLnJlYWRVSW50OCgwKSA9PT0gMDtcclxuICByZXN1bHQuZXJyID0gUmVhZFN0cmluZyhyZWFkZXIpO1xyXG5cclxuICByZXR1cm4gcmVzdWx0IGFzIFJlZ2lzdHJhdGlvblJlc3VsdDtcclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUFBLFdBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUEwQyxTQUFBRCx1QkFBQUUsQ0FBQSxXQUFBQSxDQUFBLElBQUFBLENBQUEsQ0FBQUMsVUFBQSxHQUFBRCxDQUFBLEtBQUFFLE9BQUEsRUFBQUYsQ0FBQTtBQUduQyxTQUFTRyx3QkFBd0JBLENBQUNDLE1BQU0sRUFBRUMsWUFBb0IsRUFBRTtFQUNyRSxNQUFNQyxNQUFtQyxHQUFHLENBQUMsQ0FBQztFQUU5Q0EsTUFBTSxDQUFDRCxZQUFZLEdBQUdBLFlBQVk7RUFDbENDLE1BQU0sQ0FBQ0MsaUJBQWlCLEdBQUdILE1BQU0sQ0FBQ0ksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztFQUMvREgsTUFBTSxDQUFDSSxVQUFVLEdBQUdOLE1BQU0sQ0FBQ0ksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztFQUMxREgsTUFBTSxDQUFDSyxHQUFHLEdBQUcsSUFBQUMsbUJBQVUsRUFBQ1IsTUFBTSxDQUFDO0VBRS9CLE9BQU9FLE1BQU07QUFDZiIsImlnbm9yZUxpc3QiOltdfQ==