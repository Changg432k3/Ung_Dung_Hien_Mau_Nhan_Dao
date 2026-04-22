import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/store/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { MapPin, Users, Heart } from 'lucide-react';

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

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const DonorMapSection: React.FC = () => {
  const { users, currentUser } = useApp();
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.762622, 106.660172]); // Default to HCMC

  const donorIcon = React.useMemo(() => new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1297/1297136.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }), []);

  const donors = users.filter(u => u.role === 'donor' && u.lat && u.lng);

  useEffect(() => {
    if (currentUser?.lat && currentUser?.lng) {
      setMapCenter([currentUser.lat, currentUser.lng]);
    }
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bản đồ người hiến máu</h2>
          <p className="text-muted-foreground">Kết nối với cộng đồng người hiến máu trong khu vực của bạn.</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1">
          <Users className="w-4 h-4" />
          <span>{donors.length} người hiến máu</span>
        </Badge>
      </div>

      <Card className="border-2 overflow-hidden">
        <div className="h-[500px] relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap lat={mapCenter[0]} lng={mapCenter[1]} />
            
            {donors.map((donor) => (
              <Marker 
                key={donor.id} 
                position={[donor.lat!, donor.lng!]}
                icon={donorIcon}
              >
                <Popup className="donor-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={donor.avatar || undefined} alt={donor.name} />
                        <AvatarFallback>{donor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm leading-none mb-1">{donor.name}</p>
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          Nhóm {donor.bloodGroup}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Heart className="w-3 h-3 text-primary" />
                        <span>{donor.donationsCount} lần hiến máu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{donor.address}</span>
                      </div>
                    </div>
                    
                    {donor.id === currentUser?.id && (
                      <div className="mt-3 pt-2 border-t text-center">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                          Đây là bạn
                        </Badge>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border text-xs space-y-2">
            <p className="font-bold mb-1">Chú thích:</p>
            <div className="flex items-center gap-2">
              <img src="https://cdn-icons-png.flaticon.com/512/1297/1297136.png" className="w-4 h-4" alt="Donor icon" />
              <span>Người hiến máu</span>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Lan tỏa yêu thương
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mỗi giọt máu cho đi, một cuộc đời ở lại. Hãy cùng nhau xây dựng cộng đồng hiến máu vững mạnh.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Kết nối cộng đồng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tìm kiếm và kết nối với những người hiến máu khác trong khu vực để cùng tham gia các sự kiện.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Vị trí thuận tiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dễ dàng tìm thấy các điểm hiến máu và cộng đồng hỗ trợ gần nơi bạn sinh sống nhất.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DonorMapSection;
