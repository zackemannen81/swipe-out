# Lägg i ditt script eller i ~/.bashrc

makeVoiceSample() {
  if [ $# -eq 0 ]; then
    echo "Användning: makeVoiceSample \"lång textsträng här\""
    return 2
  fi

  # 1) Ta hela texten (alla argument), trimma kringliggande whitespace
  local text="$*"
  text="$(printf '%s' "$text" | xargs)"

  # 2) Bygg ett filvänligt namn (gemener, translitterering, [a-z0-9] och _)
  local clean
  clean="$(printf '%s' "$text" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[åä]/a/g; s/ö/o/g; s/[éè]/e/g; s/ü/u/g; s/ß/ss/g')"

  # Försök ASCII-translitterera resten om iconv finns
  if command -v iconv >/dev/null 2>&1; then
    clean="$(printf '%s' "$clean" | iconv -f utf8 -t ascii//TRANSLIT 2>/dev/null || printf '%s' "$clean")"
  fi

  # Ersätt allt som inte är a-z0-9 med underscore, slå ihop __, trimma _, korta till 32 tecken
  clean="$(printf '%s' "$clean" \
    | sed -E 's/[^a-z0-9]+/_/g; s/_+/_/g; s/^_|_$//g')"
  clean="${clean:0:32}"

  local filename="${clean}.wav"

  # 3) Skapa wav med TTS
  # Om din voice_creator.py stöder --out, använd den, annars flytta output.wav
  if python3 voice_creator.py --text "$text" --voice "en-US-AriaNeural" --pitch "-128" --out "output.wav" 2>/dev/null; then
    :
  else
    python3 voice_creator.py --text "$text" --voice "en-US-AriaNeural" --pitch "-128"
  fi

  if [ ! -s "output.wav" ]; then
    echo "Kunde inte hitta 'output.wav' från voice_creator.py"
    return 3
  fi

  # 4) Snygg, stabil sox-kedja (din gamla rad innehöll effekter med fel parametrar)
  # - gain -n      : normalisera
  # - reverb 30    : lite rymd
  # - bass +2, treble +1 : lätt polering
  sox "output.wav" "$filename" gain -n reverb 30 bass +2 treble +1 flanger 2
  rm -f "output.wav"
  echo "✅ Sparade: $filename"
}

