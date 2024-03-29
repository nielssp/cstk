# cstk changelog

## cstk 0.5.5

Fixed issues:

- null values not handled in Deref or Unwrap

New features:

- `property.toPromise()`

## cstk 0.5.4

New features:

- `property.updateDefined()`

## cstk 0.5.3

New features:

- `property.update()`

## cstk 0.5.0

New features:

- `<Lazy>`

## cstk 0.4.0

New features:

- `createValue()`
- `createRouter()`

## cstk 0.3.0

New features:

- `x.bimap(encode, decode)` on properties

## cstk 0.2.0

New features:

- `ref={x}` on HTML elements
- `ref<T>()`
- `<Deref>`
- `x.eq(y: T|Property<T>)` on properties
- `class={{classA: propA, classB: propB}}` on HTML elements
- `x.props.propName` on properties
- `x.mapDefined(f)` on properties
- `x.orElse(alternative)` on properties
- `x.await(onrejected)` on properties
- `<Unwrap>`

## cstk 0.1.1

Fixed issues:

- Missing exports
