import { Client, ClientOptions } from './lib/client';

/**
 * Initialize client with given config
 *
 * @param apikey
 * @param options
 */
export const init = (apikey: string, options?: ClientOptions): Client => {
  return new Client(apikey, options);
};
