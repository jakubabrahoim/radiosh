import { FloatingTooltip } from "@mantine/core";
import { scaleLinear } from "d3-scale";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import world from "./world.json";

interface Country {
  name: string;
  iso_3166_1: string;
  stationcount: number;
}

export function WorldMap() {
  const [tooltipContent, setTooltipContent] = useState<string>("");

  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    // Countries
    fetch(`https://at1.api.radio-browser.info/json/countries`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "radio-stream.live",
      },
    })
      .then((response) => response.json())
      .then(setCountries);
  }, []);

  /* Fetch stations for selected country and navigate to new page with these stations */
  function fetchRadioStationsForCountry(countryName: string): void {
    fetch(
      `https://at1.api.radio-browser.info/json/stations/bycountry/${countryName}?hidebroken=true&order=clickcount&reverse=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "radio-stream.live",
        },
      }
    )
      .then((response) => response.json())
      .then((response) => {
        navigate(`/countries/${countryName}`, {
          state: { stations: response },
        });
      })
      .catch((error) => console.log(error));
  }

  const colorsScale = scaleLinear<string>()
    .domain([
      Math.min(...countries.map((c) => c.stationcount)),
      Math.max(...countries.map((c) => c.stationcount)),
    ])
    .range(["#3B4F68", "#1f2937"]);

  return (
    <FloatingTooltip disabled={tooltipContent === ""} label={tooltipContent}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 60,
          rotate: [-10, 0, 0],
          center: [0, 40],
        }}
        height={350}
      >
        <ZoomableGroup
        translateExtent={[
          [0, 0],
          [800, 270]
        ]}>
          <Geographies geography={world}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const country = countries.find(
                  (c) => c.iso_3166_1 === geo.properties["Alpha-2"]
                );
                
                const stations = country?.stationcount ?? 0;

                return (
                  <Geography
                    className={`${
                      stations > 0 ? "hover:cursor-pointer" : undefined
                    }`}
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      hover: { fill: stations > 0 ? "#ef4444" : undefined },
                    }}
                    onMouseEnter={() => {
                      setTooltipContent(
                        `${geo.properties.name}: ${stations} ${
                          stations === 1 ? "station" : "stations"
                        } `
                      );
                    }}
                    onMouseLeave={() => setTooltipContent("")}
                    onClick={() => {
                      if (country) {
                        fetchRadioStationsForCountry(country.name);
                      }
                    }}
                    fill={country ? colorsScale(stations) : "#CDCDCD"}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </FloatingTooltip>
  );
}
