"""Offline checks for selection and safe batch output; no TTS/network calls."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import wave

spec = importlib.util.spec_from_file_location('announcer', Path(__file__).with_name('generate-announcer.py'))
app = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app)

class AnnouncerTests(unittest.TestCase):
    def test_catalog_and_selection(self):
        clips = app.load_clips(app.TOOLS / 'announcer-lines.json')
        self.assertEqual(len(clips), 49)
        self.assertEqual(app.select_clips(clips, ['weapon_acquired'], [])[0]['text'], 'Weapon acquired.')
        with self.assertRaises(ValueError):
            app.select_clips(clips, ['typo'], [])
        with self.assertRaises(ValueError):
            app.select_clips(clips, ['weapon_acquired'], ['cup'])

    def test_reject_unsafe_ids(self):
        with tempfile.TemporaryDirectory() as folder:
            catalog = Path(folder) / 'catalog.json'
            for key in ['../escape', 'go', 'one']:
                catalog.write_text(json.dumps({'clips':[dict(id=key, text='Test', group='test')]}))
                with self.assertRaises(ValueError):
                    app.load_clips(catalog)

    def test_dry_run_no_writes_or_processes(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(app.subprocess, 'run') as run:
            target = Path(folder) / 'new'
            self.assertEqual(app.main(['--only','weapon_acquired','--dry-run','--out',str(target)]),0)
            self.assertFalse(target.exists())
            run.assert_not_called()

    def test_skip_preserves_existing(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(app.subprocess, 'run') as run:
            target = Path(folder) / 'weapon_acquired.wav'
            target.write_bytes(b'original')
            self.assertEqual(app.main(['--only','weapon_acquired','--out',folder]),0)
            self.assertEqual(target.read_bytes(), b'original')
            run.assert_not_called()

    def test_force_failure_preserves_original_and_cleans_temps(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(app.shutil,'which',return_value='C:/tools/sox.exe'), patch.object(app.importlib.util,'find_spec',return_value=True), patch.object(app.subprocess,'run',side_effect=OSError('injected failure')):
            target = Path(folder) / 'weapon_acquired.wav'
            target.write_bytes(b'original')
            self.assertEqual(app.main(['--only','weapon_acquired','--out',folder,'--force']),1)
            self.assertEqual(target.read_bytes(),b'original')
            self.assertEqual(list(Path(folder).iterdir()),[target])

    def test_success_publishes_valid_wav(self):
        def fake_run(command, **kwargs):
            if command[2].endswith('final.wav'):
                with wave.open(command[2],'wb') as audio:
                    audio.setparams((1,2,24000,0,'NONE','not compressed'))
                    audio.writeframes(b'\0\0'*2400)
        with tempfile.TemporaryDirectory() as folder, patch.object(app.shutil,'which',return_value='C:/tools/sox.exe'), patch.object(app.importlib.util,'find_spec',return_value=True), patch.object(app.subprocess,'run',side_effect=fake_run):
            self.assertEqual(app.main(['--only','weapon_acquired','--out',folder]),0)
            self.assertEqual(app.validate_wav(Path(folder)/'weapon_acquired.wav'),0.1)
            self.assertEqual(len(list(Path(folder).iterdir())),1)

if __name__ == '__main__':
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        result = unittest.TextTestRunner(stream=__import__('sys').__stderr__,verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(AnnouncerTests))
    raise SystemExit(not result.wasSuccessful())
