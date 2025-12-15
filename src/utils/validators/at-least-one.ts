import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function AtLeastOne(
  properties: string[],
  validationOptions?: ValidationOptions
) {
  return function (constructor: Function) {
    registerDecorator({
      name: 'atLeastOne',
      target: constructor,
      propertyName: '__atLeastOne__', // virtual, no existe
      options: validationOptions,
      constraints: [properties],
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as any;
          const [props] = args.constraints as [string[]];
          return props.some(
            (p) => obj[p] !== undefined && obj[p] !== null
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [props] = args.constraints as [string[]];
          return `Debe enviar al menos uno de estos campos: ${props.join(', ')}`;
        },
      },
    });
  };
}
