'use strict'

var sha1File = require('./index')
var assert = require('assert')
var filename = 'LICENSE.md'
var preCheckedSum = '3c8a2e2125f94492082bc484044edb4dc837f83b'

sha1File(filename, function (error, sum) {
  console.log('sum = ' + sum)
  assert(error === null)
  assert(sum === preCheckedSum)
  console.log('Pass 2/2')
})

var syncSum = sha1File(filename)

assert(syncSum === preCheckedSum)
console.log('sum = ' + syncSum)
console.log('Pass 1/2')

// errors

sha1File('does not exist', function (error, sum) {
  assert(error)
  assert(!sum)
})
