import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import 'ol/ol.css';

interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  name: string;
  type: 'customer' | 'supplier' | 'warehouse' | 'project' | 'personnel';
  info?: string;
  status?: string;
}

interface GISMapProps {
  markers: MapMarker[];
  selectedMarker?: MapMarker;
  onMarkerClick?: (marker: MapMarker) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  showControls?: boolean;
}

const colorMap: Record<string, string> = {
  customer: '#3498db',
  supplier: '#e74c3c',
  warehouse: '#f39c12',
  project: '#27ae60',
  personnel: '#9b59b6',
};

const GISMap: React.FC<GISMapProps> = ({
  markers,
  selectedMarker,
  onMarkerClick,
  center = [116.4074, 39.9042],
  zoom = 10,
  height = '500px',
  showControls = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerLayerRef = useRef<VectorLayer | null>(null);
  const overlayRef = useRef<Overlay | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapLayer = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        crossOrigin: 'anonymous',
        attributions: [
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        ],
      }),
      visible: true,
    });

    const markerSource = new VectorSource();
    markerLayerRef.current = new VectorLayer({
      source: markerSource,
      style: (feature) => {
        const type = feature.get('type') as string;
        const isSelected = feature.get('isSelected') as boolean;
        const color = colorMap[type] || '#3498db';

        return new Style({
          image: new Circle({
            radius: isSelected ? 12 : 8,
            fill: new Fill({ color }),
            stroke: new Stroke({
              color: isSelected ? '#fff' : color,
              width: isSelected ? 3 : 1,
            }),
          }),
          text: new Text({
            text: feature.get('name') as string,
            offsetY: -15,
            font: '12px sans-serif',
            fill: new Fill({ color: '#333' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
        });
      },
    });

    const overlay = new Overlay({
      element: document.createElement('div'),
      positioning: 'bottom-center',
      offset: [0, -10],
    });
    overlayRef.current = overlay;

    const map = new Map({
      target: mapRef.current,
      layers: [mapLayer, markerLayerRef.current],
      overlays: [overlay],
      view: new View({
        center: fromLonLat(center),
        zoom: zoom,
        minZoom: 3,
        maxZoom: 18,
      }),
      controls: showControls ? undefined : [],
    });

    map.on('click', (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (f) => f
      );

      if (feature && onMarkerClick) {
        const marker: MapMarker = {
          id: feature.get('id'),
          longitude: feature.get('longitude'),
          latitude: feature.get('latitude'),
          name: feature.get('name'),
          type: feature.get('type'),
          info: feature.get('info'),
          status: feature.get('status'),
        };
        onMarkerClick(marker);
      }
    });

    map.on('moveend', () => {
      setCurrentZoom(map.getView().getZoom() || zoom);
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markerLayerRef.current) return;

    const source = markerLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    markers.forEach((marker) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.longitude, marker.latitude])),
        id: marker.id,
        name: marker.name,
        type: marker.type,
        info: marker.info,
        status: marker.status,
        isSelected: selectedMarker?.id === marker.id,
      });
      source.addFeature(feature);
    });
  }, [markers, selectedMarker]);

  useEffect(() => {
    if (selectedMarker && mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat([selectedMarker.longitude, selectedMarker.latitude]),
        duration: 500,
      });
    }
  }, [selectedMarker]);

  const zoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        zoom: currentZoom + 1,
        duration: 250,
      });
    }
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        zoom: currentZoom - 1,
        duration: 250,
      });
    }
  };

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat(center),
        zoom: zoom,
        duration: 500,
      });
    }
  };

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />

      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={zoomIn}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            title="放大"
          >
            <span className="text-xl font-bold">+</span>
          </button>
          <button
            onClick={zoomOut}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            title="缩小"
          >
            <span className="text-xl font-bold">−</span>
          </button>
          <button
            onClick={resetView}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
            title="重置视图"
          >
            <span className="text-xs font-medium">重置</span>
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-10">
        <div className="text-xs font-medium text-gray-600 mb-2">图例</div>
        <div className="space-y-1">
          {Object.entries(colorMap).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-600">
                {type === 'customer' && '客户'}
                {type === 'supplier' && '供应商'}
                {type === 'warehouse' && '仓库'}
                {type === 'project' && '工程项目'}
                {type === 'personnel' && '外勤人员'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md px-3 py-1 z-10">
        <span className="text-xs text-gray-500">缩放级别: {currentZoom.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default GISMap;