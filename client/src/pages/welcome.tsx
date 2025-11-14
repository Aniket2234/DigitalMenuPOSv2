import { Utensils, Store } from "lucide-react";
import { useLocation } from "wouter";
import { useWelcomeAudio } from "../hooks/useWelcomeAudio";
import { MediaPreloader } from "../components/media-preloader";
import { useState, useEffect, useCallback } from "react";
import { useCustomer } from "@/contexts/CustomerContext";
import { CustomerRegistrationDialog } from "@/components/customer-registration-dialog";
import { ISTClock } from "@/components/ist-clock";
import backgroundImage from "/background.png";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { customer } = useCustomer();
  const { hasPlayedAudio, audioError, isReady } = useWelcomeAudio();
  const [mediaReady, setMediaReady] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);

  // Detect screen size and calculate scale factor
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenDimensions({ width, height });

      // Calculate scale factor based on screen size for better screen utilization
      // Base dimensions: 384px width, optimized for mobile screens

      // Scale up for better screen utilization while maintaining proportions
      if (height < 600) {
        setScaleFactor(0.85);
      } else if (height < 700) {
        setScaleFactor(1.0);
      } else if (height < 800) {
        setScaleFactor(1.1);
      } else if (height < 900) {
        setScaleFactor(1.2);
      } else {
        setScaleFactor(1.3);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);


  // Calculate responsive container height - use more screen space
  const containerHeight = Math.min(screenDimensions.height * 0.98, screenDimensions.height - 20);

  const handleViewMenuClick = () => {
    if (customer) {
      setLocation("/menu");
    } else {
      setShowRegistrationDialog(true);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center" style={{ backgroundColor: '#FFF5F2' }}>
      {/* Customer Registration Dialog */}
      <CustomerRegistrationDialog 
        open={showRegistrationDialog}
        onOpenChange={setShowRegistrationDialog}
        onSuccess={() => setLocation("/menu")}
      />

      {/* Media preloader */}
      <MediaPreloader onComplete={() => setMediaReady(true)} />

      {/* Responsive background container */}
      <div
        className="relative bg-cover bg-center bg-no-repeat md:w-full md:mx-auto w-screen h-screen"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          ...(screenDimensions.width > 768 ? {
            maxWidth: `${Math.min(420 * scaleFactor, screenDimensions.width * 0.95)}px`,
            height: `${containerHeight}px`,
            aspectRatio: '9/16',
          } : {
            width: '100vw',
            height: '100vh',
          })
        }}
      >
        {/* Content directly on background - dynamically scaled */}
        <div
          className="flex flex-col items-center justify-center h-full px-4"
          style={{
            padding: `${32 * scaleFactor}px ${16 * scaleFactor}px`,
            gap: `${24 * scaleFactor}px`,
          }}
        >

          {/* Restaurant POS Logo */}
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-2xl" style={{ 
              width: `${280 * scaleFactor}px`, 
              height: `${140 * scaleFactor}px`,
              padding: `${20 * scaleFactor}px`
            }}>
              <div className="flex flex-col items-center">
                <Store className="text-white mb-2" style={{ width: `${48 * scaleFactor}px`, height: `${48 * scaleFactor}px` }} />
                <h1 className="text-white font-bold text-center leading-tight" style={{ fontSize: `${28 * scaleFactor}px` }}>
                  RESTAURANT
                </h1>
                <h2 className="text-white font-semibold text-center" style={{ fontSize: `${20 * scaleFactor}px` }}>
                  POS SYSTEM
                </h2>
              </div>
            </div>
          </div>

          {/* Current Time and Date */}
          <div className="text-center bg-white/90 rounded-2xl shadow-lg" style={{ 
            padding: `${16 * scaleFactor}px ${24 * scaleFactor}px`,
            maxWidth: `${320 * scaleFactor}px`
          }}>
            <ISTClock 
              className="flex-wrap justify-center gap-3"
              timeClassName={`text-gray-800`}
              dateClassName={`text-gray-800`}
              iconSize={Math.round(16 * scaleFactor)}
            />
          </div>

          {/* Welcome Message */}
          <div className="text-center bg-white/90 rounded-2xl shadow-lg" style={{ 
            padding: `${20 * scaleFactor}px ${30 * scaleFactor}px`,
            maxWidth: `${320 * scaleFactor}px`
          }}>
            <h3 className="text-gray-800 font-semibold mb-2" style={{ fontSize: `${18 * scaleFactor}px` }}>
              Welcome to Restaurant POS
            </h3>
            <p className="text-gray-600" style={{ fontSize: `${12 * scaleFactor}px` }}>
              A modern point-of-sale system for restaurants
            </p>
          </div>

          {/* View Menu Button */}
          <button
            onClick={handleViewMenuClick}
            data-testid="button-view-menu"
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 flex items-center shadow-lg"
            style={{
              padding: `${14 * scaleFactor}px ${40 * scaleFactor}px`,
              gap: `${10 * scaleFactor}px`,
              fontSize: `${16 * scaleFactor}px`,
            }}
          >
            <Utensils style={{ width: `${22 * scaleFactor}px`, height: `${22 * scaleFactor}px` }} />
            <span>VIEW MENU</span>
          </button>

          {/* Features Section */}
          <div className="grid grid-cols-2 gap-4 w-full" style={{ 
            gap: `${12 * scaleFactor}px`,
            maxWidth: `${320 * scaleFactor}px`
          }}>
            <div className="bg-white/80 rounded-xl p-3 text-center" style={{ 
              padding: `${12 * scaleFactor}px`
            }}>
              <p className="text-orange-500 font-semibold" style={{ fontSize: `${11 * scaleFactor}px` }}>
                DIGITAL MENU
              </p>
              <p className="text-gray-600 text-xs mt-1" style={{ fontSize: `${9 * scaleFactor}px` }}>
                Interactive & Easy
              </p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center" style={{ 
              padding: `${12 * scaleFactor}px`
            }}>
              <p className="text-orange-500 font-semibold" style={{ fontSize: `${11 * scaleFactor}px` }}>
                QUICK SERVICE
              </p>
              <p className="text-gray-600 text-xs mt-1" style={{ fontSize: `${9 * scaleFactor}px` }}>
                Fast & Efficient
              </p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center" style={{ 
              padding: `${12 * scaleFactor}px`
            }}>
              <p className="text-orange-500 font-semibold" style={{ fontSize: `${11 * scaleFactor}px` }}>
                EASY ORDERING
              </p>
              <p className="text-gray-600 text-xs mt-1" style={{ fontSize: `${9 * scaleFactor}px` }}>
                Simple & Smooth
              </p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 text-center" style={{ 
              padding: `${12 * scaleFactor}px`
            }}>
              <p className="text-orange-500 font-semibold" style={{ fontSize: `${11 * scaleFactor}px` }}>
                24/7 ACCESS
              </p>
              <p className="text-gray-600 text-xs mt-1" style={{ fontSize: `${9 * scaleFactor}px` }}>
                Always Available
              </p>
            </div>
          </div>

          {/* Developer Credit */}
          <div
            className="text-center text-gray-600"
            style={{ fontSize: `${10 * scaleFactor}px` }}
          >
            <p>Developed By</p>
            <p
              className="text-orange-500 font-medium cursor-pointer no-underline"
              onClick={() => window.open("http://www.airavatatechnologies.com", "_blank")}
              style={{ textDecoration: 'none' }}
            >
              AIRAVATA TECHNOLOGIES
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
