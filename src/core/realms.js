const { UserError } = require('../utils/errors')
const { sleep } = require('../utils/async')

const BASE_URL = 'https://bedrock.frontendlegacy.realms.minecraft-services.net'
const RELYING_PARTY = 'https://pocket.realms.minecraft.net/'
const MAX_JOIN_ATTEMPTS = 6

function parseRealmInput(input) {
  const raw = String(input ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()

  // Accept plain numeric Realm IDs and invite codes
  const cleaned = raw.split(/[?#]/)[0].trim()
  const value = cleaned.split('/').filter(Boolean).pop() ?? ''

  if (/^\d+$/.test(value)) return { type: 'id', value }
  if (/^[A-Za-z0-9_-]{5,}$/.test(value)) return { type: 'code', value }

  throw new UserError('Invalid Realm', 'Enter a Realm invite code, a Realm invite link, or a numeric Realm ID.')
}

async function failFromStatus(response, action) {
  const status = response.status
  let body = null

  // A 401/403 from the Realms REST API happens BEFORE a Bedrock
  // disconnect packet exists Preserve the service's actual error payload
  try {
    const text = await response.clone().text()
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        body = { raw: text }
      }
    }
  } catch {}

  const apiCode = body?.errorCode ?? body?.error_code ?? body?.code ?? body?.error?.code
  const apiMessage = body?.errorMessage ?? body?.error_message ?? body?.message ?? body?.error?.message ?? body?.raw
  const cleanMessage = typeof apiMessage === 'string'
    ? apiMessage.replace(/\s+/g, ' ').trim().slice(0, 500)
    : ''

  if (status === 401) throw new UserError(
    'Sign in rejected',
    cleanMessage || 'Microsoft rejected the linked account. Run `/account unlink` and then `/account link` again.'
  )

  if (status === 403) {
    // 403 here is a Realms REST/API rejection, not a Bedrock packet. Keep
    // that distinction visible so it is not mistaken for a generic client
    // connection error.
    const detail = [apiCode ? `Realms API error ${apiCode}` : null, cleanMessage].filter(Boolean).join(': ')
    throw new UserError(
      'Realm join rejected',
      detail || 'Minecraft Realms rejected the linked account before a game connection was established. No Bedrock disconnect packet exists for this failure.'
    )
  }

  if (status === 404) throw new UserError('Realm not found', cleanMessage || 'No Realm matches that code or ID for the linked account.')
  if (status === 410) throw new UserError('Realm expired', cleanMessage || 'This Realm\u2019s subscription has expired. Ask the owner to renew it.')
  if (status === 429) throw new UserError('Rate limited', cleanMessage || 'Realms is rate limiting requests. Wait a moment and try again.')
  if (status >= 500) throw new UserError('Realms unavailable', cleanMessage || 'The Realms service is having problems right now. Try again in a few minutes.')
  throw new UserError('Realms error', cleanMessage || `${action} failed with status ${status}.`)
}

const stripFormatting = value => String(value ?? '').replace(/\u00a7./g, '').trim()

function normalizeRealm(data) {
  if (!data?.id) throw new UserError('Realm not found', 'The Realms service returned no Realm for that code or ID.')
  return {
    id: String(data.id),
    name: stripFormatting(data.name) || `Realm ${data.id}`,
    owner: data.owner ?? null,
    state: typeof data.state === 'string' ? data.state.toUpperCase() : null,
    expired: Boolean(data.expired),
    expiredTrial: Boolean(data.expiredTrial),
    member: data.member == null ? null : Boolean(data.member)
  }
}

function assertJoinable(realm) {
  if (realm.expired || realm.expiredTrial) {
    throw new UserError('Realm expired', 'This Realm\u2019s subscription has expired. Ask the owner to renew it.')
  }
  if (realm.state === 'CLOSED') {
    throw new UserError('Realm closed', 'This Realm is currently closed by its owner. Try again later, or ask them to open it.')
  }
  if (realm.state === 'UNINITIALIZED') {
    throw new UserError('Realm not set up', 'This Realm has not finished being set up by its owner yet.')
  }
}

function normalizeConnection(data) {
  const address = String(data?.address ?? '')
  const transport = String(data?.networkProtocol ?? (/^nethernet:\/\//i.test(address) ? 'NETHERNET' : 'RAKNET')).toUpperCase()

  if (!transport.includes('NETHERNET')) {
    throw new UserError('Unsupported Realm', 'This Realm does not use NetherNet, which is the only transport this bot supports.')
  }

  const networkId = address.replace(/^nethernet:\/\//i, '').trim()
  if (!networkId) throw new UserError('Realm unavailable', 'The Realms service did not return a connection address.')

  return { transport, networkId, address }
}

class RealmsClient {
  constructor(authflow, version) {
    this.authflow = authflow
    this.version = version
  }

  async #request(method, route) {
    let auth
    try {
      auth = await this.authflow.getXboxToken(RELYING_PARTY)
    } catch (error) {
      if (error instanceof UserError) throw error
      throw new UserError('Sign in rejected', 'Microsoft rejected the linked account. Run `/account unlink` and then `/account link` again.')
    }

    try {
      return await fetch(`${BASE_URL}${route}`, {
        method,
        headers: {
          Accept: '*/*',
          charset: 'utf-8',
          'Client-Version': this.version,
          'x-clientplatform': 'iOS',
          'x-networkprotocolversion': '2193',
          'Content-Type': 'application/json',
          'User-Agent': 'MCPE/IOS',
          'Accept-Language': 'en-US',
          Authorization: `XBL3.0 x=${auth.userHash};${auth.XSTSToken}`
        }
      })
    } catch (error) {
      throw new UserError('Realms unreachable', 'Could not reach the Minecraft Realms service. Check the network connection and try again.')
    }
  }

  async resolve(target) {
    if (target.type === 'code') {
      const code = encodeURIComponent(target.value)
      const response = await this.#request('GET', `/worlds/v1/link/${code}`)
      if (!response.ok) await failFromStatus(response, 'Looking up the invite code')
      const realm = normalizeRealm(await response.json())
      assertJoinable(realm)

      if (realm.member === false) {
        const acceptResponse = await this.#request('POST', `/invites/v1/link/accept/${code}`)
        if (!acceptResponse.ok) {
          await failFromStatus(acceptResponse, 'Accepting the Realm invite')
        }
      }

      return this.getRealmById(realm.id)
    }

    return this.getRealmById(target.value)
  }

  async getRealmById(realmId) {
    const response = await this.#request('GET', `/worlds/${encodeURIComponent(realmId)}`)
    if (!response.ok) await failFromStatus(response, 'Looking up the Realm')
    const realm = normalizeRealm(await response.json())
    assertJoinable(realm)
    return realm
  }

  async getConnection(realmId) {
    for (let attempt = 1; attempt <= MAX_JOIN_ATTEMPTS; attempt++) {
      const response = await this.#request('GET', `/worlds/${realmId}/join`)

      if (response.status === 503) {
        const wait = Number(response.headers.get('retry-after')) || 5
        await sleep(Math.min(wait, 15) * 1000)
        continue
      }

      if (!response.ok) await failFromStatus(response, 'Requesting the join address')
      return normalizeConnection(await response.json())
    }

    throw new UserError('Realm unavailable', 'The Realm is still starting up. Try again in a minute.')
  }
}

module.exports = { RealmsClient, parseRealmInput }
