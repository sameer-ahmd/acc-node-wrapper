/*=== FirstOrDefault Function from C# ====*/
const FirstOrDefault = (arr, filter) => {
  let result: number | null = null;

  for (let i = 0; i < arr.length; i++) if (filter(arr[i], i, arr)) result = i;

  return result;
};

export default FirstOrDefault;
