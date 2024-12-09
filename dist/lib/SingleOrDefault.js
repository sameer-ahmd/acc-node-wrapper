"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/*=== SingleOrDefault Function from C# ====*/
const SingleOrDefault = (arr, filter) => {
  let result = -1,
    found = 0;
  for (let i = 0; i < arr.length; i++) if (filter(arr[i], i, arr)) {
    if (result === -1) result = i;
    found++;
  }
  return found === 1 ? result : null;
};
var _default = exports.default = SingleOrDefault;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW5nbGVPckRlZmF1bHQiLCJhcnIiLCJmaWx0ZXIiLCJyZXN1bHQiLCJmb3VuZCIsImkiLCJsZW5ndGgiLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9TaW5nbGVPckRlZmF1bHQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyo9PT0gU2luZ2xlT3JEZWZhdWx0IEZ1bmN0aW9uIGZyb20gQyMgPT09PSovXHJcbmNvbnN0IFNpbmdsZU9yRGVmYXVsdCA9IChhcnIsIGZpbHRlcikgPT4ge1xyXG4gIGxldCByZXN1bHQgPSAtMSxcclxuICAgIGZvdW5kID0gMDtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspXHJcbiAgICBpZiAoZmlsdGVyKGFycltpXSwgaSwgYXJyKSkge1xyXG4gICAgICBpZiAocmVzdWx0ID09PSAtMSkgcmVzdWx0ID0gaTtcclxuICAgICAgZm91bmQrKztcclxuICAgIH1cclxuXHJcbiAgcmV0dXJuIGZvdW5kID09PSAxID8gcmVzdWx0IDogbnVsbDtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNpbmdsZU9yRGVmYXVsdDtcclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNBLE1BQU1BLGVBQWUsR0FBR0EsQ0FBQ0MsR0FBRyxFQUFFQyxNQUFNLEtBQUs7RUFDdkMsSUFBSUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNiQyxLQUFLLEdBQUcsQ0FBQztFQUVYLEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSixHQUFHLENBQUNLLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQ2pDLElBQUlILE1BQU0sQ0FBQ0QsR0FBRyxDQUFDSSxDQUFDLENBQUMsRUFBRUEsQ0FBQyxFQUFFSixHQUFHLENBQUMsRUFBRTtJQUMxQixJQUFJRSxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUVBLE1BQU0sR0FBR0UsQ0FBQztJQUM3QkQsS0FBSyxFQUFFO0VBQ1Q7RUFFRixPQUFPQSxLQUFLLEtBQUssQ0FBQyxHQUFHRCxNQUFNLEdBQUcsSUFBSTtBQUNwQyxDQUFDO0FBQUMsSUFBQUksUUFBQSxHQUFBQyxPQUFBLENBQUFDLE9BQUEsR0FFYVQsZUFBZSIsImlnbm9yZUxpc3QiOltdfQ==