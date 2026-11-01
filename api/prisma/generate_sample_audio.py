import wave
import math
import struct
import os

sample_rate = 44100
duration = 10.0
num_samples = int(sample_rate * duration)

# Orthodox chime melody notes (frequencies in Hz: D4, F#4, A4, B4, A4, F#4, D4, A3)
notes = [293.66, 369.99, 440.00, 493.88, 440.00, 369.99, 293.66, 220.00]
note_duration = duration / len(notes)

audio_dir = os.path.join(os.getcwd(), 'api', 'uploads', 'mezmurs', 'audio')
os.makedirs(audio_dir, exist_ok=True)

output_wav = os.path.join(audio_dir, 'sample-orthodox-chime.wav')
# Also write to replace the fake 26-byte mp3 so existing seed records immediately play!
fake_mp3 = os.path.join(audio_dir, '52e00346-af48-4040-a726-9736d1bf81b1.mp3')

for target_file in [output_wav, fake_mp3]:
    with wave.open(target_file, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        
        frames = bytearray()
        for i in range(num_samples):
            t = i / sample_rate
            note_idx = min(int(t / note_duration), len(notes) - 1)
            freq = notes[note_idx]
            note_t = t % note_duration
            
            # Bell chime envelope
            envelope = math.exp(-3.5 * note_t / note_duration)
            
            # Harmonics
            sample = 0.6 * math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(4 * math.pi * freq * t) + 0.1 * math.sin(6 * math.pi * freq * t)
            val = int(sample * envelope * 22000)
            val = max(-32767, min(32767, val))
            frames.extend(struct.pack('<h', val))
            
        wav.writeframes(frames)
    print(f'Wrote {len(frames)} bytes to {target_file}')

print('Done!')
