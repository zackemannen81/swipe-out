# Tour Bus — supplied audio and crew presentations

Imported 2026-11-10 from `C:/Users/zakri/Desktop/tourbus` into
`public/audio/tourbus`, preserving names, bytes and README. 27 files / 87,067,935
bytes (26 MP3 + README). All copied hashes match; all MP3s decode with FFmpeg.

## Recording coverage

README is the script source; run `node tools/import-tour-intros.mjs` after updating
it or adding numbered voice files. This generates `src/tour-intros.json`.
Available: 00–15. Recordings 16 and 16B are reserved for personal narration by Zacke and will be supplied later; do not generate replacements.
The five playable rooms all have a voice recording. Actual voice durations are
33.7–62.2 seconds; no assumed 15–30 second timer truncates them.
Unavailable rooms do not auto-play or appear in the discovered-presentation list.
The restricted scripts remain outside ordinary discovery.

## First visit and archive

After the camera settles, show Welcome Aboard (00) once, followed by the room
introduction. Store `visitedZoneIntros[id] = true` when its exact transcript is
shown. Old profiles get an empty map; unknown keys and non-true values are removed
on normalization. Save failures use the existing progress warning and retain the
in-memory flag. Skipping also counts as shown. No rewards are awarded by intros.

Holographic information panel: heading, FIRST VISIT / ARCHIVE REPLAY, room and
deck, scrollable exact transcript, Play Voice and Space/Enter skip button.
Escape dismisses information before room navigation. Touch uses buttons.
Voice end closes the presentation. Missing files or blocked playback leave text
readable; Play Voice retries on a gesture. No fabricated speech or TTS fallback.

ARCHIVE · CREW INFORMATION is an information overlay accessible in every playable
room, not a newly built Archive room. It replays discovered scripts, offers all
nine music/hymn tracks, and manually plays the supplied shipwide announcement.
The standalone announcement has no corresponding README transcript; only numbered
room presentations claim exact text synchronization. Text is full-script, not
word-timed subtitles.

## Music mapping and lifecycle

| Room | Automatic music |
| --- | --- |
| Grand Hangar | welcome_to_the_tour_bus.mp3 |
| Service Bay | the_garage-upgrades.mp3 |
| Tournament Nexus | interstellar_cruizer.mp3 |
| Pilots’ Lounge | mashup_loosing_the_bet_of_life.mp3 |
| Observation Deck | endless_darkness.mp3 |

All remaining tracks are selectable in the archive: say_godbye_to_your_world,
exited_in_vain-welcome, the_harvester (public label Engineering Theme) and the
welcome hymn. These assignments are initial production choices based on filenames;
source audio is not shortened or remixed. Automatic selects per-room music;
manual selection lasts for the current page session. One music element loops;
one voice element handles presentation or announcement without overlap.

Music follows Music & Trailer volume; speech follows Sound Effects volume; Mute
applies to both. While a voice is active, music is 18% of selected volume.
End, skip, navigation, error and leaving the bus restore the normal mix. Leaving
the bus or hiding the tab stops voice and pauses music. Visibility returns resume
music; interrupted text remains accessible in the archive. Race and trailer audio
retain their existing owners. Autoplay failure retries only on user gestures,
not every frame. Resources/listeners are removed during disposal.

## Verification boundaries

Codec decoding and browser media playback/volume checks do not establish final
subjective loudness balance. Headphone/speaker listening and physical mobile audio
remain author checks. All unbuilt rooms remain unavailable; surface visits mentioned
in the supplied narration are future design, not enabled by this integration.

## Service Bay garage continuity
The garage opened from Service Bay is part of the same audio zone. Workshop music
and active speech continue uninterrupted while platform/work-view fades run.
Leaving via another room or the home menu follows the existing stop/switch rules.
