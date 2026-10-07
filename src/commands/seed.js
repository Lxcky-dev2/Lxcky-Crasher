'use strict'

const { SlashCommandBuilder } = require('discord.js')
const { panels } = require('../ui/panels')
const { defer, edit } = require('../ui/respond')
const { connectRealm } = require('../core/connector')
const { UserError } = require('../utils/errors')
const log = require('../utils/logger')

const CHUNKBASE_PLATFORM = 'bedrock_26_0'

function toSignedSeed(seed) {
  const value = BigInt(seed)
  return (value > 9223372036854775807n
    ? value - 18446744073709551616n
    : value
  ).toString()
}

function chunkbaseUrl(seed) {
  return `https://www.chunkbase.com/apps/seed-map#seed=${seed}&platform=${CHUNKBASE_PLATFORM}&dimension=overworld&x=0&z=0&zoom=0`
}

const data = new SlashCommandBuilder()
  .setName('seed')
  .setDescription('Retrieve the seed of a Minecraft Realm')
  .addStringOption(option => option
    .setName('code')
    .setDescription('Realm invite code')
    .setRequired(true))

async function execute(interaction, { config, accounts, sessions, whitelist }) {
  const userId = interaction.user.id
  const input = interaction.options.getString('code', true).trim()

  await defer(interaction, config.ephemeral)

  if (whitelist?.isWhitelisted(input)) return edit(interaction, panels.realmWhitelisted())

  if (!accounts.has(userId)) return edit(interaction, panels.needsAccount())
  if (sessions.get(userId)) return edit(interaction, panels.error('Already running', 'Stop your current Realm operation first.'))
  if (sessions.size >= config.maxSessions) return edit(interaction, panels.atCapacity())
  if (!sessions.claim(userId)) return edit(interaction, panels.error('Operation in progress', 'A Realm operation is already running.'))

  let session = null

  try {
    await edit(interaction, panels.seedOperation(input, 'Connecting', 'Connecting to the Realm to retrieve its seed'))

    session = await connectRealm({ userId, input, accounts, config, whitelist })
    session.interaction = interaction
    sessions.add(userId, session)

    await edit(interaction, panels.seedOperation(session.info.id, 'Retrieving', 'Waiting for the Realm to provide its seed'))

    const rawSeed = await session.realm.getSeed({ timeout: config.joinTimeoutMs ?? 10_000 })
    const seed = toSignedSeed(rawSeed)

    await sessions.end(userId, 'Seed retrieved')
    sessions.release(userId)

    await edit(interaction, panels.seedCompleted(session.info.id, seed, chunkbaseUrl(seed)))
  } catch (error) {
    if (session) await sessions.end(userId, 'Seed retrieval failed').catch(() => {})
    sessions.release(userId)

    const reason = error instanceof UserError
      ? error.message
      : (error?.message || 'The Realm did not provide its seed.')

    if (!(error instanceof UserError)) log.error('Seed command failed', error)

    if (reason === 'Operations are disabled on this Realm because it has been added to the whitelist.') {
      await edit(interaction, panels.realmWhitelisted())
    } else {
      await edit(interaction, session
        ? panels.seedFailed(session.info.id, reason)
        : panels.error('Seed Retrieval Operation', reason))
    }
  }
}

module.exports = { data, execute, chunkbaseUrl }
