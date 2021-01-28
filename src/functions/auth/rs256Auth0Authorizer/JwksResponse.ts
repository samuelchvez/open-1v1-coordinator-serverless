interface JwksResponseKeys {
  alg: string,
  kty: string,
  key: string,
  n: string,
  e: string,
  kid: string,
  x5t: string,
  x5c: string[],
}

export interface JwksResponse {
  keys: JwksResponseKeys[],
}
