import 'leaflet'

declare module 'leaflet' {
  type HeatLatLngTuple = [number, number, number]

  type HeatLayerOptions = {
    blur?: number
    gradient?: Record<number, string>
    max?: number
    maxZoom?: number
    minOpacity?: number
    radius?: number
  }

  interface HeatLayer extends Layer {
    setLatLngs(latlngs: HeatLatLngTuple[]): this
    setOptions(options: HeatLayerOptions): this
  }

  function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions,
  ): HeatLayer
}

declare module 'leaflet.heat'
