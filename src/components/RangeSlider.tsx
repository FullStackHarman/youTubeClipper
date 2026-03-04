import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    isLoading?: boolean;
}

export default function RangeSlider({ min, max, value, onChange, isLoading }: RangeSliderProps) {

    const format = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        const timeString = date.toISOString().substr(11, 8);
        return timeString.startsWith('00:') ? timeString.substr(3) : timeString;
    };

    return (
        <div className="w-full glass-card p-6 rounded-xl mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-4">
                <span>Start: <span className="text-white font-mono">{format(value[0])}</span></span>
                <span>End: <span className="text-white font-mono">{format(value[1])}</span></span>
            </div>

            <div className="px-2"> {/* Added padding for handles */}
                <Slider
                    range
                    min={min}
                    max={max}
                    value={value}
                    onChange={(val) => onChange(val as [number, number])}
                    disabled={isLoading}
                    trackStyle={[{ backgroundColor: '#3b82f6', height: 6 }]}
                    handleStyle={[
                        { borderColor: '#60a5fa', backgroundColor: '#1e293b', opacity: 1, width: 20, height: 20, marginTop: -7 },
                        { borderColor: '#60a5fa', backgroundColor: '#1e293b', opacity: 1, width: 20, height: 20, marginTop: -7 }
                    ]}
                    railStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', height: 6 }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{format(min)}</span>
                <span>{format(max)}</span>
            </div>
        </div>
    );
}
