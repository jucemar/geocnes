import loadGoogleMapsApi from 'load-google-maps-api'

export class GoogleMapsApi{  

    static config(){       
        return loadGoogleMapsApi(
            { key: process.env.GOOGLEMAPS_GOOGLEMAPS_APIKEY },
            { language: "pt-BR" },
            { region: "BR" }
        )   
    }   
}