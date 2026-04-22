import L from 'leaflet';

export const createCustomIcon = (color: string, iconHtml: string, size: number = 40) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="marker-container" style="width: ${size}px; height: ${size}px;">
        <div class="marker-pin" style="background-color: ${color};">
          <div class="marker-icon">${iconHtml}</div>
        </div>
        <div class="marker-pulse" style="background-color: ${color}; opacity: 0.4;"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export const markerStyles = `
  .custom-map-marker {
    background: none !important;
    border: none !important;
  }
  
  .marker-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
    transition: transform 0.2s ease;
  }
  
  .marker-container:hover {
    transform: scale(1.1) translateY(-4px);
    z-index: 1000;
  }
  
  .marker-pin {
    width: 100%;
    height: 100%;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 2;
  }
  
  .marker-icon {
    transform: rotate(45deg);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .marker-pulse {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    z-index: 1;
    animation: marker-pulse 2s infinite;
  }
  
  @keyframes marker-pulse {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    100% {
      transform: scale(2.5);
      opacity: 0;
    }
  }
`;
