import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function CountryMap({ country }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'osm'

    const latlng = useMemo(() => {
        return country.latlng && country.latlng.length === 2 ? country.latlng : [20, 0];
    }, [country.latlng]);

    const capital = country.capital?.[0] || country.name.common;
    const countryName = country.name.common;
    const countryArea = country.area || 0;

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize map instance once
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: latlng,
                zoom: 4,
                zoomControl: false,
                attributionControl: false,
            });

            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;

        // Select tile layer
        const tileUrl = mapStyle === 'dark'
            ? 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        // Remove previous tile layers
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        L.tileLayer(tileUrl, {
            maxZoom: 18,
            subdomains: 'abcd',
        }).addTo(map);

        // Smoothly pan & zoom to country
        const zoom = countryArea > 5000000 ? 3 : countryArea > 500000 ? 4 : 5;
        map.flyTo(latlng, zoom, { duration: 1.2 });

        // Create radar beacon marker
        if (markerRef.current) {
            map.removeLayer(markerRef.current);
        }

        const radarIcon = L.divIcon({
            className: 'osm-radar-marker',
            html: `
                <div class="osm-beacon-outer"></div>
                <div class="osm-beacon-inner"></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        const marker = L.marker(latlng, { icon: radarIcon }).addTo(map);
        marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #111;">
                <strong>${countryName}</strong><br/>
                Capital: ${capital}<br/>
                ${latlng[0].toFixed(2)}°, ${latlng[1].toFixed(2)}°
            </div>
        `);
        markerRef.current = marker;

        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return () => clearTimeout(timer);
    }, [country.cca3, latlng, capital, mapStyle, countryArea, countryName]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="hud-card map-card-hud">
            <div className="map-hud-header">
                <div className="map-title-row">
                    <span className="hud-panel-title">OpenStreetMap Geo Radar</span>
                    <span className="map-coords-badge">
                        {latlng[0].toFixed(2)}° N, {latlng[1].toFixed(2)}° E
                    </span>
                </div>

                <div className="map-style-toggle">
                    <button
                        className={`map-style-btn ${mapStyle === 'dark' ? 'active' : ''}`}
                        onClick={() => setMapStyle('dark')}
                    >
                        Dark
                    </button>
                    <button
                        className={`map-style-btn ${mapStyle === 'osm' ? 'active' : ''}`}
                        onClick={() => setMapStyle('osm')}
                    >
                        OSM
                    </button>
                </div>
            </div>

            <div className="map-viewport-wrapper">
                <div ref={mapContainerRef} className="osm-leaflet-container" />
                <div className="map-overlay-badge">
                    <span>📍 {capital}</span>
                </div>
            </div>
        </div>
    );
}
