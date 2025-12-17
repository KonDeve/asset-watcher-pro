import Lottie from "lottie-react";
import planeAnimation from "@/assets/loading-plane.json";

interface PageLoaderProps {
  message?: string;
  isUsingSupabase?: boolean;
}

export function PageLoader({ message: _message, isUsingSupabase: _isUsingSupabase }: PageLoaderProps) {
  return (
    <div className="flex min-h-[100vh] items-center justify-center p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-100 h-100">
          <Lottie animationData={planeAnimation} loop autoplay />
        </div>
      </div>
    </div>
  );
}
