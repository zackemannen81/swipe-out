makefile()
{
clean=$(echo "$input" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g' | sed -E 's/^_|_$//g')
filename=”${clean}.wav”
python3 voice_creator.py --text '' --voice='en-US-AriaNeural' --pitch=256 --speed 0.5
sox output.wav outputsfx.wav reverb 50 50 100 phaser chorus 0.6 0.9 55 0.45 0.25 2 -t flanger 3 gain 16 bandpass 700 2100 speed 1.6 contrast bend
rm output.wav
}
