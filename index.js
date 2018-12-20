/* @flow */

function foo(x: ?number): number {
  if (x) {
    return x
  }
  return 2
}

foo(1)

var arr: Array<number> = [1, 2, 3]

arr.push('23')
