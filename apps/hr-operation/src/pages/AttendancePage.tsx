import React, { useState, useRef, useCallback } from 'react';
import { Camera, MapPin, UploadCloud, Clock, CheckCircle2, History, AlertCircle, FileSpreadsheet } from 'lucide-react';

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'import' | 'history'>('checkin');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Chấm công</h1>
          <p className="text-sm text-slate-500 mt-1">Ghi nhận giờ vào/ra ca làm việc của bạn hoặc tải lên file từ máy chấm công</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100/50 p-1 rounded-xl w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => setActiveTab('checkin')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'checkin' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Camera className="w-4 h-4" /> Check-in Trực tuyến
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <History className="w-4 h-4" /> Lịch sử của tôi
        </button>
        <button 
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'import' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <UploadCloud className="w-4 h-4" /> Import Dữ liệu
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[500px]">
        {activeTab === 'checkin' && <CheckInTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'import' && <ImportTab />}
      </div>
    </div>
  );
};

const CheckInTab = () => {
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update clock
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Không thể truy cập camera. Vui lòng cấp quyền.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  // Stop camera when unmounting
  React.useEffect(() => {
    return stopCamera;
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const getLocation = () => {
    setLocating(true);
    setLocError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocating(false);
        },
        (error) => {
          setLocError("Không thể lấy vị trí. Vui lòng cấp quyền GPS.");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocError("Trình duyệt không hỗ trợ GPS.");
      setLocating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Left panel: Clock & Info */}
      <div className="w-full md:w-1/3 border-r border-slate-100 p-8 flex flex-col justify-center items-center bg-slate-50/50">
        <div className="text-center mb-8">
          <div className="text-5xl font-extrabold text-slate-800 tracking-tight font-mono">
            {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl text-slate-400 ml-1">{time.toLocaleTimeString('vi-VN', { second: '2-digit' })}</span>
          </div>
          <div className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">
            {time.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Ca hiện tại</p>
                <p className="text-sm font-bold text-slate-800">Ca Hành Chính</p>
                <p className="text-xs text-slate-500 mt-0.5">08:00 - 17:30</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="w-full">
                <p className="text-xs font-semibold text-slate-400 uppercase">Vị trí (GPS)</p>
                {location ? (
                  <p className="text-sm font-medium text-emerald-700 mt-0.5">Đã xác nhận ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</p>
                ) : locError ? (
                  <p className="text-sm font-medium text-red-500 mt-0.5">{locError}</p>
                ) : (
                  <button onClick={getLocation} disabled={locating} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-0.5 underline decoration-indigo-300 underline-offset-2">
                    {locating ? 'Đang lấy vị trí...' : 'Nhấp để xác nhận vị trí'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Camera & Action */}
      <div className="w-full md:w-2/3 p-8 flex flex-col justify-center items-center">
        
        <div className="w-full max-w-md aspect-video md:aspect-[4/3] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-inner">
          {photo ? (
            <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
          ) : cameraActive ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-slate-600">Yêu cầu chụp ảnh chân dung (Selfie) để chấm công.</p>
              <button 
                onClick={startCamera}
                className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Mở Camera
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          {cameraActive && !photo && (
            <button 
              onClick={takePhoto}
              className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" /> Chụp ảnh
            </button>
          )}
          {photo && (
            <>
              <button 
                onClick={retakePhoto}
                className="w-full sm:w-1/3 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Chụp lại
              </button>
              <button 
                disabled={!location}
                className="w-full sm:w-2/3 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> 
                {location ? 'Xác nhận Check-in' : 'Cần lấy GPS trước'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ImportTab = () => {
  return (
    <div className="p-10 flex flex-col justify-center items-center h-full min-h-[500px]">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600 border border-indigo-100 shadow-sm">
        <FileSpreadsheet className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Nhập dữ liệu chấm công</h2>
      <p className="text-slate-500 mb-8 max-w-md text-center text-sm leading-relaxed">
        Hỗ trợ tải lên file Excel/CSV xuất ra từ máy chấm công vân tay, khuôn mặt. Hệ thống sẽ tự động map mã nhân viên và thời gian.
      </p>
      
      <div className="w-full max-w-lg border-2 border-dashed border-indigo-200 rounded-2xl p-10 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors text-center cursor-pointer group">
        <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-4 group-hover:text-indigo-600 transition-colors" />
        <p className="text-sm font-medium text-indigo-900">Kéo thả file vào đây hoặc <span className="text-indigo-600 underline">chọn file</span></p>
        <p className="text-xs text-indigo-400 mt-2">Hỗ trợ .csv, .xlsx, .xls (Tối đa 5MB)</p>
      </div>
    </div>
  );
};

const HistoryTab = () => {
  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <History className="w-4 h-4" /> Lịch sử 7 ngày gần nhất
      </div>
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-slate-400 uppercase">T{i+2}</span>
                <span className="text-lg font-bold text-slate-800">1{i}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Ca Hành Chính</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> In: 07:55</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Out: 17:40</span>
                </div>
              </div>
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
                Đủ công
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttendancePage;
