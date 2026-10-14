
import asyncio
import argparse
import os
import sys
from edge_tts import Communicate
from pysndfx import AudioEffectsChain
import subprocess

# Define constants for temporary file and default voice
TEMP_FILE = "temp.mp3"
DEFAULT_VOICE = "en-US-AriaNeural"

async def generate_speech(text: str, voice: str, output_path: str) -> None:
    """
    Generates speech from text using edge-tts and saves it to a file.
    """
    try:
        communicate = Communicate(text, voice)
        await communicate.save(output_path)
    except Exception as e:
        print(f"Error during TTS generation: {e}", file=sys.stderr)
        sys.exit(1)

def apply_effects(input_path: str, output_path: str, pitch: float, speed: float) -> None:
    """
    Applies audio effects to the input file and saves it to the output file.
    """
    try:
        # Convert MP3 to WAV for pysndfx processing
        wav_path = "temp.wav"
        subprocess.run(["ffmpeg", "-i", input_path, "-y", wav_path], check=True)

        # Apply effects
        fx = AudioEffectsChain().pitch(pitch).speed(speed)
        fx(wav_path, output_path)

        # Clean up temporary WAV file
        os.remove(wav_path)
    except Exception as e:
        print(f"Error applying audio effects: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    """
    Main function to parse arguments and orchestrate the voice creation process.
    """
    parser = argparse.ArgumentParser(description="Generate speech from text with audio effects.")
    parser.add_argument("--text", type=str, required=True, help="The text to convert to speech.")
    parser.add_argument("--output-file", type=str, default="output.wav", help="The path to save the final WAV file.")
    parser.add_argument("--voice", type=str, default=DEFAULT_VOICE, help=f"The voice to use for TTS. Default: {DEFAULT_VOICE}")
    parser.add_argument("--pitch", type=float, default=0, help="Pitch adjustment in semitones. Can be positive or negative.")
    parser.add_argument("--speed", type=float, default=1.0, help="Speed adjustment factor. >1.0 is faster, <1.0 is slower.")
    parser.add_argument("--easteregg", type=float, default=1.0, help="No santa this year?")
    args = parser.parse_args()

    # Ensure the output is a WAV file
    if not args.output_file.lower().endswith(".wav"):
        print("Error: Output file must have a .wav extension.", file=sys.stderr)
        sys.exit(1)

    # --- Core Logic ---
    try:
        # Step 1: Generate speech and save as temporary MP3
        asyncio.run(generate_speech(args.text, args.voice, TEMP_FILE))

        # Step 2: Apply effects and save as final WAV
        apply_effects(TEMP_FILE, args.output_file, args.pitch, args.speed)

        print(f"Successfully created audio file: {args.output_file}")

    finally:
        # Step 3: Clean up the temporary MP3 file
        if os.path.exists(TEMP_FILE):
            os.remove(TEMP_FILE)

if __name__ == "__main__":
    main()
