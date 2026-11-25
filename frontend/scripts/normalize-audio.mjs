#!/usr/bin/env node
/**
 * Peak-normalize every PAMANA voiceover to -1.0 dBFS with a clear vocal EQ.
 *
 * Two passes per file:
 *   1. volumedetect after the EQ chain reports the current peak.
 *   2. the exact inverse gain is applied, followed by a -1 dBFS limiter as a
 *      safety net, and the file is re-encoded as 192 kbps / 44.1 kHz MP3.
 *
 * Usage:
 *   npm run normalize:audio          # rewrite all voice clips
 *   npm run normalize:audio -- --check  # report peaks, change nothing
 *   npm run normalize:audio -- --dry-run # show the ffmpeg plan, change nothing
 *
 * ffmpeg is resolved from FFMPEG_PATH, then the local ffmpeg-static package,
 * then the system PATH. The binary must include libmp3lame.
 */
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const TARGET_DBFS = -1.0
const LIMITER_LINEAR = 0.891 // 10 ^ (-1 / 20), a -1 dBFS ceiling
const EQ =
  "highpass=f=90," + // remove table/fan rumble
  "equalizer=f=250:t=q:w=1:g=-2," + // reduce boxy mud
  "equalizer=f=3200:t=q:w=1:g=3," + // lift speech presence
  "highshelf=f=6500:g=-3" // tame sharp sibilants

const AUDIO_ROOTS = [
  "public/audio",
  path.join("public", "static", "assets", "audio", "npc"),
  path.join("src", "components", "music"),
]

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)

async function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH
  try {
    const mod = await import("ffmpeg-static")
    const binary = mod.default ?? mod
    if (typeof binary === "string" && existsSync(binary)) return binary
  } catch {
    // Fall through to a system ffmpeg.
  }
  return "ffmpeg"
}

function listMp3Files(dir) {
  const found = []
  if (!existsSync(dir)) return found
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...listMp3Files(full))
    else if (
      entry.toLowerCase().endsWith(".mp3") &&
      !entry.endsWith(".normalized.tmp.mp3")
    ) {
      found.push(full)
    }
  }
  return found
}

function run(ffmpeg, args) {
  const result = spawnSync(ffmpeg, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(
      `ffmpeg exited ${result.status}: ${(result.stderr || "").slice(-1200)}`
    )
  }
  return result.stderr || ""
}

/** Returns the peak dBFS reported by volumedetect after the EQ chain. */
function measurePeak(ffmpeg, file, filter) {
  const filters = filter ? `${filter},volumedetect` : "volumedetect"
  const output = run(ffmpeg, [
    "-hide_banner",
    "-nostats",
    "-i",
    file,
    "-af",
    filters,
    "-f",
    "null",
    "-",
  ])
  const match = output.match(/max_volume:\s*(-?[\d.]+|-inf)\s*dB/)
  if (!match) throw new Error(`Could not read peak for ${file}`)
  const value = Number.parseFloat(match[1])
  return Number.isFinite(value) ? value : -Infinity
}

async function main() {
  const args = process.argv.slice(2)
  const checkOnly = args.includes("--check")
  const dryRun = args.includes("--dry-run")
  const ffmpeg = await resolveFfmpeg()

  const files = AUDIO_ROOTS.flatMap((root) =>
    listMp3Files(path.join(projectRoot, root))
  ).sort()

  if (files.length === 0) throw new Error("No .mp3 assets found")

  // A previous interrupted run may have left encoded temps behind.
  for (const file of files) {
    const temp = `${file}.normalized.tmp.mp3`
    if (existsSync(temp)) rmSync(temp)
  }

  console.log(`ffmpeg: ${ffmpeg}`)
  console.log(`Found ${files.length} MP3 assets; target peak ${TARGET_DBFS} dBFS`)

  let normalized = 0
  let skipped = 0
  let outsideTarget = 0

  for (const file of files) {
    const relative = path.relative(projectRoot, file)
    // After normalization the EQ is already baked in, so verify the raw peak.
    const peak = measurePeak(ffmpeg, file, checkOnly ? "" : EQ)

    if (!Number.isFinite(peak)) {
      console.warn(`  skip (silent): ${relative}`)
      skipped++
      continue
    }

    if (checkOnly) {
      if (Math.abs(peak - TARGET_DBFS) > 0.5) {
        console.log(`  ${peak.toFixed(1)} dBFS  ${relative}`)
        outsideTarget++
      }
      continue
    }

    let gain = TARGET_DBFS - peak
    if (dryRun) {
      console.log(`  ${relative}: ${peak.toFixed(1)} dBFS -> ${gain.toFixed(1)} dB`)
      continue
    }

    const temp = `${file}.normalized.tmp.mp3`
    const encode = (level) =>
      run(ffmpeg, [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        file,
        "-af",
        // level=0 is essential: the limiter's auto-level default would lift the
        // result back to 0 dBFS and defeat the -1 dBFS target.
        `${EQ},volume=${level.toFixed(2)}dB,alimiter=limit=${LIMITER_LINEAR}:level=0,aresample=44100`,
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        "-map_metadata",
        "0",
        temp,
      ])

    encode(gain)
    let finalPeak = measurePeak(ffmpeg, temp, "")
    // MP3 encoding can overshoot by ~1 dB on already-hot material (e.g. the
    // looping background music). Re-encode from the ORIGINAL with more
    // headroom rather than stacking a second EQ pass.
    let corrections = 0
    while (
      Number.isFinite(finalPeak) &&
      Math.abs(finalPeak - TARGET_DBFS) > 0.3 &&
      corrections < 3
    ) {
      gain += TARGET_DBFS - finalPeak - 0.2
      encode(gain)
      finalPeak = measurePeak(ffmpeg, temp, "")
      corrections++
    }

    if (!Number.isFinite(finalPeak) || Math.abs(finalPeak - TARGET_DBFS) > 0.5) {
      console.warn(
        `  warning: ${relative} finished at ${finalPeak.toFixed(1)} dBFS`
      )
    }
    renameSync(temp, file)
    normalized++
  }

  if (checkOnly) {
    console.log(`${outsideTarget} of ${files.length} files outside +/-0.5 dBFS`)
    if (outsideTarget > 0) process.exitCode = 1
  } else if (!dryRun) {
    console.log(`Normalized ${normalized} files (${skipped} silent/skipped)`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
