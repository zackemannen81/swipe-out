"""Generate SwipeOut announcer WAVs using voice_creator.py and the original SoX chain."""
import argparse
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import wave

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
# Intentionally preserve the supplied recipe, including its distortion/gain stages.
FX1 = 'reverb 50 50 100 phaser chorus 0.6 0.9 55 0.45 0.25 2 -t flanger 3 gain 16 bandpass 700 2100 speed 1.6 contrast bend'.split()
FX2 = 'pitch -200 reverb 40 50 80 overdrive 15 15 bandpass 500 2500 gain 6'.split()


def load_clips(path):
    clips = json.loads(path.read_text(encoding='utf-8-sig'))['clips']
    if not isinstance(clips, list) or not clips:
        raise ValueError('Catalog must contain a non-empty clips array.')
    seen = set()
    for clip in clips:
        key = clip['id']
        if not isinstance(key, str) or not re.fullmatch(r'[a-z][a-z0-9_]*', key) or key in seen:
            raise ValueError(f'Invalid or duplicate clip id: {key!r}')
        if key in {'one', 'two', 'three', 'go'}:
            raise ValueError('Countdown clip IDs are reserved; keep the accepted countdown unchanged.')
        if not isinstance(clip['text'], str) or not clip['text'].strip():
            raise ValueError(f'Empty text: {key}')
        if not isinstance(clip['group'], str) or not clip['group'].strip():
            raise ValueError(f'Empty group: {key}')
        seen.add(key)
    return clips


def select_clips(clips, only, groups):
    known_ids = {c['id'] for c in clips}
    known_groups = {c['group'] for c in clips}
    unknown = set(only) - known_ids
    if unknown:
        raise ValueError('Unknown clip IDs: ' + ', '.join(sorted(unknown)))
    unknown = set(groups) - known_groups
    if unknown:
        raise ValueError('Unknown groups: ' + ', '.join(sorted(unknown)))
    result = [c for c in clips if (not only or c['id'] in only) and (not groups or c['group'] in groups)]
    if not result:
        raise ValueError('Selection contains no clips. --only and --group intersect.')
    return result


def commands(clip, work, args):
    return [
        [sys.executable, str(TOOLS / 'voice_creator.py'), '--text', clip['text'],
         '--voice', args.voice, '--pitch', str(args.pitch), '--speed', str(args.speed),
         '--output-file', str(work / 'voice.wav')],
        [args.sox, str(work / 'voice.wav'), str(work / 'effects.wav'), *FX1],
        [args.sox, str(work / 'effects.wav'), str(work / 'final.wav'), *FX2],
    ]


def validate_wav(path):
    with wave.open(str(path), 'rb') as audio:
        if audio.getnframes() == 0 or audio.getcomptype() != 'NONE':
            raise ValueError(f'Expected a non-empty PCM WAV: {path}')
        return audio.getnframes() / audio.getframerate()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog', type=Path, default=TOOLS / 'announcer-lines.json')
    parser.add_argument('--out', type=Path, default=ROOT / 'public/audio/announcer')
    parser.add_argument('--only', nargs='+', default=[], metavar='ID')
    parser.add_argument('--group', nargs='+', default=[], metavar='GROUP')
    parser.add_argument('--list', action='store_true', help='List selected lines without rendering')
    parser.add_argument('--dry-run', action='store_true', help='Print commands without network or file writes')
    parser.add_argument('--force', action='store_true', help='Replace existing selected WAVs after successful rendering')
    parser.add_argument('--voice', default='en-HK-SamNeural')
    parser.add_argument('--pitch', type=float, default=256, help='SoX pitch shift in cents, matching voice_creator')
    parser.add_argument('--speed', type=float, default=0.55)
    parser.add_argument('--sox', default='sox', help='SoX executable name or absolute path')
    args = parser.parse_args(argv)
    try:
        if not math.isfinite(args.speed) or args.speed <= 0 or not math.isfinite(args.pitch):
            raise ValueError('Speed must be positive and pitch/speed finite.')
        clips = select_clips(load_clips(args.catalog), args.only, args.group)
        if args.list:
            for clip in clips:
                print(f"{clip['group']:12} {clip['id']:24} {clip['text']}")
            print(f'{len(clips)} clips')
            return 0
        out = args.out.resolve()
        pending = []
        for clip in clips:
            target = out / (clip['id'] + '.wav')
            if target.exists() and not args.force:
                print(f'SKIP {target.name} (exists; use --force to replace)')
            else:
                pending.append(clip)
        if args.dry_run:
            for clip in pending:
                print(f"\n{clip['id']} -> {out / (clip['id'] + '.wav')}")
                for command in commands(clip, Path('<isolated-temp>'), args):
                    print(subprocess.list2cmdline(command))
            return 0
        if not pending:
            print('Nothing to generate.')
            return 0
        for executable in (args.sox, 'ffmpeg'):
            if not shutil.which(executable):
                raise ValueError(f'Missing executable: {executable}. Install it and add it to PATH.')
        for module in ('edge_tts', 'pysndfx'):
            if importlib.util.find_spec(module) is None:
                raise ValueError(f'Missing {module}. Run: {sys.executable} -m pip install edge-tts pysndfx')
        # pysndfx launches the name "sox" internally, including when --sox was provided.
        env = os.environ.copy()
        env['PATH'] = str(Path(shutil.which(args.sox)).parent) + os.pathsep + env.get('PATH', '')
        out.mkdir(parents=True, exist_ok=True)
        failures = []
        for index, clip in enumerate(pending, 1):
            print(f"[{index}/{len(pending)}] {clip['id']}: {clip['text']}", flush=True)
            try:
                # The old creator writes temp.mp3/temp.wav: isolate its cwd per clip.
                # Same-volume temporary output permits atomic replacement on success.
                with tempfile.TemporaryDirectory(prefix='.announcer-', dir=out) as tmp:
                    work = Path(tmp)
                    for command in commands(clip, work, args):
                        subprocess.run(command, cwd=work, env=env, check=True, timeout=180)
                    duration = validate_wav(work / 'final.wav')
                    os.replace(work / 'final.wav', out / (clip['id'] + '.wav'))
                    print(f"OK {clip['id']}.wav ({duration:.2f}s)", flush=True)
            except (OSError, subprocess.SubprocessError, ValueError, wave.Error) as error:
                failures.append(clip['id'])
                print(f"FAILED {clip['id']}: {error}", file=sys.stderr)
        print(f'Generated {len(pending)-len(failures)}/{len(pending)} clips in {out}')
        if failures:
            print('Retry failed IDs with --only ' + ' '.join(failures), file=sys.stderr)
        return 1 if failures else 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.error(str(error))


if __name__ == '__main__':
    raise SystemExit(main())

