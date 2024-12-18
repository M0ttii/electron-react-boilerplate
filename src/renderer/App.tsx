import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Camera, Monitor, Wind } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  thumbnail: Electron.NativeImage;
}

function Hello() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    getSources();
  }, []);

  const getSources = async () => {
    try {
      const sources = await window.electron.desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 200 }
      });
      console.log('Available sources:', sources);
      setSources(sources);
    } catch (error) {
      console.error('Error getting sources:', error);
      alert('Failed to get screen capture sources. Please try again.');
    }
  };

  const startCapture = async (sourceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'desktop'
          }
        },
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
            frameRate: { ideal: 30, max: 60 }
          }
        }
      } as any);

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9'
      });

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `screen-recording-${timestamp}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting capture:', error);
      alert('Failed to start recording. Please make sure you have granted the necessary permissions.');
    }
  };

  const stopCapture = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Screen Capture</h1>
            <div className="flex space-x-2">
              <Camera className="w-6 h-6 text-gray-600" />
              <Monitor className="w-6 h-6 text-gray-600" />
              <Wind className="w-6 h-6 text-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedSource === source.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSource(source.id)}
              >
                <img
                  src={source.thumbnail.toDataURL()}
                  alt={source.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                  <p className="text-sm truncate">{source.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            {!recording ? (
              <button
                onClick={() => selectedSource && startCapture(selectedSource)}
                disabled={!selectedSource}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopCapture}
                className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
