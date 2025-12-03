import { Transform } from 'class-transformer';
import { normalizePhoneNumber } from '../formatter';

export const TransformPhoneNumber = () =>
  Transform(({ value }: { value: string }) => {
    return normalizePhoneNumber(value);
  });

export function transformPhoneNumber(value: string): string {
  return normalizePhoneNumber(value);
}
