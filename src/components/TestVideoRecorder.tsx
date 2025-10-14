import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const TestVideoRecorder = () => {
  console.log('TestVideoRecorder rendering');

  return (
    <div className="p-4">
      <h1>Test Video Recorder</h1>
      <p>If you can see this, the basic component structure is working.</p>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This is a test component to isolate the rendering issue.
        </AlertDescription>
      </Alert>
    </div>
  );
};