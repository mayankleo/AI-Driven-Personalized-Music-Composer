import { useState, useEffect, useRef } from 'react';
import MidiPlayerJS from 'midi-player-js';
import * as Tone from 'tone';

const MidiPlayer = () => {
  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timepased, setTimepased] = useState(0);

  const midiPlayerRef = useRef<MidiPlayerJS.Player | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const midiStartTime = useRef<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMidiFile(e.target.files[0]);
      setProgress(0);
      setIsPlaying(false);
      if (midiPlayerRef.current) midiPlayerRef.current.stop(); // Stop if another file was loaded before
    }
  };

  useEffect(() => {
    if (midiFile) {
      const synth = new Tone.PolySynth().toDestination(); // Use PolySynth to play notes
      synthRef.current = synth;

      const player = new MidiPlayerJS.Player((event: any) => {
        if (event.name === 'Note on') {
          // Trigger attack (note on)
          const duration = event.duration || 0.5; // Default duration
          synth.triggerAttackRelease(
            Tone.Frequency(event.noteNumber, 'midi').toFrequency(),
            duration
          );
        }
      });

      midiPlayerRef.current = player;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const base64String = (e.target.result as string).split(',')[1];
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);

          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          player.loadArrayBuffer(bytes.buffer);

          // Set duration after loading MIDI file
          player.on('endOfFile', () => {
            setIsPlaying(false);
            setProgress(100);
          });

          player.on('midiEvent', (event: any) => {
            const totalTime = player.getSongTime();
            const remainingTime = player.getSongTimeRemaining();
            // console.log('currentTime :>> ', (totalTime - remainingTime), totalTime);
            setTimepased(totalTime - remainingTime)
            setProgress(((totalTime - remainingTime) / totalTime) * 100);
          });

          setDuration(player.getSongTime());
        }
      };
      reader.readAsDataURL(midiFile);
    }
  }, [midiFile]);

  const playMidi = () => {
    if (!isPlaying) {
      Tone.start().then(() => {
        midiPlayerRef.current?.play();
        midiStartTime.current = Date.now();
        setIsPlaying(true);
      });
    }
  };

  const pauseMidi = () => {
    if (isPlaying) {
      midiPlayerRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const stopMidi = () => {
    if (midiPlayerRef.current) {
      midiPlayerRef.current.stop();
      synthRef.current?.releaseAll(); // Release all synth notes
      setIsPlaying(false);
      setTimepased(0);
      setProgress(0);
    }
  };

  return (
    <div>
      <input type="file" accept=".mid" onChange={handleFileChange} />
      <button onClick={playMidi} disabled={isPlaying || !midiFile}>
        Play
      </button>
      <button onClick={pauseMidi} disabled={!isPlaying}>
        Pause
      </button>
      <button onClick={stopMidi} disabled={!midiFile}>
        Stop
      </button>
      <div>
        <progress value={progress} max="100" />
        {duration > 0 && (
          <>
            <p>Current Duration: {timepased.toFixed(0)} seconds</p>
            <p>Total Duration: {duration.toFixed(0)} seconds</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MidiPlayer;
