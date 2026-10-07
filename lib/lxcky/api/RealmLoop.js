'use strict'

const { EventEmitter } = require('events')

function sleep(ms) {
    if (ms <= 0) return Promise.resolve()
    return new Promise(resolve => setTimeout(resolve, ms))
}

function pickDuration(value, name) {
    if (Array.isArray(value)) {
        if (value.length !== 2) throw new TypeError(`${name} must be a number or [min, max]`)
        const min = Number(value[0])
        const max = Number(value[1])
        if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
            throw new TypeError(`${name} must contain two valid non-negative numbers with min <= max`)
        }
        return Math.floor(min + Math.random() * (max - min + 1))
    }

    const duration = Number(value)
    if (!Number.isFinite(duration) || duration < 0) {
        throw new TypeError(`${name} must be a non-negative number or [min, max]`)
    }
    return Math.floor(duration)
}

class RealmLoop extends EventEmitter {
    constructor(api, options = {}) {
        super()

        if (!api || typeof api.join !== 'function') {
            throw new TypeError('RealmLoop requires an LxckyAPI instance')
        }

        this.api = api
        this.options = { ...options }
        this.loops = Number(options.loops ?? 1)
        this.stay = options.stay ?? 15_000
        this.reconnectDelay = options.reconnectDelay ?? 30_000
        this.iteration = 0
        this.realm = null
        this.running = false
        this._stopRequested = false
        this._timer = null

        if (!Number.isInteger(this.loops) || this.loops < 1) {
            throw new TypeError('loops must be a positive integer')
        }
    }

    async start() {
        if (this.running) return this

        this.running = true
        this._stopRequested = false

        try {
            while (!this._stopRequested && this.iteration < this.loops) {
                this.iteration++

                const realmOptions = { ...this.options }
                delete realmOptions.loops
                delete realmOptions.stay
                delete realmOptions.reconnectDelay

                this.emit('iteration', { current: this.iteration, total: this.loops })

                try {
                    this.realm = await this.api.join(realmOptions)
                    this.emit('join', this.realm)
                } catch (error) {
                    this.emit('error', error)
                    if (this._stopRequested) break
                    continue
                }

                const stay = pickDuration(this.stay, 'stay')
                await this._wait(stay)

                if (this.realm) {
                    const realm = this.realm
                    this.realm = null
                    try {
                        await realm.leave('Realm loop iteration complete')
                    } catch (error) {
                        this.emit('error', error)
                    }
                    this.emit('leave', {
                        realm,
                        current: this.iteration,
                        total: this.loops
                    })
                }

                if (this._stopRequested || this.iteration >= this.loops) break

                const reconnectDelay = pickDuration(this.reconnectDelay, 'reconnectDelay')
                this.emit('waiting', {
                    duration: reconnectDelay,
                    nextIteration: this.iteration + 1
                })
                await this._wait(reconnectDelay)
            }
        } finally {
            if (this.realm) {
                const realm = this.realm
                this.realm = null
                try {
                    await realm.leave('Realm loop stopped')
                } catch (error) {
                    this.emit('error', error)
                }
            }

            this.running = false
            this._timer = null

            if (this._stopRequested) {
                this.emit('stopped', { iterations: this.iteration })
            } else {
                this.emit('complete', { iterations: this.iteration })
            }
        }

        return this
    }

    async stop() {
        this._stopRequested = true

        if (this._timer) {
            clearTimeout(this._timer)
            this._timer = null
        }

        if (this.realm) {
            const realm = this.realm
            this.realm = null
            try {
                await realm.leave('Realm loop stopped')
            } catch (error) {
                this.emit('error', error)
            }
        }

        return this
    }

    _wait(duration) {
        if (this._stopRequested || duration <= 0) return Promise.resolve()

        return new Promise(resolve => {
            this._timer = setTimeout(() => {
                this._timer = null
                resolve()
            }, duration)
        })
    }
}

module.exports = { RealmLoop }
