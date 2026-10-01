interface NDEFRecord {
  recordType: string;
  data?: BufferSource;
}

interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (
    type: "reading" | "readingerror",
    listener: (event: NDEFReadingEvent) => void,
    options?: AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: "reading" | "readingerror",
    listener: (event: NDEFReadingEvent) => void,
    options?: EventListenerOptions,
  ) => void;
}

interface NDEFReaderConstructor {
  new (): NDEFReader;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetector {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: BarcodeDetectorOptions): BarcodeDetector;
}

interface Window {
  NDEFReader?: NDEFReaderConstructor;
  BarcodeDetector?: BarcodeDetectorConstructor;
}
