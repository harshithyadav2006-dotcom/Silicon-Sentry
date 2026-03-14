const buildMapUrl = (points) => {
  if (!points.length) {
    return "https://www.openstreetmap.org/export/embed.html?bbox=77.45%2C12.84%2C77.75%2C13.12&layer=mapnik";
  }

  const latitudes = points.map((point) => Number(point.lat));
  const longitudes = points.map((point) => Number(point.lng));
  const minLat = Math.min(...latitudes) - 0.03;
  const maxLat = Math.max(...latitudes) + 0.03;
  const minLng = Math.min(...longitudes) - 0.03;
  const maxLng = Math.max(...longitudes) + 0.03;
  const primary = points[0];

  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${primary.lat}%2C${primary.lng}`;
};

const getBounds = (points) => {
  if (!points.length) {
    return {
      minLat: 12.84,
      maxLat: 13.12,
      minLng: 77.45,
      maxLng: 77.75,
    };
  }

  const latitudes = points.map((point) => Number(point.lat));
  const longitudes = points.map((point) => Number(point.lng));

  return {
    minLat: Math.min(...latitudes) - 0.03,
    maxLat: Math.max(...latitudes) + 0.03,
    minLng: Math.min(...longitudes) - 0.03,
    maxLng: Math.max(...longitudes) + 0.03,
  };
};

const getMapPosition = (point, bounds) => {
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  const left = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const top = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    left: `${Math.min(Math.max(left, 8), 92)}%`,
    top: `${Math.min(Math.max(top, 10), 90)}%`,
  };
};

const getHeatTone = (priority, weight) => {
  const intensity = Math.min(Math.max(weight || 0.45, 0.35), 1);

  if (priority === "High") {
    return {
      core: `rgba(239, 68, 68, ${0.16 + intensity * 0.16})`,
      edge: `rgba(239, 68, 68, ${0.42 + intensity * 0.18})`,
      pin: "#1f3b73",
    };
  }

  if (priority === "Medium") {
    return {
      core: `rgba(245, 158, 11, ${0.14 + intensity * 0.14})`,
      edge: `rgba(245, 158, 11, ${0.38 + intensity * 0.14})`,
      pin: "#355f9b",
    };
  }

  return {
    core: `rgba(31, 157, 115, ${0.12 + intensity * 0.12})`,
    edge: `rgba(31, 157, 115, ${0.32 + intensity * 0.12})`,
    pin: "#2f855a",
  };
};

function HeatMap({ points, copy }) {
  const bounds = getBounds(points);

  return (
    <div className="heatmap-shell">
      <div className="heatmap-map">
        <iframe
          className="heatmap-frame"
          title={copy.heatmap.title}
          src={buildMapUrl(points)}
        />
        <div className="heat-overlay">
          {points.map((point, index) => (
            <div key={point.id}>
              <div
                className={`heat-pulse ${point.priority.toLowerCase()}`}
                style={{
                  ...getMapPosition(point, bounds),
                  width: `${96 + point.weight * 108}px`,
                  height: `${96 + point.weight * 108}px`,
                  background: `radial-gradient(circle, ${
                    getHeatTone(point.priority, point.weight).edge
                  } 0%, ${getHeatTone(point.priority, point.weight).core} 34%, rgba(255,255,255,0) 72%)`,
                }}
              />
              <div
                className={`heat-pin ${point.priority.toLowerCase()}`}
                style={{
                  ...getMapPosition(point, bounds),
                  background: getHeatTone(point.priority, point.weight).pin,
                  transform: `translate(-50%, -100%) scale(${0.92 + point.weight * 0.12})`,
                }}
                title={`${point.subject} - ${point.priority}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <div>
          <strong>{copy.heatmap.legendTitle}</strong>
          <p>{copy.heatmap.legendBody}</p>
        </div>
        <div className="legend-scale">
          <span className="legend-chip high">{copy.heatmap.high}</span>
          <span className="legend-chip medium">{copy.heatmap.medium}</span>
          <span className="legend-chip low">{copy.heatmap.low}</span>
        </div>
      </div>
    </div>
  );
}

export default HeatMap;
