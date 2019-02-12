import * as agent from 'superagent';

/**
 * @private
 */
export interface CustomReq extends agent.SuperAgentStatic {
  [method: string]: any;
}

/**
 *
 * @private
 * @param method
 * @param url
 */
const requestWithSource = (method: string, url: string): CustomReq => {
  const newReq: CustomReq = agent;
  return newReq[method](url);
};

/**
 * @private
 */
const request: agent.SuperAgentStatic = agent;

export { request, requestWithSource };
