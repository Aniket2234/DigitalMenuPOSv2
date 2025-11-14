import { useState, useEffect } from "react";
import { formatISTTime, formatISTDate } from "@shared/utils/timezone";
import { Clock, Calendar } from "lucide-react";

interface ISTClockProps {
  showDate?: boolean;
  showTime?: boolean;
  className?: string;
  timeClassName?: string;
  dateClassName?: string;
  iconSize?: number;
}

export function ISTClock({ 
  showDate = true, 
  showTime = true, 
  className = "",
  timeClassName = "",
  dateClassName = "",
  iconSize = 16
}: ISTClockProps) {
  const [currentTime, setCurrentTime] = useState(formatISTTime());
  const [currentDate, setCurrentDate] = useState(formatISTDate());

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(formatISTTime(now));
      setCurrentDate(formatISTDate(now));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="ist-clock">
      {showTime && (
        <div className={`flex items-center gap-1.5 ${timeClassName}`} data-testid="ist-time">
          <Clock className="flex-shrink-0" size={iconSize} />
          <span className="font-medium">{currentTime}</span>
        </div>
      )}
      {showDate && (
        <div className={`flex items-center gap-1.5 ${dateClassName}`} data-testid="ist-date">
          <Calendar className="flex-shrink-0" size={iconSize} />
          <span className="font-medium">{currentDate}</span>
        </div>
      )}
    </div>
  );
}
