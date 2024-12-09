"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/*=== FirstOrDefault Function from C# ====*/
const FirstOrDefault = (arr, filter) => {
  let result = null;
  for (let i = 0; i < arr.length; i++) if (filter(arr[i], i, arr)) result = i;
  return result;
};
var _default = exports.default = FirstOrDefault;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJGaXJzdE9yRGVmYXVsdCIsImFyciIsImZpbHRlciIsInJlc3VsdCIsImkiLCJsZW5ndGgiLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9GaXJzdE9yRGVmYXVsdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKj09PSBGaXJzdE9yRGVmYXVsdCBGdW5jdGlvbiBmcm9tIEMjID09PT0qL1xyXG5jb25zdCBGaXJzdE9yRGVmYXVsdCA9IChhcnIsIGZpbHRlcikgPT4ge1xyXG4gIGxldCByZXN1bHQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgaWYgKGZpbHRlcihhcnJbaV0sIGksIGFycikpIHJlc3VsdCA9IGk7XHJcblxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBGaXJzdE9yRGVmYXVsdDtcclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNBLE1BQU1BLGNBQWMsR0FBR0EsQ0FBQ0MsR0FBRyxFQUFFQyxNQUFNLEtBQUs7RUFDdEMsSUFBSUMsTUFBcUIsR0FBRyxJQUFJO0VBRWhDLEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHSCxHQUFHLENBQUNJLE1BQU0sRUFBRUQsQ0FBQyxFQUFFLEVBQUUsSUFBSUYsTUFBTSxDQUFDRCxHQUFHLENBQUNHLENBQUMsQ0FBQyxFQUFFQSxDQUFDLEVBQUVILEdBQUcsQ0FBQyxFQUFFRSxNQUFNLEdBQUdDLENBQUM7RUFFM0UsT0FBT0QsTUFBTTtBQUNmLENBQUM7QUFBQyxJQUFBRyxRQUFBLEdBQUFDLE9BQUEsQ0FBQUMsT0FBQSxHQUVhUixjQUFjIiwiaWdub3JlTGlzdCI6W119