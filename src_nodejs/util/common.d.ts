import {UUID} from '../uuid_types';

type ServiceClient = new (output: object, pClass: object) => Class;

declare export function generateUUID(): UUID;
declare export function getURLParameter(sParam: string): string;
declare export function serializeThrift(obj: object): Buffer;
declare export function deserializeThrift(
  data: Buffer,
  thriftModel: new (args?: object) => Class): object;
declare export function createXHRClientFromURL(
  url: string,
  serviceModel: {Client: ServiceClient} | Client,
  onError?: (ex: object) => void);
declare export function getVersion(): string;
