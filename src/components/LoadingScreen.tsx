import Lottie from "lottie-react";
import loadingAnimation from "@/assets/loading-screen.json";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-56 h-56">
          <Lottie animationData={loadingAnimation} loop autoplay />
        </div>
        {/* <div className="text-center space-y-1">
          <p className="text-lg font-semibold tracking-wide">Loading your workspace</p>
          <p className="text-sm text-slate-200/80">Preparing assets and syncing data...</p>
        </div> */}
      </div>
    </div>
  );
}
