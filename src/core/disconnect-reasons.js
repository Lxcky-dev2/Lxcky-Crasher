//hi lol
const REASONS = {
  skin_issue: ['Skin rejected', 'The Realm rejected the bot\'s skin.'],
  unrecoverable_error: ['Connection error', 'Minecraft reported an unrecoverable connection error.'],
  edu_level_settings_missing: ['Realm settings error', 'The Realm is missing required Education Edition settings.'],
  legacy_disconnect: ['Disconnected', 'Minecraft closed the connection using a legacy disconnect reason.'],
  user_leave_game_attempted: ['Disconnected', 'The connection was closed because the client attempted to leave the game.'],
  cross_platform_disallowed: ['Cross-platform blocked', 'This Realm does not allow this platform to connect.'],
  client_settings_incompatible_with_server: ['Incompatible settings', 'The bot\'s client settings are not compatible with this Realm.'],
  no_premium_platform: ['Account restricted', 'This account does not have the required multiplayer entitlement.'],
  invalid_player: ['Invalid player', 'Minecraft rejected the player identity used for this connection.'],
  server_id_conflict: ['Connection conflict', 'Minecraft reported a conflicting server connection.'],
  unknown_packet: ['Protocol error', 'The Realm sent an unknown Minecraft packet.'],
  unexpected_packet: ['Protocol error', 'The Realm sent an unexpected Minecraft packet.'],
  invalid_command_request_packet: ['Command error', 'The Realm rejected a command request packet.'],
  login_packet_no_request: ['Login error', 'Minecraft did not provide the expected login request.'],
  login_packet_no_cert: ['Login error', 'Minecraft did not provide the required login certificate.'],
  missing_client: ['Login error', 'The Realm did not receive the expected client information.'],
  out_of_storage: ['Storage error', 'Minecraft reported that the client ran out of storage.'],
  invalid_level: ['World error', 'The Realm reported an invalid world level.'],
  disconnect_packet_deprecated: ['Protocol error', 'The Realm used a deprecated disconnect packet.'],
  searching_for_session_loading_screen_failed: ['Realm unavailable', 'Minecraft could not find the Realm session while loading.'],
  conn_protocol_version: ['Protocol mismatch', 'The connection protocol version is not compatible with the Realm.'],
  subsystem_status_error: ['Connection error', 'A Minecraft networking subsystem reported an error.'],
  empty_url_from_discovery: ['Sign in rejected', 'Microsoft did not provide a Realm discovery URL.'],
  unknown_signal_service_sign_in_failure: ['Sign in failed', 'The Realm signalling service rejected the sign-in.'],
  unspecified_client_instance_disconnection: ['Disconnected', 'Minecraft closed this client instance.'],
  conn_session_not_found: ['Realm offline', 'The Realm connection session could not be found.'],
  conn_create_peer_connection: ['Connection failed', 'Minecraft could not create the Realm network connection.'],
  conn_ice: ['Connection failed', 'Minecraft could not establish the network path to the Realm.'],
  conn_connect_request: ['Connection failed', 'Minecraft could not send the Realm connection request.'],
  conn_connect_response: ['Connection failed', 'Minecraft did not accept the Realm connection response.'],
  conn_negotiation_timeout: ['Connection timed out', 'Minecraft timed out while negotiating the Realm connection.'],
  conn_inactivity_timeout: ['Connection timed out', 'The Realm connection became inactive and timed out.'],
  stale_connection_being_replaced: ['Connection replaced', 'Minecraft replaced this Realm connection with a newer connection.'],
  realms_session_not_found: ['Realm offline', 'The Realm session could not be found.'],
  bad_packet: ['Protocol error', 'Minecraft rejected a malformed packet from the Realm.'],
  conn_failed_to_create_offer: ['Connection failed', 'Minecraft could not create the Realm connection offer.'],
  conn_failed_to_create_answer: ['Connection failed', 'Minecraft could not create the Realm connection answer.'],
  conn_failed_to_set_local_description: ['Connection failed', 'Minecraft could not configure the local Realm connection.'],
  conn_failed_to_set_remote_description: ['Connection failed', 'Minecraft could not configure the Realm connection received from the server.'],
  conn_negotiation_timeout_waiting_for_response: ['Connection timed out', 'The Realm did not respond during connection negotiation.'],
  conn_negotiation_timeout_waiting_for_accept: ['Connection timed out', 'The Realm did not accept the connection in time.'],
  conn_incoming_connection_ignored: ['Connection rejected', 'Minecraft ignored the incoming Realm connection.'],
  conn_signaling_parsing_failure: ['Signalling error', 'Minecraft could not parse the Realm signalling response.'],
  conn_signaling_unknown_error: ['Signalling error', 'The Realm signalling service returned an unknown error.'],
  conn_signaling_unicast_delivery_failed: ['Signalling error', 'Minecraft could not deliver the Realm signalling message.'],
  conn_signaling_broadcast_delivery_failed: ['Signalling error', 'Minecraft could not deliver the Realm signalling broadcast.'],
  conn_signaling_generic_delivery_failed: ['Signalling error', 'The Realm signalling service could not deliver a connection message.'],
  editor_mismatch_editor_world: ['World mismatch', 'The Realm world requires an incompatible editor connection.'],
  editor_mismatch_vanilla_world: ['World mismatch', 'The Realm world is incompatible with the requested editor connection.'],
  world_transfer_not_primary_client: ['World transfer rejected', 'The Realm rejected the world transfer because this is not the primary client.'],
  server_shutdown: ['Realm shutting down', 'The Realm server is shutting down.'],
  game_setup_cancelled: ['Game setup cancelled', 'Minecraft cancelled Realm world setup.'],
  game_setup_failed: ['Game setup failed', 'Minecraft could not finish setting up the Realm world.'],
  no_venue: ['Realm unavailable', 'Minecraft could not find an available Realm server.'],
  conn_signalling_sign_in_failed: ['Sign in failed', 'The Realm signalling service rejected the sign-in.'],
  session_access_denied: ['Access denied', 'The Realm session denied access to the linked account.'],
  service_sign_in_issue: ['Sign in failed', 'A Minecraft service rejected the linked account.'],
  conn_no_signaling_channel: ['Connection failed', 'Minecraft could not create a Realm signalling channel.'],
  conn_not_logged_in: ['Sign in rejected', 'The linked Minecraft account is not signed in.'],
  conn_client_signalling_error: ['Signalling error', 'The Minecraft client reported a Realm signalling error.'],
  sub_client_login_disabled: ['Login rejected', 'The Realm does not allow this client login.'],
  no_permissions: ['Access denied', 'The linked account is not allowed to join this Realm. Use an invite code, or ask the owner to invite the account.'],
  not_allowed: ['Access denied', 'The linked account is not allowed to join this Realm. Use an invite code, or ask the owner to invite the account.'],
  server_full: ['Realm full', 'This Realm is currently full. Try again later.'],
  realms_server_disabled: ['Realm closed', 'This Realm is currently closed by its owner. Try again later.'],
  realms_server_disabled_beta: ['Realm closed', 'This Realm is closed for players on this game version.'],
  realms_server_hidden: ['Realm closed', 'This Realm is currently hidden by its owner.'],
  realms_world_unassigned: ['Realm not set up', 'This Realm has not finished being set up yet.'],
  realms_server_cant_connect: ['Realm unavailable', 'The Realm server could not be reached. Try again in a moment.'],
  host_suspended: ['Realm suspended', 'The Realm owner\u2019s subscription is suspended.'],
  session_not_found: ['Realm offline', 'The Realm session could not be found. It may be offline or restarting.'],
  invite_session_not_found: ['Invite invalid', 'That invite session could not be found. Ask the owner for a fresh invite.'],
  conn_session_not_found: ['Realm offline', 'The Realm session could not be found. It may be offline or restarting.'],
  cant_connect: ['Could not connect', 'The bot could not connect to the Realm. Try again in a moment.'],
  cant_connect_no_internet: ['Connection lost', 'The bot lost its network connection while connecting.'],
  third_party_blocked: ['Connection blocked', 'The connection to the Realm was blocked by the network.'],
  third_party_no_internet: ['Connection lost', 'The bot lost its network connection while connecting.'],
  third_party_bad_ip: ['Could not connect', 'The Realm\u2019s address could not be reached.'],
  third_party_no_server_or_server_locked: ['Could not connect', 'The Realm server could not be reached, or is locked.'],
  server_not_found: ['Realm offline', 'The Realm server could not be found. It may be offline.'],
  local_server_not_found: ['Realm offline', 'The Realm server could not be found. It may be offline.'],
  timeout: ['Connection timed out', 'The Realm did not respond in time. Try again.'],
  loading_state_timeout: ['Connection timed out', 'The Realm took too long to load the world. Try again.'],
  connection_lost: ['Connection lost', 'The connection to the Realm was lost.'],
  zombie_connection: ['Connection lost', 'The connection to the Realm stopped responding.'],
  no_wifi: ['Connection lost', 'The bot lost its network connection.'],
  disconnected: ['Disconnected', 'The Realm disconnected the bot.'],
  kicked: ['Kicked', 'The bot was kicked from the Realm.'],
  kicked_for_idle: ['Kicked for being idle', 'The bot was removed from the Realm for being idle.'],
  kicked_for_exploit: ['Kicked', 'The bot was removed from the Realm for suspected exploiting.'],
  logged_in_other_location: ['Already connected', 'This linked account is already connected to the Realm somewhere else.'],
  version_mismatch: ['Version mismatch', 'The bot\u2019s Minecraft version does not match this Realm.'],
  outdated_client: ['Version mismatch', 'The bot\u2019s Minecraft version is older than what this Realm requires.'],
  outdated_server: ['Version mismatch', 'This Realm is running an older Minecraft version than the bot supports.'],
  edition_mismatch: ['Wrong edition', 'This Realm is not a Bedrock Edition Realm.'],
  edition_version_mismatch: ['Version mismatch', 'This Realm requires a different game version than the bot supports.'],
  level_newer_than_exe_version: ['Version mismatch', 'This Realm\u2019s world was created with a newer Minecraft version than the bot supports.'],
  banned_skin: ['Skin rejected', 'The Realm rejected the bot\u2019s skin.'],
  platform_locked_skins_error: ['Skin rejected', 'The Realm rejected the bot\u2019s skin.'],
  invalid_platform_skin: ['Skin rejected', 'The Realm rejected the bot\u2019s skin.'],
  resource_pack_problem: ['Resource pack error', 'The Realm requires a resource pack the bot could not load.'],
  incompatible_pack: ['Resource pack error', 'The Realm requires a resource pack the bot is not compatible with.'],
  resource_pack_loading_failed: ['Resource pack error', 'The Realm requires a resource pack the bot could not load.'],
  world_corruption: ['World error', 'The Realm reported that its world is corrupted.'],
  block_mismatch: ['World error', 'The Realm\u2019s world data does not match what the bot supports.'],
  invalid_heights: ['World error', 'The Realm\u2019s world data does not match what the bot supports.'],
  invalid_widths: ['World error', 'The Realm\u2019s world data does not match what the bot supports.'],
  shutdown: ['Realm shutting down', 'The Realm server is shutting down.'],
  multiplayer_disabled: ['Multiplayer disabled', 'Multiplayer is disabled for this account or Realm.'],
  not_authenticated: ['Sign in rejected', 'Microsoft rejected the linked account. Run `/account unlink` and then `/account link` again.'],
  invalid_tenant: ['Sign in rejected', 'Microsoft rejected the linked account. Run `/account unlink` and then `/account link` again.'],
  expired_auth_from_discovery: ['Sign in expired', 'The linked account\u2019s sign in expired. Run `/account unlink` and then `/account link` again.'],
  empty_auth_from_discovery: ['Sign in rejected', 'Microsoft rejected the linked account. Run `/account unlink` and then `/account link` again.'],
  xbl_join_lobby_failure: ['Could not connect', 'Xbox Live rejected the attempt to join this Realm.'],
  unknown: ['Disconnected', 'Minecraft closed the connection without giving a specific reason.'],
  no_reason: ['Disconnected', 'Minecraft closed the connection without a stated reason.'],

  no_fail_occurred: ['Disconnected', 'Minecraft reported no failure occurred.'],
  reason_not_set: ['Disconnected', 'Minecraft did not provide a specific disconnect reason.'],
  deep_link_trying_to_open_demo_world_while_signed_in: ['Join rejected', 'Minecraft rejected the attempt to open the demo world while signed in.'],
  async_join_task_denied: ['Join rejected', 'Minecraft rejected the Realm join task.'],
  realms_timeline_required: ['Realm data required', 'The Realm requires timeline data the client did not provide.'],
  guest_withough_host: ['Join rejected', 'The Realm owner is not present, so this guest cannot join.'],
  failed_to_join_experience: ['Join failed', 'Minecraft could not join the Realm experience.'],
  host_signed_out: ['Owner signed out', 'The Realm owner signed out and the session was ended.'],
  script_watchdog_exception: ['Realm script error', 'The Realm shut down after a script watchdog exception.'],
  script_memory_limit_exceeded: ['Realm script error', 'The Realm shut down after a script exceeded its memory limit.'],
  storage_low_during_gameplay: ['Realm storage low', 'The Realm reported low storage during gameplay.'],
  storage_full_during_gameplay: ['Realm storage full', 'The Realm reported that its storage is full.'],
  level_storage_corruption: ['World storage error', 'The Realm reported corruption in its world storage.'],
  edition_mismatch_vanilla_to_edu: ['Edition mismatch', 'This Realm requires Minecraft Education Edition.'],
  edition_mismatch_edu_to_vanilla: ['Edition mismatch', 'This Realm uses the regular Bedrock Edition, not Education Edition.'],
  editor_mismatch_editor_to_vanilla: ['Editor mismatch', 'This world is an editor project and cannot be joined normally.'],
  editor_mismatch_vanilla_to_editor: ['Editor mismatch', 'This Realm is running in editor mode.'],
  deny_listed: ['Access denied', 'This account is on the Realm block list.'],
  nonce_missing: ['Login rejected', 'Minecraft rejected the login handshake because its nonce was missing.'],
  nonce_not_found: ['Login rejected', 'Minecraft rejected the login handshake because its nonce was not found.'],
  nonce_expired: ['Login expired', 'The Minecraft login handshake nonce expired.'],
  nonce_not_valid: ['Login rejected', 'Minecraft rejected the login handshake because its nonce was invalid.'],
  host_disconnected: ['Owner disconnected', 'The Realm owner disconnected and this session ended.'],
  editor_join_intent_policy_failure: ['Editor join rejected', 'The Realm rejected the editor join intent.'],
  nethernet_identity_not_allowed: ['Connection rejected', 'The Realm did not allow this NetherNet identity.'],
  invalid_name: ['Invalid account name', 'Minecraft rejected the account name used for this connection.'],
  expired_token: ['Sign in expired', 'The Minecraft session token expired before the join completed.'],
  host_accepts_no_type_of_auth: ['Authentication rejected', 'The Realm host does not accept the authentication method used by this client.'],
  not_authenticated_fast_fail: ['Sign in rejected', 'Minecraft rejected the account authentication immediately.'],
  editor_not_allowed: ['Editor join rejected', 'This account is not allowed to join the Realm in editor mode.'],
  missing_structure_data: ['World data missing', 'The Realm did not provide required structure data.'],
  unsupported_transport: ['Connection failed', 'The Realm connection uses a transport this bot does not support.'],
}


const titleCase = value => String(value ?? '')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, char => char.toUpperCase())

const isTranslationKey = value => /^[a-zA-Z]+(\.[a-zA-Z0-9]+)+$/.test(value)

// data comes from the protocols disconnect packet { reason, message, filtered_message }
function describeDisconnect(data) {
  const reason = typeof data?.reason === 'string'
    ? data.reason.toLowerCase()
    : (Number.isInteger(data?.reason) ? `code_${data.reason}` : null)
  const rawMessage = typeof data?.message === 'string' ? data.message.trim() : ''
  const filteredMessage = typeof data?.filtered_message === 'string' ? data.filtered_message.trim() : ''
  const protocolMessage = rawMessage || filteredMessage

  const known = reason ? REASONS[reason] : null
  if (known) {
    // Always retain the exact Bedrock enum name the title is useful
    // for Discord, while the enum is the actual Minecraft disconnect reason.
    const detail = protocolMessage && !isTranslationKey(protocolMessage)
      ? `Minecraft reason: ${reason}\n${protocolMessage}`
      : `Minecraft reason: ${reason}`
    return { title: known[0], message: `${known[1]}\n\n${detail}`, reason, rawMessage: protocolMessage }
  }

  if (protocolMessage && !isTranslationKey(protocolMessage)) {
    return {
      title: 'Disconnected by the Realm',
      message: `Minecraft reason: ${reason || 'unknown'}\n${protocolMessage}`,
      reason,
      rawMessage: protocolMessage
    }
  }

  if (reason && !['no_reason', 'unknown', 'reason_not_set', 'no_fail_occurred'].includes(reason)) {
    return {
      title: titleCase(reason),
      message: `Minecraft reason: ${reason}`,
      reason,
      rawMessage: protocolMessage
    }
  }

  return {
    title: 'Disconnected by the Realm',
    message: 'Minecraft did not provide a more specific disconnect reason.',
    reason,
    rawMessage: protocolMessage
  }
}
module.exports = { describeDisconnect }
