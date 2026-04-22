import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Button } from './ui/Button';

// Fix Leaflet marker icon issue
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  address: string;
  onChange: (lat: number, lng: number, address: string) => void;
  required?: boolean;
}

const DraggableMarker = ({ lat, lng, setPosition }: { lat: number, lng: number, setPosition: (lat: number, lng: number) => void }) => {
  const markerRef = useRef<L.Marker>(null);
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const pos = marker.getLatLng();
        setPosition(pos.lat, pos.lng);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      ref={markerRef}
    />
  );
};

const MapEvents = ({ setPosition }: { setPosition: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapUpdater = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, address, onChange, required }) => {
  const [searchQuery, setSearchQuery] = useState(address);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (address !== searchQuery) {
      setSearchQuery(address);
    }
  }, [address]);

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=vn`);
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching address:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onChange(lat, lng, value); // Update parent with new address text
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        onChange(latitude, longitude, data.display_name);
        setSearchQuery(data.display_name);
      } else {
        onChange(latitude, longitude, address);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      onChange(latitude, longitude, address);
    }
  };

  const handleSelectResult = (result: any) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    onChange(newLat, newLng, result.display_name);
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handlePositionChange = (newLat: number, newLng: number) => {
    reverseGeocode(newLat, newLng);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handlePositionChange(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting current location:", error);
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            onBlur={() => {
              // Delay hiding to allow clicking results
              setTimeout(() => setShowResults(false), 200);
            }}
            placeholder="Tìm kiếm địa chỉ..."
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
            required={required}
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
            title="Vị trí hiện tại"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
        
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={result.place_id || index}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-start gap-2 border-b border-slate-100 last:border-0"
                onClick={() => handleSelectResult(result)}
              >
                <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                <span className="text-sm text-slate-700">{result.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden border border-slate-200 relative z-0">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater lat={lat} lng={lng} />
          <MapEvents setPosition={handlePositionChange} />
          <DraggableMarker lat={lat} lng={lng} setPosition={handlePositionChange} />
        </MapContainer>
        <div className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 shadow-sm border border-slate-200 pointer-events-none">
          Kéo thả marker hoặc click trên bản đồ để chọn vị trí
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Tọa độ: {lat.toFixed(6)}, {lng.toFixed(6)}</span>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <Navigation className="w-3 h-3" />
          Xem trên Google Maps
        </a>
      </div>
    </div>
  );
};
