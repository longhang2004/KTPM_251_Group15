import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!(value instanceof Date)) {
            return false;
          }
          return value.getTime() < new Date().getTime();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a date in the past`;
        },
      },
    });
  };
}
