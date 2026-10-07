'use strict'

const path = require('path')
const { JsonStore } = require('./store')
const { parseRealmInput } = require('./realms')

class WhitelistManager {
  constructor(config) {
    this.store = new JsonStore(path.join(config.dataDir, 'whitelist.json'))
  }

  #records() {
    const records = this.store.get('realms')
    return Array.isArray(records) ? records : []
  }

  #save(records) {
    this.store.set('realms', records)
  }

  normalize(input) {
    const target = parseRealmInput(input)
    return {
      type: target.type,
      value: String(target.value).trim()
    }
  }

  add(input) {
    const target = this.normalize(input)
    const records = this.#records()
    const exists = records.some(record => record.type === target.type && String(record.value) === target.value)
    if (exists) return false

    records.push({
      type: target.type,
      value: target.value,
      addedAt: Date.now()
    })
    this.#save(records)
    return true
  }

  remove(input) {
    const target = this.normalize(input)
    const records = this.#records()
    const next = records.filter(record => !(record.type === target.type && String(record.value) === target.value))
    if (next.length === records.length) return false

    this.#save(next)
    return true
  }

  isWhitelisted(input, realmId = null) {
    let target
    try {
      target = this.normalize(input)
    } catch {
      return false
    }

    const id = realmId == null ? null : String(realmId)

    return this.#records().some(record => {
      if (record.type === target.type && String(record.value) === target.value) return true
      if (id && record.type === 'id' && String(record.value) === id) return true
      return false
    })
  }

  list() {
    return this.#records().map(record => ({ ...record }))
  }
}

module.exports = { WhitelistManager }
