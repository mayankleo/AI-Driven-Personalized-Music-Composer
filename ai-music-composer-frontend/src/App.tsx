import socket from './service';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import MidiPlayerJS from 'midi-player-js';
import * as Tone from 'tone';


const App = () => {

  const [midiFile, setMidiFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timepased, setTimepased] = useState(0);

  const midiPlayerRef = useRef<MidiPlayerJS.Player | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const midiStartTime = useRef<number | null>(null);

  useEffect(() => {

    socket.on('data', (filename) => {
      console.log('filename received: ', filename);
      downloadFile(filename)
    });

    socket.on('logs', (logmessage) => {
      console.log('Server log: ', logmessage);
    });

  }, []);

  const generateMusic = () => {
    console.log('sending generate music request');
    socket.emit('data', "generate music");
  };

  const downloadFile = async (filename: string) => {
    try {
      console.log('sending file request:', filename);
      const response = await axios.post('http://127.0.0.1:5000/getfile', {
        file_name: filename,
      }, {
        responseType: 'blob',
      });

      const file = new File([response.data], filename, { type: 'audio/midi' });
      setMidiFile(file);
      console.log('file received:', file);
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
  };

  // *****************************************************
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

      const player = new MidiPlayerJS.Player((event) => {
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

          player.on('midiEvent', (event) => {
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
  // *****************************************************

  const convertSecondsToMinutesSeconds = (totalSeconds: number): string => {
    if (totalSeconds>=0) {   
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.round(totalSeconds % 60);
      const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${formattedMinutes}:${formattedSeconds}`;
    }else{
      return `00:00`;
    }
  }

  return (
    <div className='container h-screen m-auto flex justify-center items-center text-white'>
      <div className='flex flex-col gap-12'>
        <h1 className='text-5xl'>LSTM Based Music Model</h1>
        <button onClick={generateMusic}>Generate Music</button>
        <div className='flex flex-col gap-8'>
          <input
            className='block w-full text-sm text-white bg-black rounded-lg border border-[#80bf40] cursor-pointer focus:outline-none'
            type="file"
            accept=".mid"
            onChange={handleFileChange}
          />
          <div className='flex flex-col gap-4'>
            <div className='flex gap-4 items-center'>
              <p>{convertSecondsToMinutesSeconds(timepased)}</p>
              <progress className='progress-bar w-full rounded-full overflow-hidden' value={progress} max="100" />

              <p>{convertSecondsToMinutesSeconds(duration)}</p>
            </div>
            <div className='flex gap-5 justify-center'>
              <button onClick={playMidi} disabled={isPlaying || !midiFile}>Play</button>
              <button onClick={pauseMidi} disabled={!isPlaying}>Pause</button>
              <button onClick={stopMidi} disabled={!midiFile}>Stop</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
