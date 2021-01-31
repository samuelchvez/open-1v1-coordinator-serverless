export function permutations<T>(arr: Array<T>, perms = [], len : number = arr.length): Array<T> {
  if (len === 1) {
    perms.push(arr.slice(0));
  }

  for (let i = 0; i < len; i++) {
    permutations(arr, perms, len - 1);
  
    len % 2 // parity dependent adjacent elements swap
      ? [arr[0], arr[len - 1]] = [arr[len - 1], arr[0]]
      : [arr[i], arr[len - 1]] = [arr[len - 1], arr[i]]
  }

  return perms;
}
